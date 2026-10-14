import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { parsePdfBuffer, findRelevantPassages, computeFileHash } from '../pdfService';
import { analyzePaperDocument, askPaperQuestion, analyzeAiLikelihood } from '../gemini';
import { dispatchWorkflowEvent } from '../n8nService';
import { ResearchPaper } from '../types';

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory multer storage to inspect buffer and compute SHA-256 hash
const upload = multer({
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are supported'));
    }
  },
});

/**
 * Upload single or multiple research papers
 */
router.post('/upload', upload.array('papers', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No PDF files were uploaded' });
    }

    const user = db.getCurrentUser();
    const uploadedPapers: ResearchPaper[] = [];

    for (const file of files) {
      const fileHash = computeFileHash(file.buffer);

      // Duplicate detection
      const existingPaper = db.getPaperByHash(fileHash);
      if (existingPaper) {
        uploadedPapers.push({
          ...existingPaper,
          tags: [...new Set([...existingPaper.tags, 'Duplicate Upload Detected'])],
        });
        continue;
      }

      // Save file to disk
      const diskFileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const diskFilePath = path.join(UPLOADS_DIR, diskFileName);
      fs.writeFileSync(diskFilePath, file.buffer);

      // Parse PDF
      const pdfData = await parsePdfBuffer(file.buffer);
      const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Infer or extract title
      const rawFallbackName = file.originalname.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      let paperTitle = pdfData.metadata?.title || rawFallbackName;
      
      // If metadata title is missing or suspicious, inspect first lines
      const textLines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      if (!pdfData.metadata?.title || pdfData.metadata.title.length < 5 || paperTitle.startsWith('<') || paperTitle.includes('/Type')) {
        if (textLines.length > 0) {
          // Combine first 2 lines if first line is a title fragment
          const candidate1 = textLines[0];
          const candidate2 = textLines[1] || '';
          if (candidate1 && candidate1.length < 90 && !candidate1.includes('@') && !candidate1.includes('http')) {
            if (candidate2 && candidate2.length < 90 && !candidate2.includes('@') && !candidate2.includes(',') && !candidate2.includes('University')) {
              paperTitle = `${candidate1} ${candidate2}`;
            } else {
              paperTitle = candidate1;
            }
          }
        }
      }

      // Final sanitization of paperTitle
      if (!paperTitle || paperTitle.startsWith('<') || paperTitle.includes('/Type') || paperTitle.includes('endobj')) {
        paperTitle = rawFallbackName;
      }

      // Infer authors
      let authors = pdfData.metadata?.author ? [pdfData.metadata.author] : [];
      if (authors.length === 0 && textLines.length > 1) {
        // Look for author list line (often line 2 or 3, containing commas or 'and')
        const authorLine = textLines.slice(1, 4).find(l => (l.includes(',') || l.includes(' and ')) && !l.includes('Abstract') && !l.includes('Introduction') && l.length < 150);
        if (authorLine) {
          authors = authorLine.split(/,| and /).map(a => a.trim()).filter(a => a.length > 2 && a.length < 40);
        }
      }
      if (authors.length === 0) {
        authors = ['Academic Authors'];
      }

      const newPaper: ResearchPaper = {
        id: paperId,
        userId: user.id,
        title: paperTitle,
        authors,
        fileHash,
        fileName: file.originalname,
        fileSize: file.size,
        filePath: `/uploads/${diskFileName}`,
        pageCount: pdfData.pageCount,
        extractedText: pdfData.text,
        uploadDate: new Date().toISOString(),
        status: 'processing',
        tags: ['Academic Paper', `${pdfData.pageCount} Pages`],
        categories: ['General Science'],
        collections: ['Default Library'],
      };

      db.addPaper(newPaper);

      // Dispatch Workflow A (Automated Paper Processing) via n8n
      await dispatchWorkflowEvent('workflow_a_paper_processing', {
        paperId,
        fileName: file.originalname,
        fileHash,
        pageCount: pdfData.pageCount,
      });

      // Run deep AI analysis & AI likelihood analysis
      try {
        const [analysisResult, likelihoodResult] = await Promise.allSettled([
          analyzePaperDocument({
            title: paperTitle,
            textSnippet: pdfData.text,
            pageCount: pdfData.pageCount,
          }),
          analyzeAiLikelihood(pdfData.text, pdfData.pages),
        ]);

        const analysis: any = analysisResult.status === 'fulfilled' ? analysisResult.value : undefined;
        const rawLikelihood: any = likelihoodResult.status === 'fulfilled' ? likelihoodResult.value : undefined;
        const aiLikelihood = rawLikelihood ? { ...rawLikelihood, analyzedAt: rawLikelihood.analyzedAt || new Date().toISOString() } : undefined;

        const updated = db.updatePaper(paperId, {
          status: 'analyzed',
          analysis: analysis || undefined,
          aiLikelihood: aiLikelihood || undefined,
          tags: analysis?.suggestedTags ? [...newPaper.tags, ...analysis.suggestedTags] : newPaper.tags,
        });

        if (updated) {
          uploadedPapers.push(updated);
        }
      } catch (analysisErr) {
        console.error('Error in paper analysis:', analysisErr);
        const updated = db.updatePaper(paperId, { status: 'analyzed' });
        if (updated) uploadedPapers.push(updated);
      }

      // Add Notification
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: user.id,
        title: 'Paper Processed & Indexed',
        message: `Successfully extracted and analyzed "${paperTitle.slice(0, 45)}"`,
        type: 'success',
        category: 'paper',
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/papers/${paperId}`,
      });
    }

    return res.json({ papers: uploadedPapers });
  } catch (error: any) {
    console.error('Upload failed:', error);
    return res.status(500).json({ error: error?.message || 'Failed to upload and process PDF papers' });
  }
});

/**
 * Get all papers
 */
router.get('/', (req, res) => {
  const { query, collection, tag } = req.query;
  let papers = db.getPapers();

  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    papers = papers.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.authors.some(a => a.toLowerCase().includes(q)) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (collection && typeof collection === 'string') {
    papers = papers.filter(p => p.collections.includes(collection));
  }

  if (tag && typeof tag === 'string') {
    papers = papers.filter(p => p.tags.includes(tag));
  }

  return res.json({ papers });
});

/**
 * Get single paper
 */
router.get('/:id', (req, res) => {
  const paper = db.getPaperById(req.params.id);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  return res.json({ paper });
});

/**
 * Chat with paper (RAG with citations)
 */
router.post('/:id/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Please provide a question' });
    }

    const paper = db.getPaperById(req.params.id);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Split paper text into pages
    const pages = (paper.extractedText || '').split('\f').map((t, idx) => ({
      pageNumber: idx + 1,
      text: t.trim(),
    }));

    // Find relevant passages
    const passages = findRelevantPassages(pages.length > 0 ? pages : [{ pageNumber: 1, text: paper.extractedText }], question, 4);

    const answerResponse = await askPaperQuestion({
      paperTitle: paper.title,
      relevantPassages: passages,
      userQuestion: question,
    });

    return res.json(answerResponse);
  } catch (err: any) {
    console.error('Error chatting with paper:', err);
    return res.status(500).json({ error: err?.message || 'Failed to answer question.' });
  }
});

/**
 * Re-trigger AI likelihood analysis
 */
router.post('/:id/ai-likelihood', async (req, res) => {
  try {
    const paper = db.getPaperById(req.params.id);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const pages = (paper.extractedText || '').split('\f').map((t, idx) => ({
      pageNumber: idx + 1,
      text: t.trim(),
    }));

    const rawResult: any = await analyzeAiLikelihood(paper.extractedText, pages);
    const result = { ...rawResult, analyzedAt: rawResult.analyzedAt || new Date().toISOString() };
    const updated = db.updatePaper(paper.id, { aiLikelihood: result });

    return res.json({ aiLikelihood: result, paper: updated });
  } catch (err: any) {
    console.error('Error re-running AI likelihood:', err);
    return res.status(500).json({ error: err?.message || 'Failed to analyze AI likelihood.' });
  }
});

/**
 * Delete a paper
 */
router.delete('/:id', (req, res) => {
  const success = db.deletePaper(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  return res.json({ success: true });
});

export default router;
