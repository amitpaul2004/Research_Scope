import { Router } from 'express';
import { db } from '../db';
import { improveWriting } from '../gemini';
import { WritingRevision } from '../types';

const router = Router();

/**
 * Improve scholarly writing with 7 distinct modes
 */
router.post('/improve', async (req, res) => {
  try {
    const { text, mode = 'Formal Academic', customInstructions } = req.body;
    const cleanText = typeof text === 'string' ? text.trim() : '';
    if (!cleanText || cleanText.length < 10) {
      return res.status(400).json({ error: 'Please provide at least 10 characters of academic text to enhance.' });
    }

    const MODE_MAP: Record<string, string> = {
      'Formal Academic': 'Formal Academic',
      'Natural Academic': 'Natural Academic',
      'Concise Academic': 'Concise Academic',
      'Technical Precision': 'Technical Precision',
      'Technical': 'Technical Precision',
      'Simplified Explanation': 'Simplified Explanation',
      'Clarity & Grammar': 'Clarity & Grammar',
      'Custom Prompt': 'Custom Prompt',
      'Manual Editing': 'Custom Prompt',
    };

    const selectedMode = MODE_MAP[mode] || 'Formal Academic';

    const result = await improveWriting({
      text: cleanText,
      mode: selectedMode,
      customInstructions: typeof customInstructions === 'string' ? customInstructions.trim() : undefined,
    });

    if (!result.revisedText || result.revisedText.trim().toLowerCase() === cleanText.toLowerCase()) {
      return res.status(422).json({
        error: `The enhancement service returned the original text without modifications for "${selectedMode}". Please try another mode or customize your instructions.`,
      });
    }

    const revision: WritingRevision = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      originalText: cleanText,
      revisedText: result.revisedText,
      mode: selectedMode,
      explanation: result.explanation,
      createdAt: new Date().toISOString(),
      accepted: false,
    };

    db.addRevision(revision);

    return res.json({
      revision,
      improvements: result.improvements || [],
    });
  } catch (err: any) {
    console.error('Error enhancing text:', err);
    const errMsg = err?.message || 'Failed to enhance writing.';
    let statusCode = 500;
    if (errMsg.includes('at least 10')) statusCode = 400;
    else if (
      errMsg.includes('403') ||
      errMsg.includes('leaked') ||
      errMsg.includes('unauthorized') ||
      errMsg.includes('PERMISSION_DENIED')
    ) {
      statusCode = 403;
    } else if (errMsg.includes('429') || errMsg.includes('quota')) {
      statusCode = 429;
    }
    return res.status(statusCode).json({ error: errMsg });
  }
});

/**
 * Get writing revisions history
 */
router.get('/revisions', (req, res) => {
  const revisions = db.getRevisions();
  return res.json({ revisions });
});

export default router;
