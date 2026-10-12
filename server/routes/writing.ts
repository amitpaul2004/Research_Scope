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
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide at least 10 characters of text to enhance.' });
    }

    const validModes = [
      'Formal Academic',
      'Natural Academic',
      'Concise Academic',
      'Technical',
      'Simplified Explanation',
      'Clarity & Grammar',
      'Manual Editing',
    ];

    const selectedMode = validModes.includes(mode) ? mode : 'Formal Academic';

    const result = await improveWriting({
      text: text.trim(),
      mode: selectedMode as any,
      customInstructions,
    });

    const revision: WritingRevision = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      originalText: text.trim(),
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
    return res.status(500).json({ error: err?.message || 'Failed to enhance writing.' });
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
