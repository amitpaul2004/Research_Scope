import { Router } from 'express';
import { db } from '../db';
import { compareMultiplePapers } from '../gemini';
import { dispatchWorkflowEvent } from '../n8nService';
import { PaperComparison } from '../types';

const router = Router();

/**
 * List past comparisons
 */
router.get('/', (req, res) => {
  const comparisons = db.getComparisons();
  return res.json({ comparisons });
});

/**
 * Get comparison by ID
 */
router.get('/:id', (req, res) => {
  const comparison = db.getComparisonById(req.params.id);
  if (!comparison) {
    return res.status(404).json({ error: 'Comparison not found' });
  }
  return res.json({ comparison });
});

/**
 * Run structured multi-paper comparison
 */
router.post('/run', async (req, res) => {
  try {
    const { paperIds } = req.body;
    if (!paperIds || !Array.isArray(paperIds) || paperIds.length < 2) {
      return res.status(400).json({ error: 'Please select at least 2 papers to compare.' });
    }

    const papers = paperIds
      .map((id: string) => db.getPaperById(id))
      .filter(Boolean) as any[];

    if (papers.length < 2) {
      return res.status(400).json({ error: 'Could not find the requested papers in your library.' });
    }

    // Trigger n8n workflow event
    await dispatchWorkflowEvent('workflow_a_paper_processing', {
      action: 'multi_paper_comparison',
      paperIds,
      paperTitles: papers.map(p => p.title),
    });

    const result: any = await compareMultiplePapers(papers);
    if (!result) {
      throw new Error('Failed to generate comparative synthesis from papers.');
    }

    const user = db.getCurrentUser();
    const comparison: PaperComparison = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      title: result.title || `Comparison of ${papers.length} Papers`,
      paperIds,
      createdAt: new Date().toISOString(),
      summary: result.summary || 'Summary unavailable.',
      comparisonMatrix: result.comparisonMatrix || [],
      methodologyTradeoffs: result.methodologyTradeoffs || [],
      combinedResearchGaps: result.combinedResearchGaps || [],
      conclusion: result.conclusion || '',
    };

    db.addComparison(comparison);

    // Notification
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: 'Multi-Paper Comparison Ready',
      message: `Completed comparative matrix for ${papers.length} papers.`,
      type: 'success',
      category: 'paper',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: `/compare?id=${comparison.id}`,
    });

    return res.json({ comparison });
  } catch (err: any) {
    console.error('Error running paper comparison:', err);
    return res.status(500).json({ error: err?.message || 'Failed to compare papers.' });
  }
});

export default router;
