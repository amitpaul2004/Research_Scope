import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

  // Custom page renderer to capture page boundaries
  const renderOptions = {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY: number | null = null;
        let text = '';
        for (const item of textContent.items) {
          if (lastY == null || Math.abs(lastY - item.transform[5]) > 4) {
            text += '\n';
          }
          text += item.str + ' ';
          lastY = item.transform[5];
        }
        pages.push({
          pageNumber: pages.length + 1,
          text: text.trim(),
        });
        return text;
      });
    },
  };

  try {
    const data = await pdfParse(buffer, renderOptions);

    // If custom page renderer didn't capture pages properly, split by form feed
    if (pages.length === 0) {
      const splitPages = data.text.split('\f');
      splitPages.forEach((pText: string, idx: number) => {
        if (pText.trim().length > 0) {
          pages.push({
            pageNumber: idx + 1,
            text: pText.trim(),
          });
        }
      });
    }

    // Default if single block
    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        text: data.text.trim(),
      });
    }

    return {
      text: data.text,
      pageCount: data.numpages || pages.length,
      pages,
      fileHash,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        creator: data.info?.Creator,
        creationDate: data.info?.CreationDate,
      },
    };
  } catch (error) {
    console.warn('PDF parsing error, attempting raw fallback:', error);
    // Fallback if corrupted or encrypted
    const fallbackText = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
    return {
      text: fallbackText,
      pageCount: 1,
      pages: [{ pageNumber: 1, text: fallbackText }],
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
