import { Router } from 'express';
import { db } from '../db';
import { discoverResearchGaps } from '../gemini';
import { dispatchWorkflowEvent } from '../n8nService';
import { ResearchGap } from '../types';

const router = Router();

/**
 * Get all candidate research gaps
 */
router.get('/', (req, res) => {
  const { category, bookmarkedOnly } = req.query;
  let gaps = db.getGaps();

  if (category && typeof category === 'string') {
    gaps = gaps.filter(g => g.category.toLowerCase() === category.toLowerCase());
  }

  if (bookmarkedOnly === 'true') {
    gaps = gaps.filter(g => g.isBookmarked);
  }

  return res.json({ gaps });
});

/**
 * Trigger AI Research Gap Discovery across uploaded papers & literature
 */
router.post('/discover', async (req, res) => {
  try {
    const { topic, contextSnippet } = req.body;
    const papers = db.getPapers().slice(0, 5);

    const papersSummary = papers.map(p => ({
      title: p.title,
      limitations: p.analysis?.limitations || [],
      methodology: p.analysis?.methodology || '',
    }));

    // Trigger n8n event for gap reanalysis
    await dispatchWorkflowEvent('workflow_e_gap_reanalysis', {
      topic: topic || 'Global Workspace Synthesis',
      paperCount: papers.length,
    });

    const discovered: any = await discoverResearchGaps({
      topic,
      papers: papersSummary,
      contextSnippet,
    });

    const user = db.getCurrentUser();
    const createdGaps: ResearchGap[] = [];

    for (const raw of (discovered || []) as any[]) {
      const gap: ResearchGap = {
        id: `gap_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        title: raw.title,
        description: raw.description,
        category: (raw.category as any) || 'Methodological',
        supportingPapers: raw.supportingPapers || [],
        limitationsInExistingWork: raw.limitationsInExistingWork || [],
        whyItMatters: raw.whyItMatters,
        potentialResearchQuestions: raw.potentialResearchQuestions || [],
        possibleMethodologies: raw.possibleMethodologies || [],
        suggestedExperiments: raw.suggestedExperiments || [],
        expectedChallenges: raw.expectedChallenges || [],
        evidenceStrength: (raw.evidenceStrength as any) || 'Emerging Pattern',
        isBookmarked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.addGap(gap);
      createdGaps.push(gap);
    }

    // Add Notification
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: 'Research Gaps Discovered',
      message: `Surfaced ${createdGaps.length} candidate research gaps from literature synthesis.`,
      type: 'info',
      category: 'gap',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/gaps',
    });

    return res.json({ gaps: createdGaps });
  } catch (err: any) {
    console.error('Error in gap discovery:', err);
    return res.status(500).json({ error: err?.message || 'Failed to discover research gaps' });
  }
});

/**
 * Toggle bookmark or update gap
 */
router.patch('/:id', (req, res) => {
  const { isBookmarked, notes } = req.body;
  const updated = db.updateGap(req.params.id, {
    isBookmarked: typeof isBookmarked === 'boolean' ? isBookmarked : undefined,
  });

  if (!updated) {
    return res.status(404).json({ error: 'Gap not found' });
  }

  return res.json({ gap: updated });
});

/**
 * Delete candidate gap
 */
router.delete('/:id', (req, res) => {
  const success = db.deleteGap(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Gap not found' });
  }
  return res.json({ success: true });
});

export default router;
