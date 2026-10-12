import { Router } from 'express';
import { db } from '../db';
import { getApiKeyStatus } from '../gemini';

const router = Router();

/**
 * Get current system status and AI engine mode
 */
router.get('/system/status', (_req, res) => {
  const status = getApiKeyStatus();
  return res.json({
    aiService: status.isOperational ? 'native_gemini_3.8_flash' : 'autonomous_academic_literature_synthesis',
    isApiKeyOperational: status.isOperational,
    literatureSources: ['arXiv.org', 'OpenAlex Index'],
  });
});

/**
 * Get current authenticated user
 */
router.get('/user/me', (_req, res) => {
  const user = db.getCurrentUser();
  return res.json({ user });
});

/**
 * Get notifications
 */
router.get('/notifications', (_req, res) => {
  const notifications = db.getNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  return res.json({ notifications, unreadCount });
});

/**
 * Mark notification as read
 */
router.patch('/notifications/:id/read', (req, res) => {
  const success = db.markNotificationRead(req.params.id);
  return res.json({ success });
});

/**
 * Mark all notifications read
 */
router.post('/notifications/read-all', (_req, res) => {
  db.markAllNotificationsRead();
  return res.json({ success: true });
});

/**
 * Aggregate Analytics Dashboard
 */
router.get('/analytics', (_req, res) => {
  const papers = db.getPapers();
  const sessions = db.getContextSessions();
  const gaps = db.getGaps();
  const logs = db.getExecutionLogs();
  const comparisons = db.getComparisons();

  // Metrics
  const totalPapers = papers.length;
  const analyzedPapers = papers.filter(p => p.status === 'analyzed').length;
  const totalSessions = sessions.length;
  const totalGaps = gaps.length;
  const bookmarkedGaps = gaps.filter(g => g.isBookmarked).length;
  const totalComparisons = comparisons.length;

  // Automation stats
  const totalAutomations = logs.length;
  const successfulAutomations = logs.filter(l => l.status === 'completed').length;
  const failedAutomations = logs.filter(l => l.status === 'failed').length;
  const automationHealthRate = totalAutomations > 0
    ? Math.round((successfulAutomations / totalAutomations) * 100)
    : 100;

  // Category distributions
  const categoryCount: Record<string, number> = {};
  for (const p of papers) {
    for (const cat of p.categories) {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }

  // Gap category distributions
  const gapCategoryCount: Record<string, number> = {};
  for (const g of gaps) {
    gapCategoryCount[g.category] = (gapCategoryCount[g.category] || 0) + 1;
  }

  // Publication years
  const yearDistribution: Record<string, number> = {};
  for (const p of papers) {
    const yr = String(p.publicationYear || 2025);
    yearDistribution[yr] = (yearDistribution[yr] || 0) + 1;
  }

  return res.json({
    metrics: {
      totalPapers,
      analyzedPapers,
      totalSessions,
      totalGaps,
      bookmarkedGaps,
      totalComparisons,
      totalAutomations,
      successfulAutomations,
      failedAutomations,
      automationHealthRate,
    },
    categoryDistribution: Object.entries(categoryCount).map(([name, count]) => ({ name, count })),
    gapCategoryDistribution: Object.entries(gapCategoryCount).map(([name, count]) => ({ name, count })),
    yearDistribution: Object.entries(yearDistribution).map(([year, count]) => ({ year, count })),
  });
});

/**
 * Export structured reports (Markdown, JSON, BibTeX)
 */
router.post('/exports', (req, res) => {
  const { type, id, format = 'markdown' } = req.body;

  if (type === 'paper') {
    const paper = db.getPaperById(id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    if (format === 'bibtex') {
      const citeKey = `${(paper.authors[0] || 'Unknown').split(' ').pop()}${paper.publicationYear || 2025}`;
      const bibtex = `@article{${citeKey},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  year={${paper.publicationYear || 2025}},
  journal={${paper.journalOrConference || 'ResearchLens Library'}},
  doi={${paper.doi || ''}}
}`;
      return res.json({ format: 'bibtex', content: bibtex, filename: `${citeKey}.bib` });
    }

    const markdown = `# ${paper.title}

**Authors:** ${paper.authors.join(', ')}  
**Year:** ${paper.publicationYear || 'N/A'}  
**DOI:** ${paper.doi || 'N/A'}  
**Pages:** ${paper.pageCount}  

## Abstract
${paper.analysis?.abstract || 'No abstract extracted.'}

## Executive Summary
${paper.analysis?.executiveSummary || 'N/A'}

## Methodology
${paper.analysis?.methodology || 'N/A'}

## Key Findings
${(paper.analysis?.resultsAndFindings || []).map(f => `- ${f}`).join('\n')}

## Acknowledged Limitations
${(paper.analysis?.limitations || []).map(l => `- ${l}`).join('\n')}

## AI-Generated Likelihood Report
- **Estimated AI-Likelihood:** ${paper.aiLikelihood?.overallAiScore || 0}%
- **Estimated Human-Written:** ${paper.aiLikelihood?.overallHumanScore || 100}%
- **Confidence:** ${paper.aiLikelihood?.confidence || 'N/A'}
*Note: Evaluated with stylometric heuristics. Not definitive proof of authorship.*
`;

    return res.json({ format: 'markdown', content: markdown, filename: `${paper.id}_report.md` });
  }

  if (type === 'session') {
    const session = db.getContextSessionById(id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const markdown = `# Research Context Explorer Report: ${session.topicOrQuestion}

**Academic Domain:** ${session.academicDomain || 'General Science'}  
**Analysis Depth:** ${session.depth}  
**Date:** ${new Date(session.createdAt).toLocaleDateString()}  

## Topic Overview
${session.report?.topicOverview || 'N/A'}

## Key Concepts
${(session.report?.keyConcepts || []).map(k => `- **${k.concept}:** ${k.explanation}`).join('\n')}

## Existing Approaches
${(session.report?.existingApproaches || []).map(a => `### ${a.approach}\n- **Pros:** ${a.pros}\n- **Cons:** ${a.cons}`).join('\n\n')}

## Potential Research Gaps
${(session.report?.potentialResearchGaps || []).map(g => `- **${g.title}** (${g.urgency} Urgency): ${g.description}`).join('\n')}

## Research Questions
${(session.report?.researchQuestions || []).map(q => `- ${q}`).join('\n')}

## Related Academic Papers
${(session.report?.relatedResearchPapers || []).map(p => `- **${p.title}** (${p.year}) by ${p.authors.join(', ')} [${p.source}](${p.url || '#'})`).join('\n')}
`;
    return res.json({ format: 'markdown', content: markdown, filename: `${session.id}_context_report.md` });
  }

  return res.status(400).json({ error: 'Invalid export type specified.' });
});

export default router;
