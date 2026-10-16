import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ResearchPaper, PaperSentenceAnalysis, AiLikelihoodReport } from '../types';

export interface TextItemMatch {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageToken {
  word: string;
  itemIdx: number;
  charStart: number;
  charEnd: number;
}

export interface HighlightResultStats {
  totalSentences: number;
  flaggedSentences: number;
  flaggedParagraphs: number;
  highlightedPassages: number;
  unmatchedPassages: number;
  thresholdUsed: number;
}

/**
 * Sanitize text to ensure strict compatibility with PDF StandardFonts (WinAnsiEncoding)
 * Converts non-ASCII, typographic quotes, em-dashes, and unicode bullets to safe ASCII
 */
export function sanitizePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[•·]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E]/g, (char) => {
      const map: Record<string, string> = {
        '°': ' deg',
        '±': '+/-',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
        'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
        'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
        'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
        'ñ': 'n', 'ç': 'c', 'ß': 'ss',
      };
      return map[char] || ' ';
    });
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
      const str = item.str;
      if (!str.trim()) continue;

      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4];
      const y = transform[5];
      const width = item.width || Math.abs(transform[0]) * str.length * 0.5 || 20;
      const height = item.height || Math.abs(transform[3]) || 12;

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
 * Normalize text to alphanumeric word tokens
 */
function normWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 0);
}

/**
 * Locate exact contiguous token sequence of a sentence on the page.
 * Returns precise bounding boxes only for the matched text items.
 * If no reliable contiguous sequence matches, returns empty array (unmatched).
 */
function matchSentenceBoxes(
  sentenceText: string,
  items: TextItemMatch[]
): { x: number; y: number; width: number; height: number }[] {
  if (!sentenceText || items.length === 0) return [];

  const targetWords = normWords(sentenceText);
  if (targetWords.length === 0) return [];

  // Build ordered word token stream from page items
  const pageTokens: PageToken[] = [];
  items.forEach((item, itemIdx) => {
    const raw = item.str;
    const regex = /[a-zA-Z0-9]+/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      pageTokens.push({
        word: match[0].toLowerCase(),
        itemIdx,
        charStart: match.index,
        charEnd: match.index + match[0].length,
      });
    }
  });

  if (pageTokens.length === 0) return [];

  // Search for the best contiguous matching sequence of targetWords in pageTokens
  let bestMatch: { startP: number; endP: number; matchedCount: number } | null = null;
  let maxMatchedCount = 0;

  for (let pIdx = 0; pIdx < pageTokens.length; pIdx++) {
    let matchedCount = 0;
    let curP = pIdx;
    let curT = 0;

    while (curP < pageTokens.length && curT < targetWords.length) {
      if (pageTokens[curP].word === targetWords[curT]) {
        matchedCount++;
        curP++;
        curT++;
      } else {
        // Allow skipping minor formatting artifacts / hyphen breaks in target
        curT++;
      }
    }

    if (matchedCount > maxMatchedCount) {
      maxMatchedCount = matchedCount;
      bestMatch = { startP: pIdx, endP: curP - 1, matchedCount };
    }
  }

  // Acceptance criteria: Must match at least 4 words in sequence, or >= 70% of words for shorter sentences
  const minRequired = Math.min(4, targetWords.length);
  const overlapRatio = targetWords.length > 0 ? maxMatchedCount / targetWords.length : 0;

  if (!bestMatch || maxMatchedCount < minRequired || overlapRatio < 0.65) {
    return []; // Report as unmatched; do NOT create fake highlights
  }

  // Extract the exact tokens in the winning sequence
  const matchedTokens = pageTokens.slice(bestMatch.startP, bestMatch.endP + 1);

  // Group tokens by itemIdx to compute precise character-bounded highlights
  const tokensByItem: Record<number, PageToken[]> = {};
  for (const t of matchedTokens) {
    tokensByItem[t.itemIdx] = tokensByItem[t.itemIdx] || [];
    tokensByItem[t.itemIdx].push(t);
  }

  const boundingBoxes: { x: number; y: number; width: number; height: number }[] = [];

  for (const [itemIdxStr, tokens] of Object.entries(tokensByItem)) {
    const itemIdx = parseInt(itemIdxStr, 10);
    const item = items[itemIdx];
    if (!item || item.str.length === 0) continue;

    // Find the min and max character span in this item
    const minChar = Math.min(...tokens.map(t => t.charStart));
    const maxChar = Math.max(...tokens.map(t => t.charEnd));

    const totalLen = item.str.length;
    const startFrac = Math.max(0, Math.min(1, minChar / totalLen));
    const endFrac = Math.max(0, Math.min(1, maxChar / totalLen));

    const boxX = Math.max(0, item.x + item.width * startFrac);
    const boxWidth = Math.max(8, item.width * (endFrac - startFrac));
    const boxY = item.y - 1.5;
    const boxHeight = Math.max(item.height, 11) + 3;

    boundingBoxes.push({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
    });
  }

  return boundingBoxes;
}

/**
 * Generate a genuinely highlighted PDF based on the original uploaded document.
 * Highlights exact sentences and paragraphs meeting the threshold in their correct positions.
 * Prepends a comprehensive Analysis Summary Page (Page 1) with exact statistics, legend, and disclaimer.
 */
export async function generateHighlightedPdf(
  originalPdfBuffer: Buffer,
  paper: ResearchPaper,
  aiReport: AiLikelihoodReport,
  thresholdOverride?: number
): Promise<{ buffer: Buffer; stats: HighlightResultStats }> {
  // Load original PDF document with pdf-lib without modifying source file
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const uint8Buffer = new Uint8Array(originalPdfBuffer);
  const pages = pdfDoc.getPages();
  const threshold = thresholdOverride ?? aiReport.selectedThreshold ?? 60;

  // Filter sentences that meet the configured threshold
  const allSentences = aiReport.sentences || [];
  const flaggedSentences = allSentences.filter(s => s.aiScore >= threshold);

  // Group flagged sentences by page number
  const flaggedByPage: Record<number, PaperSentenceAnalysis[]> = {};
  for (const sent of flaggedSentences) {
    flaggedByPage[sent.pageNumber] = flaggedByPage[sent.pageNumber] || [];
    flaggedByPage[sent.pageNumber].push(sent);
  }

  let successfullyHighlightedCount = 0;
  let unmatchedCount = 0;
  const isScanned = aiReport.isScannedPdf || false;

  // Track page-level matches for the summary table
  const passageAuditRegister: {
    pageNumber: number;
    score: number;
    text: string;
    isMatched: boolean;
    category: 'High' | 'Moderate';
    signals: string[];
  }[] = [];

  // 1. Process each page of the original PDF
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageNumber = pageIdx + 1;
    const page = pages[pageIdx];
    const { width, height } = page.getSize();
    const pageFlagged = flaggedByPage[pageNumber] || [];

    if (pageFlagged.length === 0) continue;

    // Extract text items with exact coordinates from this page
    const textItems = await extractPageTextItems(uint8Buffer, pageNumber);

    for (const sent of pageFlagged) {
      const isHighAi = sent.aiScore >= 65;
      const category: 'High' | 'Moderate' = isHighAi ? 'High' : 'Moderate';

      // Colors:
      // Red-orange for High AI-likelihood (>= 65%)
      // Yellow-amber for Moderate AI-likelihood (threshold to 64%)
      const highlightColor = isHighAi
        ? rgb(0.96, 0.28, 0.22) // Red-orange
        : rgb(0.98, 0.74, 0.14); // Yellow-amber

      const boxes = matchSentenceBoxes(sent.text, textItems);

      if (boxes.length > 0) {
        // Successfully matched in exact original text location
        for (const box of boxes) {
          page.drawRectangle({
            x: box.x,
            y: box.y,
            width: Math.min(width - box.x - 10, box.width),
            height: box.height,
            color: highlightColor,
            opacity: 0.35,
          });
        }
        successfullyHighlightedCount++;
        passageAuditRegister.push({
          pageNumber,
          score: sent.aiScore,
          text: sent.text,
          isMatched: true,
          category,
          signals: sent.flaggedReasons || [],
        });
      } else {
        // Unmatched: do NOT draw arbitrary highlights or fake boxes
        unmatchedCount++;
        passageAuditRegister.push({
          pageNumber,
          score: sent.aiScore,
          text: sent.text,
          isMatched: false,
          category,
          signals: sent.flaggedReasons || [],
        });
      }
    }

    // Add an unobtrusive top header indicator if highlights were placed on this page
    const highlightedOnThisPage = passageAuditRegister.filter(
      p => p.pageNumber === pageNumber && p.isMatched
    ).length;

    if (highlightedOnThisPage > 0) {
      page.drawText(
        `[ResearchLens AI Highlighted | Page ${pageNumber} | ${highlightedOnThisPage} Passage(s) Highlighted]`,
        {
          x: 35,
          y: height - 18,
          size: 7,
          font: fontHelvetica,
          color: rgb(0.4, 0.4, 0.4),
        }
      );
    }
  }

  // 2. Prepend a Comprehensive Analysis Summary Page at the Beginning (Page 1)
  const summaryPage = pdfDoc.insertPage(0, [595.28, 841.89]); // Standard A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Background
  summaryPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.98, 0.98, 0.99),
  });

  // Top Dark Header Banner
  summaryPage.drawRectangle({
    x: 0,
    y: pageHeight - 95,
    width: pageWidth,
    height: 95,
    color: rgb(0.09, 0.11, 0.18),
  });

  summaryPage.drawText('RESEARCHLENS - AI CONTENT LIKELIHOOD ANALYSIS SUMMARY', {
    x: 40,
    y: pageHeight - 42,
    size: 13,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  summaryPage.drawText(
    'In-Document Highlighted Report: Sentence-Level & Paragraph-Level Stylometric Evaluation',
    {
      x: 40,
      y: pageHeight - 62,
      size: 8.5,
      font: fontHelvetica,
      color: rgb(0.75, 0.82, 0.95),
    }
  );

  let currentY = pageHeight - 118;

  // Metadata Card
  summaryPage.drawRectangle({
    x: 40,
    y: currentY - 58,
    width: pageWidth - 80,
    height: 62,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  const cleanDocTitle = sanitizePdfText(paper.title || 'Untitled Research Document').slice(0, 80);
  summaryPage.drawText(`Document Title: ${cleanDocTitle}`, {
    x: 52,
    y: currentY - 18,
    size: 9.5,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.15, 0.22),
  });

  const cleanFilename = sanitizePdfText(paper.fileName || `${cleanDocTitle}.pdf`).slice(0, 45);
  summaryPage.drawText(
    `Filename: ${cleanFilename} | Pages: ${paper.pageCount} | SHA-256: ${(paper.fileHash || 'N/A').slice(0, 28)}...`,
    {
      x: 52,
      y: currentY - 34,
      size: 8,
      font: fontHelvetica,
      color: rgb(0.35, 0.4, 0.48),
    }
  );

  const cleanAuthors = sanitizePdfText((paper.authors || []).join(', ')).slice(0, 65);
  summaryPage.drawText(
    `Authors: ${cleanAuthors} | Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    {
      x: 52,
      y: currentY - 48,
      size: 7.5,
      font: fontHelvetica,
      color: rgb(0.4, 0.45, 0.52),
    }
  );

  currentY -= 82;

  // Executive Metric Cards Row (4 Cards)
  const cardWidth = (pageWidth - 80 - 18) / 4;

  // Card 1: Estimated AI Likelihood
  summaryPage.drawRectangle({
    x: 40,
    y: currentY - 62,
    width: cardWidth,
    height: 62,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.92, 0.55, 0.5),
    borderWidth: 1,
  });
  summaryPage.drawText('OVERALL AI LIKELIHOOD', {
    x: 48,
    y: currentY - 18,
    size: 6.5,
    font: fontHelveticaBold,
    color: rgb(0.75, 0.2, 0.15),
  });
  summaryPage.drawText(`${aiReport.overallAiScore ?? 0}%`, {
    x: 48,
    y: currentY - 44,
    size: 20,
    font: fontHelveticaBold,
    color: rgb(0.85, 0.2, 0.15),
  });
  summaryPage.drawText(`Confidence: ${aiReport.confidence || 'Medium'}`, {
    x: 48,
    y: currentY - 56,
    size: 7,
    font: fontHelvetica,
    color: rgb(0.45, 0.45, 0.45),
  });

  // Card 2: Threshold & Total Sentences
  summaryPage.drawRectangle({
    x: 40 + cardWidth + 6,
    y: currentY - 62,
    width: cardWidth,
    height: 62,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });
  summaryPage.drawText('DETECTION THRESHOLD', {
    x: 48 + cardWidth + 6,
    y: currentY - 18,
    size: 6.5,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.3, 0.5),
  });
  summaryPage.drawText(`${threshold}%`, {
    x: 48 + cardWidth + 6,
    y: currentY - 44,
    size: 20,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.3, 0.55),
  });
  summaryPage.drawText(`Analyzed: ${allSentences.length} sentences`, {
    x: 48 + cardWidth + 6,
    y: currentY - 56,
    size: 7,
    font: fontHelvetica,
    color: rgb(0.45, 0.45, 0.45),
  });

  // Card 3: Flagged Passages
  summaryPage.drawRectangle({
    x: 40 + (cardWidth * 2) + 12,
    y: currentY - 62,
    width: cardWidth,
    height: 62,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.9, 0.75, 0.4),
    borderWidth: 1,
  });
  summaryPage.drawText('FLAGGED PASSAGES', {
    x: 48 + (cardWidth * 2) + 12,
    y: currentY - 18,
    size: 6.5,
    font: fontHelveticaBold,
    color: rgb(0.7, 0.45, 0.1),
  });
  summaryPage.drawText(`${flaggedSentences.length}`, {
    x: 48 + (cardWidth * 2) + 12,
    y: currentY - 44,
    size: 20,
    font: fontHelveticaBold,
    color: rgb(0.8, 0.5, 0.1),
  });
  summaryPage.drawText(
    `In ${aiReport.documentStats?.flaggedParagraphsCount ?? 0} paragraph(s)`,
    {
      x: 48 + (cardWidth * 2) + 12,
      y: currentY - 56,
      size: 7,
      font: fontHelvetica,
      color: rgb(0.45, 0.45, 0.45),
    }
  );

  // Card 4: Successfully Highlighted vs Unmatched
  summaryPage.drawRectangle({
    x: 40 + (cardWidth * 3) + 18,
    y: currentY - 62,
    width: cardWidth,
    height: 62,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.55, 0.85, 0.65),
    borderWidth: 1,
  });
  summaryPage.drawText('HIGHLIGHT STATUS', {
    x: 48 + (cardWidth * 3) + 18,
    y: currentY - 18,
    size: 6.5,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.55, 0.25),
  });
  summaryPage.drawText(`${successfullyHighlightedCount}`, {
    x: 48 + (cardWidth * 3) + 18,
    y: currentY - 44,
    size: 20,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.6, 0.25),
  });
  summaryPage.drawText(`Highlighted | ${unmatchedCount} Unmatched`, {
    x: 48 + (cardWidth * 3) + 18,
    y: currentY - 56,
    size: 7,
    font: fontHelvetica,
    color: rgb(0.45, 0.45, 0.45),
  });

  currentY -= 82;

  // Color-Coded Highlighting Legend Box
  summaryPage.drawText('COLOR-CODED HIGHLIGHTING SYSTEM & LEGEND', {
    x: 40,
    y: currentY,
    size: 8.5,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.18, 0.26),
  });

  currentY -= 14;

  summaryPage.drawRectangle({
    x: 40,
    y: currentY - 44,
    width: pageWidth - 80,
    height: 48,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.88, 0.9, 0.94),
    borderWidth: 1,
  });

  // Legend Item 1: Red-orange
  summaryPage.drawRectangle({
    x: 52,
    y: currentY - 18,
    width: 14,
    height: 10,
    color: rgb(0.96, 0.28, 0.22),
    opacity: 0.5,
  });
  summaryPage.drawText('Red-orange: High AI-Likelihood (Score >= 65%)', {
    x: 72,
    y: currentY - 16,
    size: 7.5,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  summaryPage.drawText(
    'Strong indicators of generative transition clichés, low burstiness, or syntactical uniformity.',
    {
      x: 72,
      y: currentY - 26,
      size: 6.5,
      font: fontHelvetica,
      color: rgb(0.45, 0.45, 0.45),
    }
  );

  // Legend Item 2: Yellow-amber
  summaryPage.drawRectangle({
    x: 52,
    y: currentY - 38,
    width: 14,
    height: 10,
    color: rgb(0.98, 0.74, 0.14),
    opacity: 0.5,
  });
  summaryPage.drawText(`Yellow-amber: Moderate AI-Likelihood (Score ${threshold}% - 64%)`, {
    x: 72,
    y: currentY - 36,
    size: 7.5,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  summaryPage.drawText(
    'Meets the configured threshold; exhibits moderate formulaic hedging or vocabulary uniformity.',
    {
      x: 72,
      y: currentY - 46,
      size: 6.5,
      font: fontHelvetica,
      color: rgb(0.45, 0.45, 0.45),
    }
  );

  // Legend Item 3: No highlight
  summaryPage.drawRectangle({
    x: 340,
    y: currentY - 18,
    width: 14,
    height: 10,
    color: rgb(0.9, 0.92, 0.95),
  });
  summaryPage.drawText(`No Highlight: Low AI-Likelihood (< ${threshold}%)`, {
    x: 360,
    y: currentY - 16,
    size: 7.5,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  summaryPage.drawText('Passages below the threshold remain completely unhighlighted.', {
    x: 360,
    y: currentY - 26,
    size: 6.5,
    font: fontHelvetica,
    color: rgb(0.45, 0.45, 0.45),
  });

  currentY -= 62;

  // Scanned PDF / OCR Notice if applicable
  if (isScanned) {
    summaryPage.drawRectangle({
      x: 40,
      y: currentY - 28,
      width: pageWidth - 80,
      height: 30,
      color: rgb(0.99, 0.95, 0.88),
      borderColor: rgb(0.92, 0.75, 0.4),
      borderWidth: 1,
    });
    summaryPage.drawText(
      'OCR NOTICE: Document lacks an embedded digital text layer (scanned bitmap). Exact in-place text highlighting requires OCR pre-processing.',
      {
        x: 50,
        y: currentY - 18,
        size: 7,
        font: fontHelveticaBold,
        color: rgb(0.65, 0.4, 0.1),
      }
    );
    currentY -= 40;
  }

  // Detailed Passage Register Table
  summaryPage.drawText('FLAGGED PASSAGES AUDIT REGISTER', {
    x: 40,
    y: currentY,
    size: 8.5,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.18, 0.26),
  });

  currentY -= 15;

  // Table Header
  summaryPage.drawRectangle({
    x: 40,
    y: currentY - 16,
    width: pageWidth - 80,
    height: 18,
    color: rgb(0.18, 0.22, 0.32),
  });
  summaryPage.drawText('PAGE', { x: 48, y: currentY - 11, size: 7, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  summaryPage.drawText('SCORE', { x: 80, y: currentY - 11, size: 7, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  summaryPage.drawText('STATUS', { x: 120, y: currentY - 11, size: 7, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  summaryPage.drawText('FLAGGED PASSAGE EXCERPT & LINGUISTIC SIGNALS', {
    x: 175,
    y: currentY - 11,
    size: 7,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 20;

  // Table Rows
  if (flaggedSentences.length === 0) {
    summaryPage.drawRectangle({
      x: 40,
      y: currentY - 32,
      width: pageWidth - 80,
      height: 36,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.88, 0.9, 0.94),
      borderWidth: 1,
    });
    summaryPage.drawText(
      `No passages met or exceeded the selected detection threshold of ${threshold}%.`,
      {
        x: 52,
        y: currentY - 16,
        size: 8,
        font: fontHelveticaBold,
        color: rgb(0.2, 0.55, 0.25),
      }
    );
    summaryPage.drawText(
      'The document demonstrates consistent natural human scholarly variance. No highlights were applied.',
      {
        x: 52,
        y: currentY - 27,
        size: 7,
        font: fontHelvetica,
        color: rgb(0.4, 0.45, 0.5),
      }
    );
    currentY -= 48;
  } else {
    // Show up to 8 rows on the cover page
    const displayRows = passageAuditRegister.slice(0, 8);

    for (const item of displayRows) {
      summaryPage.drawRectangle({
        x: 40,
        y: currentY - 30,
        width: pageWidth - 80,
        height: 30,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.9, 0.92, 0.95),
        borderWidth: 1,
      });

      summaryPage.drawText(`P. ${item.pageNumber}`, {
        x: 48,
        y: currentY - 14,
        size: 7.5,
        font: fontHelveticaBold,
        color: rgb(0.2, 0.25, 0.35),
      });

      summaryPage.drawText(`${item.score}%`, {
        x: 82,
        y: currentY - 14,
        size: 8,
        font: fontHelveticaBold,
        color: item.category === 'High' ? rgb(0.85, 0.2, 0.15) : rgb(0.8, 0.55, 0.1),
      });

      // Highlighted vs Unmatched Status Badge
      if (item.isMatched) {
        summaryPage.drawText('HIGHLIGHTED', {
          x: 120,
          y: currentY - 14,
          size: 6.5,
          font: fontHelveticaBold,
          color: rgb(0.12, 0.55, 0.25),
        });
      } else {
        summaryPage.drawText('UNMATCHED', {
          x: 120,
          y: currentY - 14,
          size: 6.5,
          font: fontHelveticaBold,
          color: rgb(0.6, 0.4, 0.1),
        });
      }

      const rawExcerpt = `"${item.text.slice(0, 68)}${item.text.length > 68 ? '...' : ''}"`;
      const excerpt = sanitizePdfText(rawExcerpt);
      summaryPage.drawText(excerpt, {
        x: 175,
        y: currentY - 12,
        size: 7,
        font: fontHelvetica,
        color: rgb(0.15, 0.15, 0.15),
      });

      const rawSignals = `Signals: ${(item.signals || []).slice(0, 2).join('; ')}`.slice(0, 80);
      const signals = sanitizePdfText(rawSignals);
      summaryPage.drawText(signals, {
        x: 175,
        y: currentY - 24,
        size: 6.5,
        font: fontHelvetica,
        color: rgb(0.5, 0.5, 0.5),
      });

      currentY -= 32;
    }

    if (passageAuditRegister.length > 8) {
      summaryPage.drawText(
        `... and ${passageAuditRegister.length - 8} additional flagged passages recorded across subsequent pages.`,
        {
          x: 45,
          y: currentY - 5,
          size: 7.5,
          font: fontHelvetica,
          color: rgb(0.4, 0.45, 0.55),
        }
      );
      currentY -= 18;
    }
  }

  // Academic Disclaimer & Limitations Box at Footer
  summaryPage.drawRectangle({
    x: 40,
    y: 35,
    width: pageWidth - 80,
    height: 52,
    color: rgb(0.95, 0.96, 0.98),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  summaryPage.drawText('METHODOLOGY, LIMITATIONS & ACADEMIC INTEGRITY NOTICE:', {
    x: 50,
    y: 75,
    size: 7,
    font: fontHelveticaBold,
    color: rgb(0.25, 0.3, 0.4),
  });

  summaryPage.drawText(
    'AI-likelihood scores are probabilistic stylometric estimates based on linguistic patterns and are NOT definitive proof of AI authorship.',
    { x: 50, y: 64, size: 6.5, font: fontHelvetica, color: rgb(0.35, 0.4, 0.48) }
  );
  summaryPage.drawText(
    'Highly disciplined academic prose, domain nomenclature, and regulatory standards naturally exhibit syntactic uniformity.',
    { x: 50, y: 54, size: 6.5, font: fontHelvetica, color: rgb(0.35, 0.4, 0.48) }
  );
  summaryPage.drawText(
    'This audit is intended strictly as an editorial evaluation aid and must not be used as the sole basis for disciplinary actions.',
    { x: 50, y: 44, size: 6.5, font: fontHelvetica, color: rgb(0.35, 0.4, 0.48) }
  );

  // Save modified document without modifying the original uploaded file on disk
  const pdfBytes = await pdfDoc.save();

  return {
    buffer: Buffer.from(pdfBytes),
    stats: {
      totalSentences: allSentences.length,
      flaggedSentences: flaggedSentences.length,
      flaggedParagraphs: aiReport.documentStats?.flaggedParagraphsCount ?? 0,
      highlightedPassages: successfullyHighlightedCount,
      unmatchedPassages: unmatchedCount,
      thresholdUsed: threshold,
    },
  };
}
