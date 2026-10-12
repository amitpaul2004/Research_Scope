import { Router } from 'express';
import { db } from '../db';
import { analyzeResearchContext, askContextFollowUp } from '../gemini';
import { searchLiterature } from '../academic';
import { dispatchWorkflowEvent } from '../n8nService';
import { ResearchContextSession } from '../types';

const router = Router();

/**
 * Analyze research context without PDF upload (Core Feature)
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      topicOrQuestion,
      additionalContext,
      researchObjective,
      academicDomain,
      depth = 'Standard Analysis',
      responseStyle = 'Academic & Formal',
    } = req.body;

    if (!topicOrQuestion || typeof topicOrQuestion !== 'string' || topicOrQuestion.trim().length < 5) {
      return res.status(400).json({
        error: 'Please provide a valid research topic or question with at least 5 characters.',
      });
    }

    const user = db.getCurrentUser();
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 1. Retrieve legitimate academic literature from OpenAlex and arXiv
    let retrievedPapers: any[] = [];
    try {
      retrievedPapers = await searchLiterature(topicOrQuestion, 6);
    } catch (e) {
      console.warn('Academic search in context analysis had a warning:', e);
    }

    // 2. Initial session record in processing state
    const newSession: ResearchContextSession = {
      id: sessionId,
      userId: user.id,
      topicOrQuestion: topicOrQuestion.trim(),
      additionalContext: additionalContext?.trim(),
      researchObjective: researchObjective?.trim(),
      academicDomain: academicDomain?.trim() || 'Interdisciplinary Science',
      depth,
      responseStyle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'processing',
      chatHistory: [],
    };
    db.addContextSession(newSession);

    // 3. Dispatch n8n event for background coordination / logging
    await dispatchWorkflowEvent('workflow_l_assistant_tasks', {
      sessionId,
      topic: topicOrQuestion,
      academicDomain,
      depth,
    });

    // 4. Generate structured report using Gemini
    const report: any = await analyzeResearchContext({
      topicOrQuestion,
      additionalContext,
      researchObjective,
      academicDomain,
      depth,
      responseStyle,
      retrievedPapers: retrievedPapers.map(p => ({
        title: p.title,
        authors: p.authors,
        year: p.year,
        abstract: p.abstract,
        url: p.url,
        doi: p.doi,
      })),
    });

    if (!report) {
      throw new Error('Analysis report generation returned null.');
    }

    // Merge retrieved real papers if Gemini report missed url/doi
    if (report && report.relatedResearchPapers && retrievedPapers.length > 0) {
      // augment with verified source data
      retrievedPapers.forEach((verified) => {
        if (!report.relatedResearchPapers.some((r: any) => r.title.toLowerCase() === verified.title.toLowerCase())) {
          report.relatedResearchPapers.push({
            title: verified.title,
            authors: verified.authors,
            year: verified.year,
            source: verified.source,
            url: verified.url,
            doi: verified.doi,
            abstractExcerpt: verified.abstract,
            relevanceReason: 'Retrieved directly from academic repository index',
          });
        }
      });
    }

    // 5. Update session in DB
    const updated = db.updateContextSession(sessionId, {
      status: 'completed',
      report: report || undefined,
    });

    // 6. Push notification
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: 'Context Exploration Ready',
      message: `Completed analysis for "${topicOrQuestion.slice(0, 45)}..."`,
      type: 'success',
      category: 'discovery',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: `/context?session=${sessionId}`,
    });

    return res.json({ session: updated });
  } catch (err: any) {
    console.error('Error in /context/analyze:', err);
    return res.status(500).json({ error: err?.message || 'Failed to analyze research context.' });
  }
});

/**
 * List all context sessions
 */
router.get('/sessions', (req, res) => {
  const sessions = db.getContextSessions();
  return res.json({ sessions });
});

/**
 * Get single context session
 */
router.get('/sessions/:id', (req, res) => {
  const session = db.getContextSessionById(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json({ session });
});

/**
 * Ask interactive follow-up question
 */
router.post('/sessions/:id/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Please provide a question' });
    }

    const session = db.getContextSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user' as const,
      content: question.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...session.chatHistory, userMessage];

    const answer = await askContextFollowUp({
      topicOrQuestion: session.topicOrQuestion,
      reportSummary: session.report?.topicOverview || 'Topic research report',
      history: session.chatHistory,
      userQuestion: question,
    });

    const assistantMessage = {
      id: `msg_${Date.now()}_a`,
      role: 'assistant' as const,
      content: answer,
      timestamp: new Date().toISOString(),
    };

    updatedHistory.push(assistantMessage);
    db.updateContextSession(session.id, { chatHistory: updatedHistory });

    return res.json({
      message: assistantMessage,
      chatHistory: updatedHistory,
    });
  } catch (err: any) {
    console.error('Error in context chat:', err);
    return res.status(500).json({ error: err?.message || 'Failed to process follow-up' });
  }
});

/**
 * Update session details
 */
router.patch('/sessions/:id', (req, res) => {
  const { topicOrQuestion } = req.body;
  const updated = db.updateContextSession(req.params.id, {
    topicOrQuestion,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json({ session: updated });
});

/**
 * Delete session
 */
router.delete('/sessions/:id', (req, res) => {
  const success = db.deleteContextSession(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json({ success: true });
});

export default router;
