import { Router } from 'express';
import { db } from '../db';
import {
  WORKFLOW_DEFINITIONS,
  n8nConfig,
  dispatchWorkflowEvent,
} from '../n8nService';

const router = Router();

/**
 * List all 12 n8n workflows with runtime metrics
 */
router.get('/workflows', (_req, res) => {
  return res.json({
    workflows: WORKFLOW_DEFINITIONS,
    config: {
      enabled: n8nConfig.enabled,
      webhookBaseUrl: n8nConfig.webhookBaseUrl,
      hasSecret: !!n8nConfig.webhookSecret,
    },
  });
});

/**
 * Export downloadable n8n workflow JSON definition ready to import into n8n
 */
router.get('/workflows/:id/export', (req, res) => {
  const workflow = WORKFLOW_DEFINITIONS.find(w => w.id === req.params.id || w.key === req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow definition not found' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${workflow.key}.json"`);
  return res.json(workflow.n8nWorkflowJson);
});

/**
 * Get automation execution logs
 */
router.get('/logs', (_req, res) => {
  const logs = db.getExecutionLogs();
  return res.json({ logs });
});

/**
 * Trigger/Test an n8n workflow manually
 */
router.post('/trigger/:workflowKey', async (req, res) => {
  try {
    const { workflowKey } = req.params;
    const payload = req.body || {};

    const { executionLog, result } = await dispatchWorkflowEvent(
      workflowKey,
      payload,
      async () => {
        // Local simulation / fallback executor
        return {
          status: 'success',
          executedAt: new Date().toISOString(),
          processedRecords: 5,
          message: `Local simulated run completed successfully for ${workflowKey}`,
        };
      }
    );

    db.addExecutionLog(executionLog);

    return res.json({ executionLog, result });
  } catch (err: any) {
    console.error('Trigger workflow failed:', err);
    return res.status(500).json({ error: err?.message || 'Failed to dispatch workflow' });
  }
});

/**
 * Retry failed execution (dead-letter queue)
 */
router.post('/logs/:id/retry', async (req, res) => {
  try {
    const logs = db.getExecutionLogs();
    const targetLog = logs.find(l => l.id === req.params.id);
    if (!targetLog) {
      return res.status(404).json({ error: 'Execution log not found' });
    }

    const { executionLog, result } = await dispatchWorkflowEvent(
      targetLog.workflowKey,
      { ...targetLog.inputPayload, isRetry: true },
      async () => ({
        status: 'retry_success',
        retriedAt: new Date().toISOString(),
        previousJobId: targetLog.jobId,
      })
    );

    executionLog.retryCount = targetLog.retryCount + 1;
    db.addExecutionLog(executionLog);

    return res.json({ executionLog, result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Retry failed' });
  }
});

/**
 * Update n8n connection configuration
 */
router.post('/config', (req, res) => {
  const { webhookBaseUrl, webhookSecret, enabled } = req.body;
  if (typeof webhookBaseUrl === 'string') {
    n8nConfig.webhookBaseUrl = webhookBaseUrl.trim();
  }
  if (typeof webhookSecret === 'string') {
    n8nConfig.webhookSecret = webhookSecret.trim();
  }
  if (typeof enabled === 'boolean') {
    n8nConfig.enabled = enabled;
  } else if (n8nConfig.webhookBaseUrl) {
    n8nConfig.enabled = true;
  }

  return res.json({
    config: {
      enabled: n8nConfig.enabled,
      webhookBaseUrl: n8nConfig.webhookBaseUrl,
      hasSecret: !!n8nConfig.webhookSecret,
    },
  });
});

/**
 * Inbound webhook listener for external n8n instances
 * Authenticated via header 'X-ResearchLens-Secret' or 'X-N8N-Secret'
 */
router.post('/inbound/:workflowPath', (req, res) => {
  const secretHeader = req.headers['x-researchlens-secret'] || req.headers['x-n8n-secret'];
  if (n8nConfig.webhookSecret && secretHeader !== n8nConfig.webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid n8n webhook secret token' });
  }

  const { workflowPath } = req.params;
  const payload = req.body;

  // Log incoming callback
  const log = db.addExecutionLog({
    id: `exec_inbound_${Date.now()}`,
    workflowKey: `inbound_${workflowPath}`,
    workflowName: `External n8n Callback: ${workflowPath}`,
    jobId: payload.jobId || `inbound_${Date.now()}`,
    triggeredBy: 'n8n_remote_callback',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'completed',
    retryCount: 0,
    inputPayload: payload,
    outputResult: { status: 'acknowledged_by_backend' },
    executionMode: 'n8n_remote',
  });

  return res.json({ success: true, logId: log.id });
});

export default router;
