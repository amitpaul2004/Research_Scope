import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpRight,
  Code,
} from 'lucide-react';
import { api } from '../api';
import { N8nAutomationWorkflow, AutomationExecutionLog } from '../types';

export const N8nAutomationCenter: React.FC = () => {
  const [workflows, setWorkflows] = useState<N8nAutomationWorkflow[]>([]);
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([]);
  const [config, setConfig] = useState<{ enabled: boolean; webhookBaseUrl: string; hasSecret: boolean }>({
    enabled: false,
    webhookBaseUrl: '',
    hasSecret: true,
  });

  const [loading, setLoading] = useState(false);
  const [triggeringKey, setTriggeringKey] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AutomationExecutionLog | null>(null);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [secretInput, setSecretInput] = useState('');

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    setLoading(true);
    try {
      const [wfRes, logsRes] = await Promise.all([
        api.getWorkflows(),
        api.getAutomationLogs(),
      ]);
      setWorkflows(wfRes.workflows);
      setConfig(wfRes.config);
      setWebhookUrlInput(wfRes.config.webhookBaseUrl || '');
      setLogs(logsRes.logs);
      if (logsRes.logs.length > 0 && !selectedLog) {
        setSelectedLog(logsRes.logs[0]);
      }
    } catch (err) {
      console.error('Error loading automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async (workflowKey: string) => {
    setTriggeringKey(workflowKey);
    try {
      const res = await api.triggerWorkflow(workflowKey, {
        triggeredManually: true,
        source: 'ResearchLens Automation Center UI',
      });
      setLogs([res.executionLog, ...logs]);
      setSelectedLog(res.executionLog);
      // Reload workflow stats
      const wfRes = await api.getWorkflows();
      setWorkflows(wfRes.workflows);
    } catch (err) {
      console.error('Trigger workflow failed:', err);
    } finally {
      setTriggeringKey(null);
    }
  };

  const handleRetry = async (logId: string) => {
    try {
      const res = await api.retryExecutionLog(logId);
      setLogs([res.executionLog, ...logs]);
      setSelectedLog(res.executionLog);
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleDownloadWorkflowJson = (workflow: N8nAutomationWorkflow) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workflow.n8nWorkflowJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${workflow.key}_n8n_template.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateN8nConfig({
        webhookBaseUrl: webhookUrlInput,
        webhookSecret: secretInput || 'researchlens_n8n_secret_token_2026',
        enabled: !!webhookUrlInput.trim(),
      });
      setConfig(res.config);
      setShowSettingsModal(false);
    } catch (err) {
      console.error('Update config failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1">
            <Workflow className="w-4 h-4" />
            <span>Workflow Orchestration Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            n8n Automation Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            12 modular event-driven and scheduled background workflows orchestrating paper indexing, discovery, digests, and gap reanalysis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              {config.enabled ? 'n8n Live Webhooks Active' : 'Local Fallback Engine Active'}
            </span>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Connection Settings</span>
          </button>
        </div>
      </div>

      {/* Info Banner on n8n Integration */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-indigo-200 text-xs flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-indigo-300">
            First-Class Automation Architecture:
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Every background task (paper parsing, scheduled discovery, literature digests, topic monitors, gap reanalysis, and dead-letter recovery) has a dedicated n8n workflow definition. You can download the workflow JSON to import directly into any self-hosted or cloud n8n instance, or test-trigger jobs locally.
          </p>
        </div>
      </div>

      {/* Workflows Grid (12 Workflows) */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-rose-400" />
          Modular Workflows (Workflows A — L)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => {
            const isTriggering = triggeringKey === wf.key;

            return (
              <div
                key={wf.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold uppercase">
                      {wf.triggerType}
                    </span>
                    <span className="text-slate-400">
                      Success: <strong className="text-emerald-400">{wf.successRate}%</strong>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1">
                    {wf.name}
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {wf.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Runs: {wf.totalRuns}</span>
                    <span>{wf.schedule || 'Event Triggered'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrigger(wf.key)}
                      disabled={isTriggering}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isTriggering ? (
                        <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>Test Run</span>
                    </button>

                    <button
                      onClick={() => handleDownloadWorkflowJson(wf)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                      title="Download importable n8n workflow JSON"
                    >
                      <Download className="w-3 h-3" />
                      <span className="hidden sm:inline">JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Logs & Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Logs Table */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Execution &amp; Dead-Letter Queue Logs ({logs.length})
            </h3>
            <button
              onClick={loadAutomationData}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No logs recorded yet.
              </p>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.status === 'completed'
                              ? 'bg-emerald-400'
                              : log.status === 'failed'
                              ? 'bg-rose-400'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                        <span className="font-semibold text-slate-200 truncate">{log.workflowName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Job: {log.jobId} • {log.executionMode} • {new Date(log.startedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          log.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : log.status === 'failed'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Log Inspector */}
        <div className="lg:col-span-5">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Log Payload Inspector</span>
              {selectedLog && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedLog.jobId}
                </span>
              )}
            </h3>

            {selectedLog ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Workflow:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedLog.workflowName}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500">Mode:</span>
                    <div className="font-semibold text-indigo-300">{selectedLog.executionMode}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500">Retries:</span>
                    <div className="font-semibold text-slate-200">{selectedLog.retryCount}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Input Payload:</span>
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-28">
                    {JSON.stringify(selectedLog.inputPayload, null, 2)}
                  </pre>
                </div>

                {selectedLog.outputResult && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Output Result:</span>
                    <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-28">
                      {JSON.stringify(selectedLog.outputResult, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(selectedLog.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Failed Job (Dead-Letter Handling)</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">
                Select an execution log on the left to inspect input parameters and outputs.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Configure External n8n Webhook Instance
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your self-hosted or cloud n8n deployment. When configured, events will dispatch directly to your n8n webhooks with authenticated bearer tokens. When left empty, ResearchLens uses the built-in local fallback runner.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  n8n Webhook Base URL
                </label>
                <input
                  type="url"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  placeholder="https://your-n8n-instance.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Shared Webhook Secret Token
                </label>
                <input
                  type="text"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="researchlens_n8n_secret_token_2026"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Passed in 'X-ResearchLens-Secret' header to authorize both inbound and outbound triggers.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
