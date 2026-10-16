import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ResearchPaper, PaperSentenceAnalysis, AiLikelihoodReport } from '../types';

interface TextItemMatch {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract positional text items from a specific page using pdfjs-dist
 */
async function extractPageTextItems(pdfData: Uint8Array, pageNumber: number): Promise<TextItemMatch[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0,
    });
    const doc = await loadingTask.promise;
    if (pageNumber < 1 || pageNumber > doc.numPages) return [];

    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const items: TextItemMatch[] = [];

    for (const item of textContent.items as any[]) {
      if (!item.str || typeof item.str !== 'string') continue;
      const str = item.str.trim();
      if (!str) continue;

      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4];
      const y = transform[5];
      const width = item.width || Math.abs(transform[0]) * str.length * 0.5 || 20;
      const height = item.height || Math.abs(transform[3]) || 11;

      items.push({
        str,
        x,
        y,
        width,
        height,
      });
    }

    return items;
  } catch (err) {
    console.warn(`Could not extract text coordinates for page ${pageNumber}:`, err);
    return [];
  }
}

/**
 * Locate text items on a page that correspond to words in a flagged sentence
 */
function locateSentenceInItems(sentence: string, items: TextItemMatch[]): { x: number; y: number; width: number; height: number }[] {
  if (!sentence || items.length === 0) return [];

  // Normalize words in sentence
  const sentenceWords = sentence
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (sentenceWords.length === 0) return [];

  // Find items whose text overlaps with significant words in this sentence
  const matchedItems: TextItemMatch[] = [];

  for (const item of items) {
    const itemWords = item.str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const hasMatch = itemWords.some(iw => sentenceWords.includes(iw));
    if (hasMatch) {
      matchedItems.push(item);
    }
  }

  if (matchedItems.length === 0) return [];

  // Group matched items into horizontal line strips (items with close y coordinates within 4 points)
  const lines: TextItemMatch[][] = [];
  for (const item of matchedItems) {
    let foundLine = lines.find(l => Math.abs(l[0].y - item.y) <= 4);
    if (foundLine) {
      foundLine.push(item);
    } else {
      lines.push([item]);
    }
  }

  // Convert each line into a single merged bounding box
  const boundingBoxes: { x: number; y: number; width: number; height: number }[] = [];
  for (const line of lines) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxHeight = 12;

    for (const it of line) {
      if (it.x < minX) minX = it.x;
      if (it.x + it.width > maxX) maxX = it.x + it.width;
      if (it.y < minY) minY = it.y;
      if (it.height > maxHeight) maxHeight = it.height;
    }

    if (minX < maxX) {
      boundingBoxes.push({
        x: Math.max(20, minX - 1),
        y: minY - 2, // extend slightly below baseline
        width: Math.min(560, maxX - minX + 2),
        height: Math.min(30, maxHeight + 3),
      });
    }
  }

  return boundingBoxes;
}

/**
 * Generate a genuinely highlighted PDF based on the original uploaded document,
 * overlaying translucent highlights on flagged sentences, adding page margin badges,
 * and prepending a comprehensive ResearchLens AI Analysis Audit & Legend Page.
 */
export async function generateHighlightedPdf(
  originalPdfBuffer: Buffer,
  paper: ResearchPaper,
  aiReport: AiLikelihoodReport
): Promise<Buffer> {
  // Load original PDF document with pdf-lib
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const uint8Buffer = new Uint8Array(originalPdfBuffer);
  const pages = pdfDoc.getPages();
  const threshold = aiReport.selectedThreshold || 60;

  // Filter flagged sentences
  const flaggedSentences = (aiReport.sentences || []).filter(s => s.aiScore >= threshold);

  // Group flagged sentences by page number
  const flaggedByPage: Record<number, PaperSentenceAnalysis[]> = {};
  for (const sent of flaggedSentences) {
    flaggedByPage[sent.pageNumber] = flaggedByPage[sent.pageNumber] || [];
    flaggedByPage[sent.pageNumber].push(sent);
  }

  let totalHighlightsApplied = 0;
  let isScanned = aiReport.isScannedPdf || false;

  // 1. Process each page of original PDF
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageNumber = pageIdx + 1;
    const page = pages[pageIdx];
    const { width, height } = page.getSize();
    const pageFlagged = flaggedByPage[pageNumber] || [];

    if (pageFlagged.length === 0) continue;

    // Extract text coordinates for this page
    const textItems = await extractPageTextItems(uint8Buffer, pageNumber);

    if (textItems.length === 0) {
      isScanned = true;
    }

    for (const sent of pageFlagged) {
      // Choose color based on AI Likelihood score:
      // Red/Orange for High AI Likelihood (>= 65%)
      // Amber/Yellow for Moderate AI Likelihood (40 - 64%)
      const isHighAi = sent.aiScore >= 65;
      const highlightColor = isHighAi
        ? rgb(0.96, 0.26, 0.21) // High AI: Red/Orange
        : rgb(0.98, 0.72, 0.14); // Moderate: Amber/Yellow

      const boxes = locateSentenceInItems(sent.text, textItems);

      if (boxes.length > 0) {
        for (const box of boxes) {
          // Draw translucent highlight box over text
          page.drawRectangle({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            color: highlightColor,
            opacity: 0.32,
          });
          totalHighlightsApplied++;
        }
      } else {
        // Fallback for pages where precise character matrices are non-standard or font is symbol-mapped:
        // Draw an unobtrusive right-margin callout flag
        const yPos = Math.max(40, height - 70 - (sent.sentenceIndex * 24));
        page.drawRectangle({
          x: width - 85,
          y: yPos,
          width: 80,
          height: 18,
          color: highlightColor,
          opacity: 0.85,
        });
        page.drawText(`AI: ${sent.aiScore}% (P.${sent.pageNumber})`, {
          x: width - 80,
          y: yPos + 4,
          size: 7,
          font: fontHelveticaBold,
          color: rgb(1, 1, 1),
        });
        totalHighlightsApplied++;
      }
    }

    // Add a discreet header banner indicator on pages containing highlights
    page.drawText(`[ResearchLens AI Highlighted • Page ${pageNumber} • ${pageFlagged.length} Flagged Passage(s)]`, {
      x: 35,
      y: height - 20,
      size: 7,
      font: fontHelvetica,
      color: rgb(0.45, 0.45, 0.45),
    });
  }

  // 2. Prepend a Comprehensive "ResearchLens AI Content & Stylometric Audit Report" Page (Page 1)
  const auditPage = pdfDoc.insertPage(0, [595.28, 841.89]); // Standard A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Background
  auditPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.97, 0.98, 0.99),
  });

  // Header Banner
  auditPage.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: rgb(0.09, 0.11, 0.18),
  });

  auditPage.drawText('RESEARCHLENS • AI CONTENT & STYLOMETRIC AUDIT', {
    x: 40,
    y: pageHeight - 40,
    size: 15,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  auditPage.drawText('Independent Document-Level and Sentence-Level Stylometric Verification Report', {
    x: 40,
    y: pageHeight - 58,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.75, 0.82, 0.95),
  });

  let currentY = pageHeight - 115;

  // Metadata Box
  auditPage.drawRectangle({
    x: 40,
    y: currentY - 50,
    width: pageWidth - 80,
    height: 55,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  const cleanDocTitle = (paper.title || 'Untitled Research Document').slice(0, 75);
  auditPage.drawText(`Document: ${cleanDocTitle}`, {
    x: 52,
    y: currentY - 18,
    size: 10,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.15, 0.22),
  });

  auditPage.drawText(`Authors: ${(paper.authors || []).join(', ').slice(0, 60)} | Pages: ${paper.pageCount} | Evaluated: ${new Date().toLocaleDateString()}`, {
    x: 52,
    y: currentY - 32,
    size: 8,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.52),
  });

  auditPage.drawText(`Document SHA-256: ${(paper.fileHash || 'N/A').slice(0, 36)}... | Detection Threshold: ${threshold}%`, {
    x: 52,
    y: currentY - 45,
    size: 7.5,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.52),
  });

  currentY -= 75;

  // Metric Cards Row
  const cardWidth = (pageWidth - 80 - 24) / 3;

  // Card 1: Estimated AI Score
  auditPage.drawRectangle({
    x: 40,
    y: currentY - 60,
    width: cardWidth,
    height: 60,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.95, 0.6, 0.55),
    borderWidth: 1,
  });
  auditPage.drawText('ESTIMATED AI LIKELIHOOD', {
    x: 50,
    y: currentY - 18,
    size: 7.5,
    font: fontHelveticaBold,
    color: rgb(0.75, 0.2, 0.15),
  });
  auditPage.drawText(`${aiReport.overallAiScore}%`, {
    x: 50,
    y: currentY - 44,
    size: 22,
    font: fontHelveticaBold,
    color: rgb(0.85, 0.2, 0.15),
  });
  auditPage.drawText(`Confidence: ${aiReport.confidence}`, {
    x: 105,
    y: currentY - 38,
    size: 8,
    font: fontHelvetica,
    color: rgb(0.45, 0.45, 0.45),
  });

  // Card 2: Estimated Human Score
  auditPage.drawRectangle({
    x: 40 + cardWidth + 12,
    y: currentY - 60,
    width: cardWidth,
    height: 60,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.55, 0.85, 0.65),
    borderWidth: 1,
  });
  auditPage.drawText('ESTIMATED HUMAN COMPOSITION', {
    x: 50 + cardWidth + 12,
    y: currentY - 18,
    size: 7.5,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.55, 0.25),
  });
  auditPage.drawText(`${aiReport.overallHumanScore}%`, {
    x: 50 + cardWidth + 12,
    y: currentY - 44,
    size: 22,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.6, 0.25),
  });

  // Card 3: Sentences Flagged
  auditPage.drawRectangle({
    x: 40 + (cardWidth * 2) + 24,
    y: currentY - 60,
    width: cardWidth,
    height: 60,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.85, 0.92),
    borderWidth: 1,
  });
  auditPage.drawText('FLAGGED SENTENCES', {
    x: 50 + (cardWidth * 2) + 24,
    y: currentY - 18,
    size: 7.5,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.3, 0.5),
  });
  auditPage.drawText(`${flaggedSentences.length}`, {
    x: 50 + (cardWidth * 2) + 24,
    y: currentY - 44,
    size: 22,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.3, 0.55),
  });
  auditPage.drawText(`of ${aiReport.documentStats?.totalSentences || flaggedSentences.length} analyzed`, {
    x: 100 + (cardWidth * 2) + 24,
    y: currentY - 38,
    size: 8,
    font: fontHelvetica,
    color: rgb(0.45, 0.45, 0.45),
  });

  currentY -= 80;

  // Highlight Legend Section
  auditPage.drawText('COLOR-CODED HIGHLIGHTING SYSTEM & LEGEND', {
    x: 40,
    y: currentY,
    size: 9,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.18, 0.26),
  });

  currentY -= 14;

  auditPage.drawRectangle({
    x: 40,
    y: currentY - 38,
    width: pageWidth - 80,
    height: 42,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.88, 0.9, 0.94),
    borderWidth: 1,
  });

  // Legend items
  // 1. Red/Orange
  auditPage.drawRectangle({ x: 50, y: currentY - 26, width: 14, height: 14, color: rgb(0.96, 0.26, 0.21), opacity: 0.4 });
  auditPage.drawText('High AI Likelihood (>= 65%): Elevated syntactic uniformity, low burstiness, or heavy cliché markers', {
    x: 72,
    y: currentY - 22,
    size: 7.5,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // 2. Yellow/Amber
  auditPage.drawRectangle({ x: 50, y: currentY - 34, width: 14, height: 7, color: rgb(0.98, 0.72, 0.14), opacity: 0.4 });
  auditPage.drawText('Moderate AI Likelihood (40 - 64%): Formulaic phrasing, transitional hedging, or moderate lexical uniformity', {
    x: 72,
    y: currentY - 33,
    size: 7.5,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  currentY -= 55;

  // Scanned PDF warning notice if applicable
  if (isScanned) {
    auditPage.drawRectangle({
      x: 40,
      y: currentY - 28,
      width: pageWidth - 80,
      height: 30,
      color: rgb(0.99, 0.95, 0.88),
      borderColor: rgb(0.92, 0.75, 0.4),
      borderWidth: 1,
    });
    auditPage.drawText('NOTICE: Scanned Document / Non-standard Font Stream Detected. Character coordinates were mapped using fallback text register.', {
      x: 50,
      y: currentY - 18,
      size: 7,
      font: fontHelveticaBold,
      color: rgb(0.65, 0.4, 0.1),
    });
    currentY -= 40;
  }

  // Flagged Passages Register Table
  auditPage.drawText('DETAILED FLAGGED PASSAGE REGISTER (INSPECTION LOG)', {
    x: 40,
    y: currentY,
    size: 9,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.18, 0.26),
  });

  currentY -= 15;

  // Table Header
  auditPage.drawRectangle({
    x: 40,
    y: currentY - 16,
    width: pageWidth - 80,
    height: 18,
    color: rgb(0.18, 0.22, 0.32),
  });
  auditPage.drawText('PAGE', { x: 48, y: currentY - 11, size: 7, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  auditPage.drawText('SCORE', { x: 80, y: currentY - 11, size: 7, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  auditPage.drawText('FLAGGED EXCERPT & PRIMARY LINGUISTIC SIGNALS', { x: 125, y: currentY - 11, size: 7, font: fontHelveticaBold, color: rgb(1, 1, 1) });

  currentY -= 20;

  // Table Rows (up to 8 flagged sentences listed on cover page)
  const displayFlagged = flaggedSentences.slice(0, 8);
  if (displayFlagged.length === 0) {
    auditPage.drawRectangle({
      x: 40,
      y: currentY - 22,
      width: pageWidth - 80,
      height: 24,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.88, 0.9, 0.94),
      borderWidth: 1,
    });
    auditPage.drawText('No sentences exceeded the selected detection threshold. Document demonstrates natural scholarly variance.', {
      x: 52,
      y: currentY - 14,
      size: 8,
      font: fontHelvetica,
      color: rgb(0.2, 0.55, 0.25),
    });
    currentY -= 32;
  } else {
    for (const item of displayFlagged) {
      auditPage.drawRectangle({
        x: 40,
        y: currentY - 32,
        width: pageWidth - 80,
        height: 32,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.9, 0.92, 0.95),
        borderWidth: 1,
      });

      auditPage.drawText(`P. ${item.pageNumber}`, { x: 48, y: currentY - 15, size: 7.5, font: fontHelveticaBold, color: rgb(0.2, 0.25, 0.35) });
      auditPage.drawText(`${item.aiScore}%`, {
        x: 82,
        y: currentY - 15,
        size: 8,
        font: fontHelveticaBold,
        color: item.aiScore >= 65 ? rgb(0.85, 0.2, 0.15) : rgb(0.85, 0.6, 0.1),
      });

      const excerpt = `"${item.text.slice(0, 78)}${item.text.length > 78 ? '...' : ''}"`;
      auditPage.drawText(excerpt, { x: 125, y: currentY - 13, size: 7, font: fontHelvetica, color: rgb(0.15, 0.15, 0.15) });

      const signals = `Signals: ${(item.flaggedReasons || []).slice(0, 2).join('; ')}`.slice(0, 85);
      auditPage.drawText(signals, { x: 125, y: currentY - 25, size: 6.5, font: fontHelvetica, color: rgb(0.5, 0.5, 0.5) });

      currentY -= 34;
    }

    if (flaggedSentences.length > 8) {
      auditPage.drawText(`... and ${flaggedSentences.length - 8} additional flagged sentences highlighted on subsequent pages.`, {
        x: 45,
        y: currentY - 5,
        size: 7.5,
        font: fontHelvetica,
        color: rgb(0.4, 0.45, 0.55),
      });
      currentY -= 18;
    }
  }

  // Academic Disclaimer & Limitations Box at Footer
  auditPage.drawRectangle({
    x: 40,
    y: 35,
    width: pageWidth - 80,
    height: 55,
    color: rgb(0.95, 0.96, 0.98),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  auditPage.drawText('METHODOLOGY, LIMITATIONS & ACADEMIC INTEGRITY NOTICE:', {
    x: 50,
    y: 77,
    size: 7,
    font: fontHelveticaBold,
    color: rgb(0.25, 0.3, 0.4),
  });

  const disclaimer1 = 'AI-detection is probabilistic stylometric estimation, not conclusive proof of authorship. Highly structured human prose, standard';
  const disclaimer2 = 'taxonomy, and regulatory summaries naturally display syntactic uniformity. A 99% accuracy claim cannot be guaranteed on open-domain';
  const disclaimer3 = 'scholarly literature. Use this audit as an editorial assistance reference, not as a sole basis for academic misconduct adjudications.';

  auditPage.drawText(disclaimer1, { x: 50, y: 65, size: 6.5, font: fontHelvetica, color: rgb(0.4, 0.45, 0.5) });
  auditPage.drawText(disclaimer2, { x: 50, y: 55, size: 6.5, font: fontHelvetica, color: rgb(0.4, 0.45, 0.5) });
  auditPage.drawText(disclaimer3, { x: 50, y: 45, size: 6.5, font: fontHelvetica, color: rgb(0.4, 0.45, 0.5) });

  // Save modified document
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
