import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseMod = require('pdf-parse');
const PDFParse = pdfParseMod.PDFParse || pdfParseMod.default || pdfParseMod;

export interface ExtractedPdfData {
  text: string;
  pageCount: number;
  pages: { pageNumber: number; text: string }[];
  fileHash: string;
  metadata?: {
    title?: string;
    author?: string;
    creator?: string;
    creationDate?: string;
  };
}

/**
 * Compute SHA-256 hash of file buffer
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extract text and page boundaries from PDF Buffer
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<ExtractedPdfData> {
  const fileHash = computeFileHash(buffer);
  const pages: { pageNumber: number; text: string }[] = [];

  try {
    let fullText = '';
    let pageCount = 1;
    let metadataTitle: string | undefined;
    let metadataAuthor: string | undefined;
    let creationDate: string | undefined;

    if (typeof PDFParse === 'function' && PDFParse.prototype && PDFParse.prototype.getText) {
      // Modern pdf-parse v2 class
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText();
      fullText = res.text || '';
      pageCount = res.total || 1;

      if (res.pages && Array.isArray(res.pages) && res.pages.length > 0) {
        res.pages.forEach((p: any, idx: number) => {
          pages.push({
            pageNumber: idx + 1,
            text: (p.text || '').trim(),
          });
        });
      }

      try {
        const info = await parser.getInfo();
        if (info?.info) {
          metadataTitle = typeof info.info.Title === 'string' ? info.info.Title.trim() : undefined;
          metadataAuthor = typeof info.info.Author === 'string' ? info.info.Author.trim() : undefined;
          creationDate = typeof info.info.CreationDate === 'string' ? info.info.CreationDate : undefined;
        }
      } catch {
        // Ignore metadata fetch error
      }
    } else if (typeof pdfParseMod === 'function') {
      // Legacy functional pdf-parse
      const data = await pdfParseMod(buffer);
      fullText = data.text || '';
      pageCount = data.numpages || 1;
      metadataTitle = data.info?.Title;
      metadataAuthor = data.info?.Author;
      creationDate = data.info?.CreationDate;
    }

    // Split into pages if pages array is still empty
    if (pages.length === 0 && fullText) {
      const splitPages = fullText.split('\f');
      splitPages.forEach((pText: string, idx: number) => {
        if (pText.trim().length > 0) {
          pages.push({
            pageNumber: idx + 1,
            text: pText.trim(),
          });
        }
      });
    }

    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        text: fullText.trim(),
      });
    }

    // Sanitize metadata title: never allow raw PDF tokens or dictionary tags
    if (metadataTitle && (metadataTitle.startsWith('<') || metadataTitle.includes('/Type') || metadataTitle.includes('/Catalog') || metadataTitle.includes('endobj'))) {
      metadataTitle = undefined;
    }

    return {
      text: fullText.trim(),
      pageCount: pageCount || pages.length || 1,
      pages,
      fileHash,
      metadata: {
        title: metadataTitle,
        author: metadataAuthor,
        creationDate,
      },
    };
  } catch (error) {
    console.warn('PDF parsing error, extracting clean readable text:', error);
    // Extract clean printable characters, filtering out binary PDF stream markers
    let extractedClean = '';
    try {
      const str = buffer.toString('binary');
      const matches = str.match(/[\x20-\x7E\t\n\r]{6,}/g);
      if (matches) {
        extractedClean = matches
          .filter(m => !m.includes('/Type') && !m.includes('/Font') && !m.includes('/Root') && !m.includes('endobj') && !m.includes('/Catalog'))
          .join('\n');
      }
    } catch {}

    const safeText = extractedClean.slice(0, 50000).trim() || 'Uploaded PDF document indexed.';
    return {
      text: safeText,
      pageCount: 1,
      pages: [{ pageNumber: 1, text: safeText }],
      fileHash,
      metadata: {},
    };
  }
}

/**
 * Find relevant passages for a query (in-memory keyword / semantic chunk matching)
 */
export function findRelevantPassages(
  pages: { pageNumber: number; text: string }[],
  query: string,
  topK: number = 4
): { pageNumber: number; text: string; score: number }[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scoredPassages: { pageNumber: number; text: string; score: number }[] = [];

  for (const page of pages) {
    // split page into paragraph blocks
    const paragraphs = page.text.split(/\n\s*\n/).filter(p => p.trim().length > 40);
    for (const paragraph of paragraphs) {
      const lower = paragraph.toLowerCase();
      let matchCount = 0;
      for (const term of queryTerms) {
        if (lower.includes(term)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        scoredPassages.push({
          pageNumber: page.pageNumber,
          text: paragraph.trim(),
          score: matchCount / queryTerms.length,
        });
      }
    }
  }

  scoredPassages.sort((a, b) => b.score - a.score);

  if (scoredPassages.length === 0 && pages.length > 0) {
    // Return first page excerpt
    return [{ pageNumber: 1, text: pages[0].text.slice(0, 1500), score: 0.1 }];
  }

  return scoredPassages.slice(0, topK);
}
