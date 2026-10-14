import React from 'react';
import {
  Sparkles,
  FileText,
  Lightbulb,
  Workflow,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Compass,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { ResearchPaper, ResearchContextSession, ResearchGap, AutomationExecutionLog } from '../types';

interface DashboardViewProps {
  analytics: {
    metrics: {
      totalPapers: number;
      analyzedPapers: number;
      totalSessions: number;
      totalGaps: number;
      bookmarkedGaps: number;
      totalComparisons: number;
      totalAutomations: number;
      successfulAutomations: number;
      failedAutomations: number;
      automationHealthRate: number;
    };
    categoryDistribution: { name: string; count: number }[];
    gapCategoryDistribution: { name: string; count: number }[];
    yearDistribution: { year: string; count: number }[];
  } | null;
  papers: ResearchPaper[];
  sessions: ResearchContextSession[];
  gaps: ResearchGap[];
  logs: AutomationExecutionLog[];
  onNavigate: (view: string) => void;
  onSelectPaper: (paper: ResearchPaper) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  papers,
  sessions,
  gaps,
  logs,
  onNavigate,
  onSelectPaper,
}) => {
  const metrics = analytics?.metrics || {
    totalPapers: papers.length,
    analyzedPapers: papers.length,
    totalSessions: sessions.length,
    totalGaps: gaps.length,
    bookmarkedGaps: gaps.filter(g => g.isBookmarked).length,
    totalComparisons: 0,
    totalAutomations: logs.length,
    successfulAutomations: logs.filter(l => l.status === 'completed').length,
    failedAutomations: logs.filter(l => l.status === 'failed').length,
    automationHealthRate: logs.length > 0
      ? Math.round((logs.filter(l => l.status === 'completed').length / logs.length) * 100)
      : 100,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Powered Research Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Welcome to ResearchLens Workspace
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Understand research topics with or without a PDF, analyze literature methodologies, find verifiable research gaps, inspect stylometric AI-likelihood heuristics, and orchestrate automated digests via n8n.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('context')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Topic (No PDF Needed)</span>
            </button>
            <button
              onClick={() => onNavigate('papers')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Upload Research PDF</span>
            </button>
            <button
              onClick={() => onNavigate('gaps')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
              <span>Research Gaps ({metrics.totalGaps})</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => onNavigate('papers')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Papers Indexed</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.totalPapers}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> All Extracted &amp; Chunked
          </div>
        </div>

        <div
          onClick={() => onNavigate('context')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Context Sessions</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.totalSessions}
          </div>
          <div className="text-[10px] text-indigo-300 mt-1">
            Zero-PDF Explorations
          </div>
        </div>

        <div
          onClick={() => onNavigate('gaps')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Candidate Gaps</span>
            <Lightbulb className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.totalGaps}
          </div>
          <div className="text-[10px] text-purple-300 mt-1">
            {metrics.bookmarkedGaps} Bookmarked
          </div>
        </div>

        <div
          onClick={() => onNavigate('compare')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Comparisons</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.totalComparisons}
          </div>
          <div className="text-[10px] text-amber-300 mt-1">
            Comparative Matrices
          </div>
        </div>

        <div
          onClick={() => onNavigate('automation')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>n8n Workflows</span>
            <Workflow className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            12 Flows
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" /> {metrics.automationHealthRate}% Success
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Quick Explorations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Papers & Sessions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Papers */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Recently Analyzed Research Papers
              </h2>
              <button
                onClick={() => onNavigate('papers')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View Library <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {papers.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  No research papers uploaded yet. Click "Upload Research PDF" above to begin analysis.
                </div>
              ) : (
                papers.slice(0, 3).map((paper) => (
                  <div
                    key={paper.id}
                    onClick={() => {
                      onSelectPaper(paper);
                      onNavigate('papers');
                    }}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-xs cursor-pointer transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex-1 truncate">
                      <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {paper.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {paper.authors.join(', ')} • {paper.publicationYear || 2025}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {paper.pageCount} Pages
                        </span>
                        {paper.aiLikelihood && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/40">
                            AI Likelihood: {paper.aiLikelihood.overallAiScore}%
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 mt-1" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Context Sessions Highlights */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Recent Context Explorations (Without PDF)
              </h2>
              <button
                onClick={() => onNavigate('context')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Explorer <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  No context sessions yet. Submit an inquiry in Context Explorer to generate your first research intelligence report.
                </div>
              ) : (
                sessions.slice(0, 2).map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => onNavigate('context')}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-xs cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold uppercase text-indigo-400">{sess.academicDomain}</span>
                      <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-white leading-snug">
                      {sess.topicOrQuestion}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {sess.report?.topicOverview || 'Context research report synthesized.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: High-Value Research Gaps & n8n Live Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Research Gaps */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                Featured Research Gaps
              </h2>
              <button
                onClick={() => onNavigate('gaps')}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                All Gaps <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {gaps.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  No research gaps identified yet. Discover candidate gaps in Research Gap Finder.
                </div>
              ) : (
                gaps.slice(0, 2).map((gap) => (
                  <div
                    key={gap.id}
                    onClick={() => onNavigate('gaps')}
                    className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 hover:border-purple-700 text-xs cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-purple-300 uppercase">{gap.category}</span>
                      <span className="text-emerald-400">{gap.evidenceStrength}</span>
                    </div>
                    <h3 className="font-bold text-white text-xs leading-snug">
                      {gap.title}
                    </h3>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {gap.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* n8n Live Orchestration Monitor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-rose-400" />
                Automation Monitor
              </h2>
              <button
                onClick={() => onNavigate('automation')}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                Workflows <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  No workflow executions recorded yet. Triggers will log runs automatically.
                </div>
              ) : (
                logs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    onClick={() => onNavigate('automation')}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-200 truncate">{log.workflowName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                        {new Date(log.startedAt).toLocaleTimeString()} • {log.executionMode}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
