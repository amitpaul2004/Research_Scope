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
import { Cinematic3DHero } from './animations/Cinematic3DHero';
import { Tilt3DCard } from './animations/Tilt3DCard';
import { Animated3DCounter } from './animations/Animated3DCounter';
import { Scroll3DSection } from './animations/Scroll3DSection';
import { Scroll3DShowcase } from './animations/Scroll3DShowcase';

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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Cinematic 3D Hero Section */}
      <Cinematic3DHero
        onNavigate={onNavigate}
        totalGaps={metrics.totalGaps}
        totalPapers={metrics.totalPapers}
      />

      {/* Top Level Metric Cards with 3D Tilt & Specular Glare */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Tilt3DCard
          index={0}
          maxTilt={10}
          scaleOnHover={1.03}
          onClick={() => onNavigate('papers')}
          className="cursor-pointer"
        >
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Papers Indexed</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              <Animated3DCounter value={metrics.totalPapers} />
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> All Extracted &amp; Chunked
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          index={1}
          maxTilt={10}
          scaleOnHover={1.03}
          onClick={() => onNavigate('context')}
          className="cursor-pointer"
        >
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Context Sessions</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              <Animated3DCounter value={metrics.totalSessions} />
            </div>
            <div className="text-[10px] text-indigo-300 mt-1">
              Zero-PDF Explorations
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          index={2}
          maxTilt={10}
          scaleOnHover={1.03}
          onClick={() => onNavigate('gaps')}
          className="cursor-pointer"
        >
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Candidate Gaps</span>
              <Lightbulb className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              <Animated3DCounter value={metrics.totalGaps} />
            </div>
            <div className="text-[10px] text-purple-300 mt-1">
              {metrics.bookmarkedGaps} Bookmarked
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          index={3}
          maxTilt={10}
          scaleOnHover={1.03}
          onClick={() => onNavigate('compare')}
          className="cursor-pointer"
        >
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Comparisons</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              <Animated3DCounter value={metrics.totalComparisons} />
            </div>
            <div className="text-[10px] text-amber-300 mt-1">
              Comparative Matrices
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          index={4}
          maxTilt={10}
          scaleOnHover={1.03}
          onClick={() => onNavigate('automation')}
          className="cursor-pointer"
        >
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>n8n Workflows</span>
              <Workflow className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              <Animated3DCounter value={12} suffix=" Flows" />
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" /> {metrics.automationHealthRate}% Success
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* Main Grid: Scroll-Driven 3D Section */}
      <Scroll3DSection depth="medium">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Recent Papers & Sessions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recent Papers */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Recently Analyzed Research Papers
                </h2>
                <button
                  onClick={() => onNavigate('papers')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
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
                  papers.slice(0, 3).map((paper, pIdx) => (
                    <Tilt3DCard
                      key={paper.id}
                      index={pIdx}
                      maxTilt={5}
                      scaleOnHover={1.015}
                      onClick={() => {
                        onSelectPaper(paper);
                        onNavigate('papers');
                      }}
                      className="cursor-pointer"
                    >
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 text-xs transition-all flex items-start justify-between gap-3 group">
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
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Tilt3DCard>
                  ))
                )}
              </div>
            </div>

            {/* Context Sessions Highlights */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Recent Context Explorations (Without PDF)
                </h2>
                <button
                  onClick={() => onNavigate('context')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
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
                  sessions.slice(0, 2).map((sess, sIdx) => (
                    <Tilt3DCard
                      key={sess.id}
                      index={sIdx}
                      maxTilt={5}
                      scaleOnHover={1.015}
                      onClick={() => onNavigate('context')}
                      className="cursor-pointer"
                    >
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 text-xs transition-all space-y-1.5">
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
                    </Tilt3DCard>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: High-Value Research Gaps & n8n Live Status */}
          <div className="lg:col-span-5 space-y-6">
            {/* Top Research Gaps */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  Featured Research Gaps
                </h2>
                <button
                  onClick={() => onNavigate('gaps')}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
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
                  gaps.slice(0, 2).map((gap, gIdx) => (
                    <Tilt3DCard
                      key={gap.id}
                      index={gIdx}
                      maxTilt={6}
                      scaleOnHover={1.02}
                      onClick={() => onNavigate('gaps')}
                      className="cursor-pointer"
                    >
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 hover:border-purple-700 text-xs transition-all space-y-1.5">
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
                    </Tilt3DCard>
                  ))
                )}
              </div>
            </div>

            {/* n8n Live Orchestration Monitor */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-rose-400" />
                  Automation Monitor
                </h2>
                <button
                  onClick={() => onNavigate('automation')}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
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
                  logs.slice(0, 4).map((log, lIdx) => (
                    <Tilt3DCard
                      key={log.id}
                      index={lIdx}
                      maxTilt={4}
                      scaleOnHover={1.015}
                      onClick={() => onNavigate('automation')}
                      className="cursor-pointer"
                    >
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between hover:border-slate-700 transition-colors">
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
                    </Tilt3DCard>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Scroll3DSection>

      {/* Interactive 3D Research Architecture Journey */}
      <Scroll3DShowcase onNavigate={onNavigate} />
    </div>
  );
};
