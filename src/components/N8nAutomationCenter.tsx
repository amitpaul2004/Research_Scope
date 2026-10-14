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
  Trash2,
  Sparkles,
  RefreshCw,
  Info,
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

  const [preferredEngine, setPreferredEngine] = useState<'local' | 'remote'>('local');

  const [loading, setLoading] = useState(false);
  const [triggeringKey, setTriggeringKey] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AutomationExecutionLog | null>(null);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Settings modal & test connection
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; status?: number; message: string; hint?: string } | null>(null);

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
      if (logsRes.logs.length > 0) {
        setSelectedLog(prev => prev ? logsRes.logs.find(l => l.id === prev.id) || logsRes.logs[0] : logsRes.logs[0]);
      } else {
        setSelectedLog(null);
      }
    } catch (err) {
      console.warn('Error loading automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async (workflowKey: string, forceLocal?: boolean) => {
    setTriggeringKey(workflowKey);
    const useLocal = forceLocal !== undefined ? forceLocal : (preferredEngine === 'local' || !config.enabled);
    try {
      const res = await api.triggerWorkflow(workflowKey, {
        triggeredManually: true,
        source: 'ResearchLens Automation Center UI',
        forceLocal: useLocal,
      });
      setLogs([res.executionLog, ...logs]);
      setSelectedLog(res.executionLog);
      const wfRes = await api.getWorkflows();
      setWorkflows(wfRes.workflows);
    } catch (err) {
      console.warn('Trigger workflow failed:', err);
    } finally {
      setTriggeringKey(null);
    }
  };

  const handleRetry = async (logId: string, forceLocal: boolean = false) => {
    setRetryingLogId(logId);
    try {
      const res = await api.retryExecutionLog(logId, forceLocal);
      const updatedLogs = [res.executionLog, ...logs.filter(l => l.id !== res.executionLog.id && l.id !== logId)];
      setLogs(updatedLogs);
      setSelectedLog(res.executionLog);
      const wfRes = await api.getWorkflows();
      setWorkflows(wfRes.workflows);
    } catch (err) {
      console.warn('Retry failed:', err);
    } finally {
      setRetryingLogId(null);
    }
  };

  const handleDeleteLog = async (logId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Optimistic removal so log disappears instantly
    const remaining = logs.filter(l => l.id !== logId);
    setLogs(remaining);
    if (selectedLog?.id === logId) {
      setSelectedLog(remaining[0] || null);
    }
    try {
      await api.deleteAutomationLog(logId);
    } catch (err) {
      console.warn('Delete log failed:', err);
    }
  };

  const handleClearFailedLogs = async () => {
    // Optimistic removal of all failed logs
    const remaining = logs.filter(l => l.status !== 'failed');
    setLogs(remaining);
    if (selectedLog?.status === 'failed') {
      setSelectedLog(remaining[0] || null);
    }
    try {
      await api.clearFailedAutomationLogs();
    } catch (err) {
      console.warn('Clear failed logs failed:', err);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testN8nConnection(webhookUrlInput);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
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
      console.warn('Update config failed:', err);
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

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Dual Engine Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setPreferredEngine('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preferredEngine === 'local'
                  ? 'bg-emerald-600/25 border border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Execute workflows locally with zero dependencies"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local Engine (Reliable)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreferredEngine('remote')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preferredEngine === 'remote'
                  ? 'bg-indigo-600/25 border border-indigo-500/50 text-indigo-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dispatch to external n8n webhook instance"
            >
              <Workflow className="w-3.5 h-3.5 text-indigo-400" />
              <span>Remote n8n Webhook</span>
            </button>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
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
            <div className="flex items-center gap-2">
              {logs.some(l => l.status === 'failed') && (
                <button
                  onClick={handleClearFailedLogs}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 transition-colors cursor-pointer"
                  title="Clear all failed jobs from queue"
                >
                  <Trash2 className="w-3 h-3" /> Clear Failed
                </button>
              )}
              <button
                onClick={loadAutomationData}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No logs recorded yet. Click "Test Run" above to execute any workflow.
              </p>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all group ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            log.status === 'completed'
                              ? 'bg-emerald-400'
                              : log.status === 'failed'
                              ? 'bg-rose-400'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                        <span className="font-semibold text-slate-200 truncate">{log.workflowName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                        Job: {log.jobId} • {log.executionMode} • {new Date(log.startedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          log.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : log.status === 'failed'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {log.executionMode === 'fallback_recovery' ? 'Recovered' : log.status}
                      </span>

                      <button
                        onClick={(e) => handleDeleteLog(log.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove log from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedLog.jobId}
                  </span>
                  <button
                    onClick={() => handleDeleteLog(selectedLog.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete this log"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </h3>

            {selectedLog ? (
              <div className="space-y-3.5 text-xs">
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

                {/* Error Diagnostic Card if Failed or Notice */}
                {selectedLog.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Diagnostics / Webhook Response</span>
                    </div>
                    <p className="text-[11px] leading-relaxed break-words font-mono bg-black/30 p-2 rounded border border-rose-900/40 text-rose-200">
                      {selectedLog.errorMessage}
                    </p>
                    <div className="text-[10px] text-rose-300/80 leading-normal pt-0.5">
                      💡 <strong>Actionable Guidance:</strong> If using n8n cloud or remote webhook, ensure the workflow is toggled to <strong>Active</strong> in the n8n editor, or click <em>Execute via Local Engine</em> below to run autonomously.
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Input Payload:</span>
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-28">
                    {JSON.stringify(selectedLog.inputPayload, null, 2)}
                  </pre>
                </div>

                {selectedLog.outputResult && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Output Result:</span>
                    <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-36">
                      {JSON.stringify(selectedLog.outputResult, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Recovery Actions for Failed or Dead-Letter Jobs */}
                {selectedLog.status === 'failed' && (
                  <div className="pt-1 space-y-2">
                    <button
                      onClick={() => handleRetry(selectedLog.id, true)}
                      disabled={retryingLogId === selectedLog.id}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-60 shadow-lg shadow-emerald-950/40"
                    >
                      {retryingLogId === selectedLog.id ? (
                        <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Execute via Local Autonomous Engine (Immediate Recovery)</span>
                    </button>

                    <button
                      onClick={() => handleRetry(selectedLog.id, false)}
                      disabled={retryingLogId === selectedLog.id}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Retry via Remote n8n Webhook</span>
                    </button>
                  </div>
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
              Connect your self-hosted or cloud n8n deployment. When configured and active, events dispatch directly to your n8n webhooks. When left empty or inactive, ResearchLens uses the built-in local autonomous engine.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  n8n Webhook URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrlInput}
                    onChange={(e) => setWebhookUrlInput(e.target.value)}
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !webhookUrlInput.trim()}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {testingConnection ? (
                      <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    {testResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.hint && (
                    <p className="text-[11px] text-slate-300/90 pl-5">
                      💡 {testResult.hint}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Shared Webhook Secret Token
                </label>
                <input
                  type="text"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="researchlens_n8n_secret_token_2026"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Passed in 'X-ResearchLens-Secret' header to authorize both inbound and outbound triggers.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWebhookUrlInput('');
                    setConfig({ ...config, enabled: false, webhookBaseUrl: '' });
                  }}
                  className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
                >
                  Clear &amp; Use Local Engine
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
