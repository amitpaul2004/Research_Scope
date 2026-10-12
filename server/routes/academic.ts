import { Router } from 'express';
import { db } from '../db';
import { searchLiterature, searchArxiv, searchOpenAlex } from '../academic';
import { dispatchWorkflowEvent } from '../n8nService';
import { ResearchDiscoverySubscription } from '../types';

const router = Router();

/**
 * Live search academic repositories (arXiv & OpenAlex)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, source = 'all', limit = '10' } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const maxResults = Math.min(parseInt(limit as string, 10) || 10, 25);

    if (source === 'arxiv') {
      const papers = await searchArxiv(q, maxResults);
      return res.json({ papers, source: 'arXiv' });
    } else if (source === 'openalex') {
      const papers = await searchOpenAlex(q, maxResults);
      return res.json({ papers, source: 'OpenAlex' });
    } else {
      const papers = await searchLiterature(q, maxResults);
      return res.json({ papers, source: 'Unified (arXiv + OpenAlex)' });
    }
  } catch (err: any) {
    console.error('Academic search error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to search academic repositories' });
  }
});

/**
 * Get active discovery subscriptions
 */
router.get('/subscriptions', (req, res) => {
  const subscriptions = db.getSubscriptions();
  return res.json({ subscriptions });
});

/**
 * Create discovery subscription
 */
router.post('/subscriptions', (req, res) => {
  const { topic, keywords, domains, sources, frequency = 'daily' } = req.body;
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const user = db.getCurrentUser();
  const sub: ResearchDiscoverySubscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId: user.id,
    topic: topic.trim(),
    keywords: Array.isArray(keywords) ? keywords : [topic],
    domains: Array.isArray(domains) ? domains : ['Interdisciplinary'],
    sources: Array.isArray(sources) ? sources : ['arxiv', 'openalex'],
    frequency,
    lastRunAt: new Date().toISOString(),
    isActive: true,
  };

  db.addSubscription(sub);

  // Trigger n8n Workflow B
  dispatchWorkflowEvent('workflow_b_paper_discovery', {
    subscriptionId: sub.id,
    topic: sub.topic,
    frequency: sub.frequency,
  });

  return res.json({ subscription: sub });
});

/**
 * Delete subscription
 */
router.delete('/subscriptions/:id', (req, res) => {
  const success = db.deleteSubscription(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  return res.json({ success: true });
});

export default router;
