import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Bookmark,
  Download,
  Trash2,
  CheckCircle2,
  Layers,
  HelpCircle,
  FileCheck,
  AlertCircle,
  Clock,
  ChevronRight,
  ListFilter,
  Flame,
  Search,
} from 'lucide-react';
import { api } from '../api';
import { ResearchContextSession } from '../types';
import { Scroll3DSection } from './animations/Scroll3DSection';
import { Tilt3DCard } from './animations/Tilt3DCard';

interface ContextExplorerProps {
  onExport: (type: 'session', id: string) => void;
  onNavigateToGaps: () => void;
}

export const ContextExplorer: React.FC<ContextExplorerProps> = ({
  onExport,
  onNavigateToGaps,
}) => {
  // Form State
  const [topicOrQuestion, setTopicOrQuestion] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [researchObjective, setResearchObjective] = useState('');
  const [academicDomain, setAcademicDomain] = useState('Computer Science & AI');
  const [depth, setDepth] = useState<'Quick Overview' | 'Standard Analysis' | 'In-Depth Analysis'>('In-Depth Analysis');
  const [responseStyle, setResponseStyle] = useState<'Academic & Formal' | 'Executive & Concise' | 'Comprehensive & Methodological'>('Academic & Formal');

  // Execution & Sessions
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('Initializing research explorer...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ResearchContextSession[]>([]);
  const [activeSession, setActiveSession] = useState<ResearchContextSession | null>(null);

  // Follow-Up Chat State
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Tab within analysis report
  const [reportTab, setReportTab] = useState<'overview' | 'methodologies' | 'gaps' | 'literature' | 'validity'>('overview');

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await api.getContextSessions();
      setSessions(res.sessions);
      if (res.sessions.length > 0) {
        setActiveSession(prev => prev || res.sessions[0]);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.warn('Failed to load context sessions:', err);
    }
  };

  const handleClear = () => {
    setTopicOrQuestion('');
    setAdditionalContext('');
    setResearchObjective('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicOrQuestion.trim() || topicOrQuestion.trim().length < 5) {
      setErrorMessage('Please enter a research topic or question with at least 5 characters.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    // Staged animated progress messages
    const stages = [
      'Querying academic repositories (arXiv & OpenAlex)...',
      'Synthesizing theoretical foundations & methodologies...',
      'Evaluating technical challenges & hardware limits...',
      'Surfacing candidate research gaps & hypotheses...',
      'Formatting intelligence report & citations...',
    ];
    let stageIdx = 0;
    setLoadingStage(stages[0]);
    const timer = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setLoadingStage(stages[stageIdx]);
      }
    }, 1800);

    try {
      const res = await api.analyzeContext({
        topicOrQuestion,
        additionalContext,
        researchObjective,
        academicDomain,
        depth,
        responseStyle,
      });

      clearInterval(timer);
      setLoading(false);
      setActiveSession(res.session);
      setSessions([res.session, ...sessions.filter(s => s.id !== res.session.id)]);
    } catch (err: any) {
      clearInterval(timer);
      setLoading(false);
      setErrorMessage(err?.message || 'Unable to complete research analysis. Please try again.');
    }
  };

  const handleSendFollowUp = async (customQ?: string) => {
    const q = customQ || followUpQuestion;
    if (!q.trim() || !activeSession) return;

    setChatLoading(true);
    setFollowUpQuestion('');
    try {
      const res = await api.sendContextChat(activeSession.id, q.trim());
      const updated = {
        ...activeSession,
        chatHistory: res.chatHistory,
      };
      setActiveSession(updated);
      setSessions(sessions.map(s => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      console.error('Follow-up failed:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Optimistic UI update so card disappears immediately
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (activeSession?.id === id) {
      setActiveSession(remaining[0] || null);
    }
    try {
      await api.deleteContextSession(id);
    } catch (err) {
      console.warn('Delete session failed:', err);
    }
  };

  const promptSuggestions = [
    'Explain this topic in simpler language.',
    'What machine learning models could be suitable?',
    'What are the limitations of existing approaches?',
    'Suggest five possible research questions.',
    'Compare two possible candidate methodologies.',
    'What datasets might be useful?',
    'Help me develop a structured research proposal.',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Core Capability: Zero-PDF Exploration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Research Context Explorer
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Explore academic concepts, identify methodological frontiers, retrieve legitimate papers, and discover testable research gaps — entirely from your inquiry, without needing a PDF.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & History Drawer */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Context Input Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Input Research Context
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Form
              </button>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Topic / Question Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Research Topic, Question, or Idea <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={topicOrQuestion}
                  onChange={(e) => setTopicOrQuestion(e.target.value)}
                  placeholder="Describe the research topic, problem, idea, or question you want to explore. You do not need to upload a PDF."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
                />
              </div>

              {/* Research Objective */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Research Objective (Optional)
                </label>
                <input
                  type="text"
                  value={researchObjective}
                  onChange={(e) => setResearchObjective(e.target.value)}
                  placeholder="e.g. Synthesize state-of-the-art models, detect bottlenecks, discover novel gaps"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Additional Context */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Additional Background Context or Constraints (Optional)
                </label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. Target hardware has <256KB RAM; sensors experience biofouling drift; riverbed bathymetry is uncertain."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Domain & Depth Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Academic Domain
                  </label>
                  <select
                    value={academicDomain}
                    onChange={(e) => setAcademicDomain(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Computer Science & AI">Computer Science &amp; AI</option>
                    <option value="Environmental Engineering & IoT">Environmental &amp; IoT</option>
                    <option value="Biomedicine & Genomics">Biomedicine &amp; Genomics</option>
                    <option value="Physics & Materials">Physics &amp; Materials</option>
                    <option value="Energy & Sustainability">Energy &amp; Sustainability</option>
                    <option value="Interdisciplinary Science">Interdisciplinary Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Analysis Depth
                  </label>
                  <select
                    value={depth}
                    onChange={(e) => setDepth(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Quick Overview">Quick Overview</option>
                    <option value="Standard Analysis">Standard Analysis</option>
                    <option value="In-Depth Analysis">In-Depth Analysis</option>
                  </select>
                </div>
              </div>

              {/* Response Style */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preferred Response Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Academic & Formal', label: 'Academic' },
                    { id: 'Executive & Concise', label: 'Concise' },
                    { id: 'Comprehensive & Methodological', label: 'Methodological' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setResponseStyle(style.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-all ${
                        responseStyle === style.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs py-3 px-4 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Analyzing Literature &amp; Models...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit for In-Depth Analysis</span>
                  </>
                )}
              </button>
            </form>

            {/* Loading Indicator with Stage Progression */}
            {loading && (
              <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-xs text-indigo-300 animate-pulse space-y-1.5">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span>{loadingStage}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Orchestrating live arXiv &amp; OpenAlex queries through n8n automation pipeline.
                </p>
              </div>
            )}
          </div>

          {/* Past Context Sessions Drawer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Previous Research Sessions ({sessions.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No sessions yet. Submit an inquiry above!
                </p>
              ) : (
                sessions.map((sess) => {
                  const isSelected = activeSession?.id === sess.id;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => setActiveSession(sess)}
                      className={`group flex items-start justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 pr-2 truncate">
                        <p className="font-medium truncate">{sess.topicOrQuestion}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span>{sess.academicDomain}</span>
                          <span>•</span>
                          <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg transition-colors cursor-pointer shrink-0 z-10"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400/80 hover:text-rose-400" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Analysis Report & Interactive Chat */}
        <div className="lg:col-span-7 space-y-6">
          {activeSession && activeSession.report ? (
            <Scroll3DSection depth="shallow">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
              {/* Header Bar of Active Session */}
              <div className="border-b border-slate-800 p-4 sm:p-5 bg-slate-950/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {activeSession.academicDomain}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {activeSession.depth}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Report Complete
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {activeSession.topicOrQuestion}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onExport('session', activeSession.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                      title="Export report as Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(activeSession.id, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                      title="Delete this session"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs */}
                <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 text-xs border-t border-slate-800/80 pt-3">
                  {[
                    { id: 'overview', label: 'Overview & Background' },
                    { id: 'methodologies', label: 'Methodologies & Approaches' },
                    { id: 'gaps', label: 'Research Gaps & Questions' },
                    { id: 'literature', label: 'Related Papers (Verified)' },
                    { id: 'validity', label: 'Epistemic Grounding' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setReportTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                        reportTab === tab.id
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-5 text-xs text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto space-y-6">
                {/* 1. OVERVIEW & BACKGROUND */}
                {reportTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        Topic Overview
                      </h4>
                      <p className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 leading-relaxed text-slate-300">
                        {activeSession.report.topicOverview}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Key Concepts &amp; Terminology
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeSession.report.keyConcepts.map((kc, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="font-semibold text-indigo-300 text-xs">{kc.concept}</span>
                            <p className="text-[11px] text-slate-400 mt-1 leading-normal">{kc.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Foundational Research Background
                      </h4>
                      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-slate-300 leading-relaxed">
                        {activeSession.report.researchBackground}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. METHODOLOGIES & APPROACHES */}
                {reportTab === 'methodologies' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Existing State-of-the-Art Approaches
                      </h4>
                      <div className="space-y-2.5">
                        {activeSession.report.existingApproaches.map((app, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                            <h5 className="font-semibold text-slate-100 text-xs">{app.approach}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px]">
                              <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
                                <span className="font-bold">Advantages:</span> {app.pros}
                              </div>
                              <div className="p-2 rounded bg-rose-950/30 border border-rose-900/40 text-rose-300">
                                <span className="font-bold">Limitations:</span> {app.cons}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Detailed Methodology &amp; Architecture Analysis
                      </h4>
                      <p className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 leading-relaxed">
                        {activeSession.report.methodologyAnalysis}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Current Technical &amp; Practical Challenges
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                        {activeSession.report.currentChallenges.map((c, i) => (
                          <li key={i} className="text-slate-300">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 3. RESEARCH GAPS & QUESTIONS */}
                {reportTab === 'gaps' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-purple-400" />
                        Candidate Research Gaps
                      </h4>
                      <button
                        onClick={onNavigateToGaps}
                        className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        Open Gap Workspace <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeSession.report.potentialResearchGaps.map((gap, i) => (
                        <div key={i} className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-200 text-xs">{gap.title}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/50">
                              {gap.urgency} Urgency
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{gap.description}</p>
                          <div className="text-[10px] text-purple-300/80">
                            Category: <span className="capitalize">{gap.gapType}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Formulated Research Questions for Future Studies
                      </h4>
                      <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                        {activeSession.report.researchQuestions.map((q, i) => (
                          <div key={i} className="flex items-start gap-2 text-indigo-300">
                            <span className="font-bold text-slate-500">Q{i + 1}.</span>
                            <span className="text-slate-200">{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Potential Original Contributions
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                        {activeSession.report.potentialContributions.map((contrib, i) => (
                          <li key={i} className="text-slate-300">{contrib}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 4. RELATED PAPERS */}
                {reportTab === 'literature' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 text-blue-200 text-xs flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>
                        Verified academic references retrieved directly from academic literature indices (arXiv &amp; OpenAlex).
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activeSession.report.relatedResearchPapers.map((paper, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="font-semibold text-white text-xs leading-snug">
                                {paper.title}
                              </h5>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {paper.authors.join(', ')} • {paper.year} • <span className="text-indigo-400">{paper.source}</span>
                              </p>
                            </div>
                            {paper.url && (
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] shrink-0 transition-colors"
                              >
                                View Paper <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2.5 rounded border border-slate-800/60">
                            "{paper.abstractExcerpt}"
                          </p>
                          <p className="text-[10px] text-indigo-300 font-medium">
                            Relevance: {paper.relevanceReason}
                          </p>
                        </div>
                      ))}
                    </div>

                    {activeSession.report.furtherReading && activeSession.report.furtherReading.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-slate-200 mb-2">Recommended Further Reading</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeSession.report.furtherReading.map((fr, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                              <span className="font-semibold text-slate-200">{fr.title}</span>
                              <p className="text-slate-500 text-[10px]">{fr.type} • {fr.linkOrReference}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. EPISTEMIC GROUNDING (Verified vs Hypotheses) */}
                {reportTab === 'validity' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs">
                      <span className="font-bold">Epistemic Calibration Principle:</span> ResearchLens strictly delineates between verified empirical facts from literature, synthetic AI interpretations, and hypotheses that require laboratory/computational validation.
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-800/50">
                        <h5 className="font-bold text-emerald-300 text-xs mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Literature Facts
                        </h5>
                        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-300">
                          {activeSession.report.verifiedVsHypotheses.verifiedFacts.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-950/25 border border-blue-800/50">
                        <h5 className="font-bold text-blue-300 text-xs mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> AI Conceptual Interpretations
                        </h5>
                        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-300">
                          {activeSession.report.verifiedVsHypotheses.aiInterpretations.map((interp, i) => (
                            <li key={i}>{interp}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-purple-950/25 border border-purple-800/50">
                        <h5 className="font-bold text-purple-300 text-xs mb-2 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" /> Untested Candidate Hypotheses (Requires Empirical Test)
                        </h5>
                        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-300">
                          {activeSession.report.verifiedVsHypotheses.untestedHypotheses.map((hypo, i) => (
                            <li key={i}>{hypo}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Follow-Up Questions Section */}
              <div className="border-t border-slate-800 p-5 bg-slate-950">
                <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Interactive Research Follow-Up Q&amp;A
                </h3>

                {/* Prompt Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
                  {promptSuggestions.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={chatLoading}
                      onClick={() => handleSendFollowUp(prompt)}
                      className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-slate-400 hover:text-indigo-200 text-[10px] whitespace-nowrap transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Conversation History */}
                {activeSession.chatHistory && activeSession.chatHistory.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                    {activeSession.chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-100 ml-8'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 mr-8'
                        }`}
                      >
                        <div className="text-[10px] font-semibold text-slate-500 mb-1">
                          {msg.role === 'user' ? 'Researcher' : 'ResearchLens Advisor'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendFollowUp();
                    }}
                    placeholder="Ask a follow-up question preserving research context..."
                    className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendFollowUp()}
                    disabled={chatLoading || !followUpQuestion.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {chatLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Scroll3DSection>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-400">No Active Research Report</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Enter your research topic on the left or select a previous session to inspect structured intelligence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
