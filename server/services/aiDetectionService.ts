import {
  PaperSentenceAnalysis,
  PaperPassage,
  AiLikelihoodReport,
  LinguisticIndicators,
  DocumentStylometricStats,
} from '../types';
import { evaluateBenchmark } from '../benchmarkData';

/**
 * Curated dictionary of prominent AI-generated academic transition markers & formulaic clichés
 */
const AI_TRANSITION_CLICHES: { pattern: RegExp; phrase: string; weight: number }[] = [
  { pattern: /\bdelve(s|d)?\s+(deep\s+)?into\b/i, phrase: 'delve into', weight: 22 },
  { pattern: /\bplay(s|ed)?\s+a\s+(pivotal|crucial|vital|fundamental)\s+role\b/i, phrase: 'plays a pivotal/crucial role', weight: 20 },
  { pattern: /\bserves?\s+as\s+a\s+testament\b/i, phrase: 'serves as a testament', weight: 24 },
  { pattern: /\b(rich|intricate|complex)\s+tapestry\b/i, phrase: 'tapestry of', weight: 24 },
  { pattern: /\bfoster(s|ed|ing)?\s+an?\s+(environment|atmosphere|culture)\b/i, phrase: 'foster an environment', weight: 18 },
  { pattern: /\bbeacon\s+of\s+(hope|innovation|light)\b/i, phrase: 'beacon of', weight: 22 },
  { pattern: /\bmultifaceted\s+approach\b/i, phrase: 'multifaceted approach', weight: 18 },
  { pattern: /\bholistic\s+(approach|perspective|understanding)\b/i, phrase: 'holistic approach', weight: 18 },
  { pattern: /\bunderscore(s|d)?\s+the\s+necessity\b/i, phrase: 'underscores the necessity', weight: 20 },
  { pattern: /\bshed(s)?\s+light\s+on\b/i, phrase: 'sheds light on', weight: 18 },
  { pattern: /\binterplay\s+between\b/i, phrase: 'interplay between', weight: 16 },
  { pattern: /\bpoised\s+to\s+(revolutionize|transform)\b/i, phrase: 'poised to revolutionize', weight: 22 },
  { pattern: /\bit\s+is\s+(crucial|imperative|worth\s+noting|essential)\s+to\s+(note|remember|highlight)\b/i, phrase: 'it is crucial/worth noting', weight: 18 },
  { pattern: /\bin\s+summary,\s+this\s+study\b/i, phrase: 'in summary, this study', weight: 16 },
  { pattern: /\bmoreover,\s+it\s+is\s+worth\b/i, phrase: 'moreover, it is worth', weight: 18 },
  { pattern: /\bparamount\s+importance\b/i, phrase: 'paramount importance', weight: 20 },
  { pattern: /\bever-evolving\s+landscape\b/i, phrase: 'ever-evolving landscape', weight: 22 },
  { pattern: /\bnotably\s+absent\b/i, phrase: 'notably absent', weight: 16 },
  { pattern: /\bstands?\s+at\s+the\s+crossroads\b/i, phrase: 'stands at the crossroads', weight: 20 },
];

/**
 * Split text into academic sentences while preserving abbreviations
 */
export function splitAcademicSentences(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  // Protect common academic abbreviations from premature period splitting
  let sanitized = text
    .replace(/\bet al\./gi, 'et al@')
    .replace(/\be\.g\.,?/gi, 'eg@')
    .replace(/\bi\.e\.,?/gi, 'ie@')
    .replace(/\bvs\./gi, 'vs@')
    .replace(/\bFig\./gi, 'Fig@')
    .replace(/\bTab\./gi, 'Tab@')
    .replace(/\bRef\./gi, 'Ref@')
    .replace(/\bEq\./gi, 'Eq@')
    .replace(/\bDr\./gi, 'Dr@')
    .replace(/\bProf\./gi, 'Prof@')
    .replace(/\bVol\./gi, 'Vol@')
    .replace(/(\d+)\.(\d+)/g, '$1@$2'); // decimal numbers like 3.14

  // Split on sentence boundaries (. ? !) followed by whitespace and capital letter or quote
  const rawSplits = sanitized.split(/(?<=[.?!])\s+(?=[A-Z"'])/);

  const sentences: string[] = [];
  for (const raw of rawSplits) {
    const restored = raw
      .replace(/@/g, '.')
      .replace(/\s+/g, ' ')
      .trim();
    if (restored.length > 15) {
      sentences.push(restored);
    }
  }

  return sentences;
}

/**
 * Extract linguistic indicators for a sentence or passage
 */
export function computeLinguisticIndicators(
  text: string,
  docAvgSentenceLen: number = 22,
  docSentenceLenStdDev: number = 8
): LinguisticIndicators {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  const wordCount = words.length;
  const charCount = text.length;

  // 1. Sentence length variance deviation
  const varianceDeviation = docSentenceLenStdDev > 0
    ? Math.abs(wordCount - docAvgSentenceLen) / docSentenceLenStdDev
    : 0;

  // 2. Lexical diversity: Type-Token Ratio
  const uniqueWordsSet = new Set(words);
  const typeTokenRatio = wordCount > 0 ? uniqueWordsSet.size / wordCount : 1;

  // 3. Clichés & transition patterns
  const detectedCliches: string[] = [];
  let clicheScoreTotal = 0;

  for (const item of AI_TRANSITION_CLICHES) {
    if (item.pattern.test(text)) {
      detectedCliches.push(item.phrase);
      clicheScoreTotal += item.weight;
    }
  }
  const clicheFrequencyScore = Math.min(100, clicheScoreTotal);

  // 4. Repetitive n-grams (3-grams)
  const trigramCounts: Record<string, number> = {};
  for (let i = 0; i < words.length - 2; i++) {
    const tri = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    trigramCounts[tri] = (trigramCounts[tri] || 0) + 1;
  }
  const repeatedNgrams = Object.keys(trigramCounts).filter(k => trigramCounts[k] > 1);
  const repetitionScore = Math.min(100, repeatedNgrams.length * 25);

  // 5. Syntactic uniformity (Low burstiness = high uniformity = generative pattern)
  // Generative models tend to hover closely around 18-24 words per sentence without extreme short or long bursts
  const isUniformLength = wordCount >= 16 && wordCount <= 26;
  const burstinessScore = Math.max(0, Math.min(100, Math.round(varianceDeviation * 40)));
  const uniformityIndex = isUniformLength ? 75 : Math.max(10, Math.min(100, Math.round((1 - typeTokenRatio) * 100)));

  return {
    sentenceLength: {
      wordCount,
      charCount,
      varianceDeviation: Math.round(varianceDeviation * 100) / 100,
    },
    lexicalDiversity: {
      typeTokenRatio: Math.round(typeTokenRatio * 100) / 100,
      uniqueWords: uniqueWordsSet.size,
      totalWords: wordCount,
    },
    repetitivePatterns: {
      repeatedNgrams,
      repetitionScore,
    },
    transitionCliches: {
      detectedMarkers: detectedCliches,
      frequencyScore: clicheFrequencyScore,
    },
    syntacticUniformity: {
      burstinessScore,
      uniformityIndex,
    },
  };
}

/**
 * Score an individual sentence with stylometric signals and flag reasons
 */
export function scoreSentence(
  text: string,
  pageNumber: number,
  paragraphIndex: number,
  sentenceIndex: number,
  docAvgSentenceLen: number,
  docSentenceLenStdDev: number,
  threshold: number = 60
): PaperSentenceAnalysis {
  const indicators = computeLinguisticIndicators(text, docAvgSentenceLen, docSentenceLenStdDev);
  const flaggedReasons: string[] = [];

  let rawScore = 15; // Baseline prior for academic prose

  // Cliché contributions
  const markerCount = indicators.transitionCliches.detectedMarkers.length;
  if (markerCount > 0) {
    const bonus = Math.min(75, markerCount * 25 + indicators.transitionCliches.frequencyScore * 0.3);
    rawScore += bonus;
    flaggedReasons.push(
      `Detected generative transition clichés: ${indicators.transitionCliches.detectedMarkers.join(', ')}`
    );
  }

  // Lexical diversity signal (low TTR in medium/long sentence)
  if (indicators.sentenceLength.wordCount > 15 && indicators.lexicalDiversity.typeTokenRatio < 0.70) {
    rawScore += 16;
    flaggedReasons.push('Low lexical variety with redundant phrasing');
  } else if (indicators.sentenceLength.wordCount > 15 && indicators.lexicalDiversity.typeTokenRatio > 0.82) {
    rawScore -= 12; // High vocabulary variety indicates human expert diction
  }

  // Syntactic uniformity (AI uniform length sweet spot: 16-28 words with low variance)
  if (
    indicators.sentenceLength.wordCount >= 16 &&
    indicators.sentenceLength.wordCount <= 28 &&
    indicators.sentenceLength.varianceDeviation < 0.4
  ) {
    rawScore += 12;
    flaggedReasons.push('Uniform syntactical length matching generative distribution');
  } else if (indicators.sentenceLength.varianceDeviation > 0.75 || indicators.sentenceLength.wordCount > 34) {
    rawScore -= 10; // High burstiness is characteristic of human academic writing
  }

  // Repeated n-grams
  if (indicators.repetitivePatterns.repeatedNgrams.length > 0) {
    rawScore += 12;
    flaggedReasons.push('Formulaic recurring n-gram patterns');
  }

  // Bound score between 5 and 96 (avoid claiming absolute 0% or 100% since detection is probabilistic)
  const aiScore = Math.max(5, Math.min(96, Math.round(rawScore)));
  const humanScore = 100 - aiScore;
  const isFlagged = aiScore >= threshold;

  // Determine confidence
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
  if (indicators.transitionCliches.detectedMarkers.length >= 2 || (aiScore >= 75 && indicators.sentenceLength.wordCount > 20)) {
    confidence = 'High';
  } else if (indicators.sentenceLength.wordCount < 12) {
    confidence = 'Low';
  }

  if (flaggedReasons.length === 0) {
    if (aiScore < 30) {
      flaggedReasons.push('Natural sentence length variation with high domain lexical density');
    } else {
      flaggedReasons.push('Standard academic formulation');
    }
  }

  return {
    id: `p${pageNumber}_par${paragraphIndex}_s${sentenceIndex}`,
    pageNumber,
    paragraphIndex,
    sentenceIndex,
    text,
    aiScore,
    humanScore,
    confidence,
    flaggedReasons,
    indicators,
    isFlagged,
  };
}

/**
 * Main comprehensive AI Likelihood Analysis pipeline
 * Processes actual extracted PDF pages, paragraph by paragraph, sentence by sentence.
 */
export async function performAiLikelihoodAnalysis(
  extractedText: string,
  pages: { pageNumber: number; text: string }[],
  threshold: number = 60
): Promise<AiLikelihoodReport> {
  const isScannedPdf = !extractedText || extractedText.trim().length < 50;

  // Handle scanned PDF or missing text
  if (isScannedPdf) {
    return {
      overallAiScore: 0,
      overallHumanScore: 100,
      confidence: 'Low',
      methodologyExplanation:
        'Document appears to be a scanned image or lacks an embedded digital text layer. Stylometric sentence analysis cannot be computed without OCR preprocessing.',
      isExperimentalHeuristic: true,
      selectedThreshold: threshold,
      analyzedAt: new Date().toISOString(),
      isScannedPdf: true,
      ocrNotice:
        'Optical Character Recognition (OCR) Notice: This PDF does not contain extractable digital text stream. To analyze this document, run OCR pre-processing or upload a searchable digital PDF.',
      documentStats: {
        totalWords: 0,
        totalSentences: 0,
        totalParagraphs: 0,
        flaggedSentencesCount: 0,
        flaggedParagraphsCount: 0,
        meanSentenceLength: 0,
        sentenceLengthStdDev: 0,
        typeTokenRatio: 0,
        clicheDensityPerThousandWords: 0,
        overallBurstiness: 0,
      },
      passages: [],
      sentences: [],
      pageStats: [],
      validationEvaluation: evaluateBenchmark(text => ({ aiScore: 20 }), threshold),
    };
  }

  // Pre-calculate document level statistics for baseline normalization
  const allRawSentences = splitAcademicSentences(extractedText);
  const sentenceLengths = allRawSentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);
  const totalSentences = sentenceLengths.length || 1;
  const meanSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / totalSentences;
  const variance =
    sentenceLengths.reduce((acc, len) => acc + Math.pow(len - meanSentenceLength, 2), 0) / totalSentences;
  const sentenceLengthStdDev = Math.sqrt(variance);

  const allWords = extractedText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
  const totalWords = allWords.length || 1;
  const uniqueWords = new Set(allWords).size;
  const typeTokenRatio = Math.round((uniqueWords / totalWords) * 100) / 100;

  let totalClichesCount = 0;
  for (const item of AI_TRANSITION_CLICHES) {
    const matches = extractedText.match(item.pattern);
    if (matches) totalClichesCount += matches.length;
  }
  const clicheDensityPerThousandWords =
    Math.round(((totalClichesCount * 1000) / totalWords) * 100) / 100;

  // Process Page by Page and Paragraph by Paragraph
  const analyzedSentences: PaperSentenceAnalysis[] = [];
  const analyzedPassages: PaperPassage[] = [];
  const pageStats: { page: number; averageAiScore: number; sentenceCount: number; flaggedCount: number }[] = [];

  let totalParagraphsCount = 0;
  let flaggedParagraphsCount = 0;

  for (const page of pages) {
    const pageText = (page.text || '').trim();
    if (!pageText) continue;

    // Split page into paragraphs
    const paragraphs = pageText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 25);

    let pageSentenceScores: number[] = [];
    let pageFlaggedCount = 0;

    paragraphs.forEach((para, parIdx) => {
      // Exclude pure reference lists or tables from inflating false positives
      const isReferenceSection =
        /^references\b|^bibliography\b|^works cited\b/i.test(para) ||
        para.includes('arXiv:') ||
        (para.includes('[1]') && para.includes('[2]'));

      if (isReferenceSection) {
        return;
      }

      totalParagraphsCount++;
      const sentencesInPara = splitAcademicSentences(para);
      let paraHasFlagged = false;
      const paraSentenceScores: number[] = [];

      sentencesInPara.forEach((sent, sentIdx) => {
        const sentenceAnalysis = scoreSentence(
          sent,
          page.pageNumber,
          parIdx,
          sentIdx,
          meanSentenceLength,
          sentenceLengthStdDev,
          threshold
        );

        analyzedSentences.push(sentenceAnalysis);
        pageSentenceScores.push(sentenceAnalysis.aiScore);
        paraSentenceScores.push(sentenceAnalysis.aiScore);

        if (sentenceAnalysis.isFlagged) {
          pageFlaggedCount++;
          paraHasFlagged = true;
        }
      });

      if (paraHasFlagged) {
        flaggedParagraphsCount++;
      }

      // Create a passage entry for the paragraph if it has sufficient content
      if (sentencesInPara.length > 0) {
        const avgParaScore = Math.round(
          paraSentenceScores.reduce((a, b) => a + b, 0) / paraSentenceScores.length
        );

        // Flag reasons aggregated from sentences
        const reasons = [
          ...new Set(
            analyzedSentences
              .slice(-sentencesInPara.length)
              .flatMap(s => s.flaggedReasons)
              .filter(r => !r.startsWith('Standard') && !r.startsWith('Natural'))
          ),
        ];

        analyzedPassages.push({
          id: `passage_p${page.pageNumber}_par${parIdx}`,
          pageNumber: page.pageNumber,
          paragraphIndex: parIdx,
          text: para.slice(0, 350) + (para.length > 350 ? '...' : ''),
          aiScore: avgParaScore,
          humanScore: 100 - avgParaScore,
          confidence: avgParaScore >= 65 ? 'High' : 'Medium',
          flaggedReasons: reasons.length > 0 ? reasons : ['Stylometric uniformity within normal limits'],
          indicators: computeLinguisticIndicators(para, meanSentenceLength, sentenceLengthStdDev),
        });
      }
    });

    const pageAvg = pageSentenceScores.length > 0
      ? Math.round(pageSentenceScores.reduce((a, b) => a + b, 0) / pageSentenceScores.length)
      : 15;

    pageStats.push({
      page: page.pageNumber,
      averageAiScore: pageAvg,
      sentenceCount: pageSentenceScores.length,
      flaggedCount: pageFlaggedCount,
    });
  }

  // Aggregate Document Score:
  // Instead of a naive flat average that masks isolated AI-written chapters,
  // we compute a length-weighted average combined with the 80th-percentile peak density:
  let overallAiScore = 20;
  if (analyzedSentences.length > 0) {
    const scores = analyzedSentences.map(s => s.aiScore).sort((a, b) => a - b);
    const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    // 80th percentile score (captures burst localized AI text)
    const p80Index = Math.floor(scores.length * 0.8);
    const p80Score = scores[p80Index] || meanScore;

    // Document score blends 65% weighted average with 35% peak burst
    overallAiScore = Math.round(meanScore * 0.65 + p80Score * 0.35);
  }
  const overallHumanScore = Math.max(4, Math.min(96, 100 - overallAiScore));

  const flaggedSentencesCount = analyzedSentences.filter(s => s.isFlagged).length;

  // Run benchmark evaluation with current threshold
  const validationEvaluation = evaluateBenchmark(
    text => ({
      aiScore: scoreSentence(text, 1, 0, 0, meanSentenceLength, sentenceLengthStdDev, threshold).aiScore,
    }),
    threshold
  );

  return {
    overallAiScore,
    overallHumanScore,
    confidence: overallAiScore >= 70 || overallAiScore <= 25 ? 'High' : 'Medium',
    methodologyExplanation:
      'Multi-factor stylometric decomposition: evaluates sentence length variance, lexical dispersion (Type-Token Ratio), formulaic transition cliché density, and syntactic uniformity. Results represent statistical linguistic patterns and do not constitute definitive proof of machine authorship.',
    isExperimentalHeuristic: true,
    selectedThreshold: threshold,
    analyzedAt: new Date().toISOString(),
    documentStats: {
      totalWords,
      totalSentences: analyzedSentences.length,
      totalParagraphs: totalParagraphsCount,
      flaggedSentencesCount,
      flaggedParagraphsCount,
      meanSentenceLength: Math.round(meanSentenceLength * 10) / 10,
      sentenceLengthStdDev: Math.round(sentenceLengthStdDev * 10) / 10,
      typeTokenRatio,
      clicheDensityPerThousandWords,
      overallBurstiness: Math.round((sentenceLengthStdDev / (meanSentenceLength || 1)) * 100) / 100,
    },
    passages: analyzedPassages,
    sentences: analyzedSentences,
    pageStats,
    validationEvaluation,
  };
}
