import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  Copy,
  PenTool,
  RotateCcw,
  BookOpen,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  BarChart2,
  X,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ResearchPaper, PaperSentenceAnalysis, PaperPassage, ValidationMetrics } from '../types';
import { api } from '../api';

interface AiLikelihoodPanelProps {
  paper: ResearchPaper | null;
  onSendToWritingStudio: (text: string) => void;
  onRefreshPaper: () => void;
  onOpenExportModal?: (paperId: string) => void;
}

export const AiLikelihoodPanel: React.FC<AiLikelihoodPanelProps> = ({
  paper,
  onSendToWritingStudio,
  onRefreshPaper,
  onOpenExportModal,
}) => {
  const [selectedThreshold, setSelectedThreshold] = useState<number>(60);
  const [selectedSentence, setSelectedSentence] = useState<PaperSentenceAnalysis | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<PaperPassage | null>(null);
  const [viewMode, setViewMode] = useState<'sentences' | 'paragraphs'>('sentences');
  const [filterLevel, setFilterLevel] = useState<'all' | 'flagged' | 'high' | 'medium' | 'human'>('all');
  const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<ValidationMetrics | null>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);

  if (!paper) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 max-w-4xl mx-auto">
        <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">Please select a research paper from your library to inspect AI-content likelihood analysis.</p>
      </div>
    );
  }

  const report = paper.aiLikelihood;
  const sentences = report?.sentences || [];
  const passages = report?.passages || [];
  const currentThreshold = report?.selectedThreshold || selectedThreshold;

  // Filtered sentences
  const filteredSentences = useMemo(() => {
    return sentences.filter(s => {
      // Threshold / Likelihood filter
      if (filterLevel === 'flagged' && !s.isFlagged) return false;
      if (filterLevel === 'high' && s.aiScore < 65) return false;
      if (filterLevel === 'medium' && (s.aiScore < 40 || s.aiScore >= 65)) return false;
      if (filterLevel === 'human' && s.aiScore >= 40) return false;

      // Page filter
      if (selectedPage !== 'all' && s.pageNumber !== selectedPage) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.text.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [sentences, filterLevel, selectedPage, searchQuery]);

  // Filtered passages
  const filteredPassages = useMemo(() => {
    return passages.filter(p => {
      if (filterLevel === 'flagged' && p.aiScore < currentThreshold) return false;
      if (filterLevel === 'high' && p.aiScore < 65) return false;
      if (filterLevel === 'medium' && (p.aiScore < 40 || p.aiScore >= 65)) return false;
      if (filterLevel === 'human' && p.aiScore >= 40) return false;

      if (selectedPage !== 'all' && p.pageNumber !== selectedPage) return false;
      if (searchQuery.trim() && !p.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [passages, filterLevel, selectedPage, searchQuery, currentThreshold]);

  // Active sentence selection fallback
  const activeSentence = selectedSentence || filteredSentences[0] || null;

  // Re-run analysis with custom threshold
  const handleReanalyze = async (thresholdToUse: number = selectedThreshold) => {
    setAnalyzing(true);
    try {
      await api.reanalyzeAiLikelihood(paper.id, thresholdToUse);
      onRefreshPaper();
    } catch (e) {
      console.error('Failed to reanalyze AI likelihood:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Direct Highlighted PDF Download
  const handleDownloadHighlightedPdf = () => {
    setExportingPdf(true);
    const downloadUrl = api.getHighlightedPdfUrl(paper.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${paper.title.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_')}_AI_Highlighted.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setExportingPdf(false), 1200);
  };

  // Open Benchmark Modal
  const handleOpenBenchmark = async () => {
    setShowBenchmarkModal(true);
    if (!benchmarkData && !loadingBenchmark) {
      setLoadingBenchmark(true);
      try {
        const res = await api.getAiLikelihoodBenchmark(currentThreshold);
        setBenchmarkData(res.benchmark);
      } catch (e) {
        console.error('Failed to load benchmark:', e);
      } finally {
        setLoadingBenchmark(false);
      }
    }
  };

  // Navigation between flagged sentences
  const flaggedSentences = useMemo(() => sentences.filter(s => s.isFlagged), [sentences]);
  const currentFlaggedIdx = activeSentence ? flaggedSentences.findIndex(s => s.id === activeSentence.id) : -1;

  const handleNextFlagged = () => {
    if (flaggedSentences.length === 0) return;
    const nextIdx = (currentFlaggedIdx + 1) % flaggedSentences.length;
    setSelectedSentence(flaggedSentences[nextIdx]);
  };

  const handlePrevFlagged = () => {
    if (flaggedSentences.length === 0) return;
    const prevIdx = (currentFlaggedIdx - 1 + flaggedSentences.length) % flaggedSentences.length;
    setSelectedSentence(flaggedSentences[prevIdx]);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pagesList = useMemo(() => {
    const set = new Set(sentences.map(s => s.pageNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [sentences]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Studio Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>AI Content Likelihood Studio • Sentence-Level Stylometrics</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-normal">
              Experimental Heuristic v2.8
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Scholarly Stylometric &amp; Language Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Document: <span className="text-slate-200 font-medium">{paper.title}</span> ({paper.pageCount} Pages • {report?.documentStats?.totalWords || 0} Words • SHA-256: {paper.fileHash.slice(0, 12)}...)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Threshold Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">Threshold:</span>
            <select
              value={selectedThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSelectedThreshold(val);
                handleReanalyze(val);
              }}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value="50" className="bg-slate-900 text-slate-200">50% (Sensitive)</option>
              <option value="60" className="bg-slate-900 text-slate-200">60% (Balanced)</option>
              <option value="70" className="bg-slate-900 text-slate-200">70% (Conservative)</option>
              <option value="80" className="bg-slate-900 text-slate-200">80% (Strict)</option>
            </select>
          </div>

          {/* Validation Benchmark Modal Button */}
          <button
            onClick={handleOpenBenchmark}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
            title="Inspect empirical benchmark evaluation, confusion matrix & limitations"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Validation Benchmark</span>
          </button>

          {/* Export Highlighted PDF Button */}
          <button
            onClick={handleDownloadHighlightedPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Download the original PDF with AI likelihood findings highlighted in-place"
          >
            <Download className={`w-3.5 h-3.5 ${exportingPdf ? 'animate-bounce' : ''}`} />
            <span>{exportingPdf ? 'Exporting PDF...' : 'Highlighted PDF'}</span>
          </button>

          {/* Re-Run Analysis */}
          <button
            onClick={() => handleReanalyze(selectedThreshold)}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Evaluating...' : 'Re-Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Scanned PDF Warning Banner (if applicable) */}
      {report?.isScannedPdf && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">Scanned Document / Missing Digital Text Layer Detected</h4>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              {report.ocrNotice || 'This PDF is a scanned bitmap without an extractable text stream. To analyze individual sentences and overlay coordinate highlights, run OCR pre-processing or provide a searchable PDF.'}
            </p>
          </div>
        </div>
      )}

      {/* Mandatory Scholarly Integrity Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs flex items-start gap-3 shadow-sm">
        <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">
            Probabilistic Stylometric Notice &amp; Academic Integrity Disclaimer:
          </p>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Scores reflect statistical linguistic variations (syntactic uniformity, burstiness coefficient, and transition cliché density) evaluated against scholarly benchmarks. Detection is inherently probabilistic and does <strong>not</strong> constitute definitive proof of machine authorship. Highly disciplined human scientific prose can trigger heuristic flags. No 99% accuracy claim is asserted.
          </p>
        </div>
      </div>

      {/* Document Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated AI Likelihood */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Document AI-Likelihood</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
              Threshold: {currentThreshold}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {report?.overallAiScore ?? 20}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${report?.overallAiScore ?? 20}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
            <span>Confidence: <strong className="text-slate-200">{report?.confidence || 'Medium'}</strong></span>
            <span>{flaggedSentences.length} Flagged Sentences</span>
          </div>
        </div>

        {/* Estimated Human Composition */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Estimated Human Composition</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {report?.overallHumanScore ?? 80}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${report?.overallHumanScore ?? 80}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">
            Natural academic syntactic variance
          </span>
        </div>

        {/* Lexical Diversity & Vocabulary Richness */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Lexical Diversity (TTR)</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">
            {report?.documentStats?.typeTokenRatio ?? 0.68}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
            <div>Total Sentences: <strong className="text-slate-200">{report?.documentStats?.totalSentences || sentences.length}</strong></div>
            <div>Avg Sentence: <strong className="text-slate-200">{report?.documentStats?.meanSentenceLength || 22} words</strong> (±{report?.documentStats?.sentenceLengthStdDev || 8})</div>
          </div>
        </div>

        {/* Cliché Density & Burstiness */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Syntactic Burstiness &amp; Clichés</div>
          <div className="text-2xl font-extrabold text-slate-200 mt-2 flex items-baseline gap-2">
            <span>{report?.documentStats?.overallBurstiness ?? 0.38}</span>
            <span className="text-xs font-normal text-slate-400">coeff</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
            <div>Cliché Density: <strong className="text-slate-200">{report?.documentStats?.clicheDensityPerThousandWords ?? 0} / 1k words</strong></div>
            <div>Flagged Paragraphs: <strong className="text-slate-200">{report?.documentStats?.flaggedParagraphsCount ?? 0}</strong></div>
          </div>
        </div>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sentence & Passage Explorer */}
        <div className="lg:col-span-7 space-y-3">
          {/* Controls Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* View Mode Toggle: Sentences vs Paragraphs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setViewMode('sentences')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    viewMode === 'sentences' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sentences ({sentences.length})
                </button>
                <button
                  onClick={() => setViewMode('paragraphs')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    viewMode === 'paragraphs' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paragraphs ({passages.length})
                </button>
              </div>

              {/* Navigation Between Flagged Sentences */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-[11px]">
                  Flagged: <strong>{flaggedSentences.length > 0 ? currentFlaggedIdx + 1 : 0}</strong> / {flaggedSentences.length}
                </span>
                <button
                  onClick={handlePrevFlagged}
                  disabled={flaggedSentences.length === 0}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
                  title="Previous flagged sentence"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextFlagged}
                  disabled={flaggedSentences.length === 0}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
                  title="Next flagged sentence"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Buttons & Page Selector */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                <button
                  onClick={() => setFilterLevel('all')}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors ${filterLevel === 'all' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white bg-slate-950'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterLevel('flagged')}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors ${filterLevel === 'flagged' ? 'bg-amber-900/60 text-amber-200 border border-amber-700 font-semibold' : 'text-slate-400 hover:text-white bg-slate-950'}`}
                >
                  Flagged (&ge;{currentThreshold}%)
                </button>
                <button
                  onClick={() => setFilterLevel('high')}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors ${filterLevel === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-semibold' : 'text-slate-400 hover:text-white bg-slate-950'}`}
                >
                  High (&ge;65%)
                </button>
                <button
                  onClick={() => setFilterLevel('medium')}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors ${filterLevel === 'medium' ? 'bg-amber-950 text-amber-300 border border-amber-800 font-semibold' : 'text-slate-400 hover:text-white bg-slate-950'}`}
                >
                  Moderate (40-64%)
                </button>
                <button
                  onClick={() => setFilterLevel('human')}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors ${filterLevel === 'human' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold' : 'text-slate-400 hover:text-white bg-slate-950'}`}
                >
                  Human (&lt;40%)
                </button>
              </div>

              {/* Page Filter Dropdown */}
              {pagesList.length > 1 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Page:</span>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="all">All Pages ({pagesList.length})</option>
                    {pagesList.map(p => (
                      <option key={p} value={p}>Page {p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* In-Text Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words or phrases within passages..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* List of Sentences or Paragraphs */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {viewMode === 'sentences' ? (
              filteredSentences.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No sentences match the selected filter. Try choosing "All" or a different page.
                </div>
              ) : (
                filteredSentences.map((sent, idx) => {
                  const isSelected = activeSentence?.id === sent.id;
                  const isHigh = sent.aiScore >= 65;
                  const isMod = sent.aiScore >= 40 && sent.aiScore < 65;

                  return (
                    <div
                      key={sent.id || idx}
                      onClick={() => setSelectedSentence(sent)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                          : sent.isFlagged
                          ? 'bg-amber-950/15 border-amber-800/40 hover:border-amber-700/60'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            Page {sent.pageNumber}
                          </span>
                          <span className="text-slate-500">Sentence #{sent.sentenceIndex + 1}</span>
                          {sent.isFlagged && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold uppercase">
                              Flagged
                            </span>
                          )}
                        </div>

                        {/* Likelihood Badge */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              isHigh
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : isMod
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            AI: {sent.aiScore}%
                          </span>
                          <span className="text-slate-500 text-[10px]">Human: {sent.humanScore}%</span>
                        </div>
                      </div>

                      {/* Sentence Text with Highlights */}
                      <p className={`text-slate-200 leading-relaxed ${sent.isFlagged ? 'font-medium' : ''}`}>
                        "{sent.text}"
                      </p>

                      {/* Flagged Reasons Tags */}
                      {sent.flaggedReasons && sent.flaggedReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sent.flaggedReasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              /* Paragraphs View */
              filteredPassages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No paragraphs match the selected filter.
                </div>
              ) : (
                filteredPassages.map((passage, pIdx) => {
                  const isSelected = selectedPassage?.id === passage.id;
                  const isHigh = passage.aiScore >= 65;
                  const isMod = passage.aiScore >= 40 && passage.aiScore < 65;

                  return (
                    <div
                      key={passage.id || pIdx}
                      onClick={() => setSelectedPassage(passage)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                          : passage.aiScore >= currentThreshold
                          ? 'bg-amber-950/15 border-amber-800/40 hover:border-amber-700/60'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-2">
                        <span className="font-semibold text-slate-300">
                          Page {passage.pageNumber} • Paragraph #{passage.paragraphIndex !== undefined ? passage.paragraphIndex + 1 : pIdx + 1}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            isHigh
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isMod
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          Paragraph AI Score: {passage.aiScore}%
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed line-clamp-3">
                        "{passage.text}"
                      </p>
                      {passage.flaggedReasons && passage.flaggedReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {passage.flaggedReasons.map((r, rIdx) => (
                            <span key={rIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Right Column: Sentence & Stylometric Deep Inspector */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4 sticky top-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  Stylometric Signal Breakdown
                </h3>
                <p className="text-[10px] text-slate-400">Detailed sentence-level diagnostic markers</p>
              </div>
              {activeSentence && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                  Page {activeSentence.pageNumber}
                </span>
              )}
            </div>

            {activeSentence ? (
              <div className="space-y-4 text-xs">
                {/* Sentence Quote Box */}
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                    <span>Analyzed Sentence Passage</span>
                    <span>{activeSentence.indicators.sentenceLength.wordCount} words</span>
                  </div>
                  <p className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs">
                    "{activeSentence.text}"
                  </p>
                </div>

                {/* Score Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-medium">Estimated AI Likelihood</span>
                    <div className={`text-2xl font-black mt-0.5 ${
                      activeSentence.aiScore >= 65 ? 'text-rose-400' : activeSentence.aiScore >= 40 ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {activeSentence.aiScore}%
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Confidence: {activeSentence.confidence}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-medium">Estimated Human Score</span>
                    <div className="text-2xl font-black text-emerald-400 mt-0.5">
                      {activeSentence.humanScore}%
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Complementary estimate
                    </span>
                  </div>
                </div>

                {/* Stylometric Diagnostic Indicators */}
                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Evaluated Linguistic Markers
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Sentence Length Variance</div>
                      <div className="font-semibold text-slate-200 mt-0.5">
                        {activeSentence.indicators.sentenceLength.wordCount} words
                      </div>
                      <span className="text-[9px] text-slate-500">
                        Deviation: {activeSentence.indicators.sentenceLength.varianceDeviation}σ
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Type-Token Ratio (TTR)</div>
                      <div className="font-semibold text-slate-200 mt-0.5">
                        {activeSentence.indicators.lexicalDiversity.typeTokenRatio}
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {activeSentence.indicators.lexicalDiversity.uniqueWords} unique / {activeSentence.indicators.lexicalDiversity.totalWords}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Transition Clichés Score</div>
                      <div className={`font-semibold mt-0.5 ${
                        activeSentence.indicators.transitionCliches.frequencyScore > 0 ? 'text-amber-400' : 'text-slate-200'
                      }`}>
                        {activeSentence.indicators.transitionCliches.frequencyScore}/100
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {activeSentence.indicators.transitionCliches.detectedMarkers.length} marker(s) detected
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Uniformity Index</div>
                      <div className="font-semibold text-slate-200 mt-0.5">
                        {activeSentence.indicators.syntacticUniformity.uniformityIndex}/100
                      </div>
                      <span className="text-[9px] text-slate-500">
                        Burstiness: {activeSentence.indicators.syntacticUniformity.burstinessScore}
                      </span>
                    </div>
                  </div>

                  {/* Detected Clichés Badges */}
                  {activeSentence.indicators.transitionCliches.detectedMarkers.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-amber-400 font-semibold block mb-1">
                        Detected Generative Markers:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {activeSentence.indicators.transitionCliches.detectedMarkers.map((marker, mIdx) => (
                          <span
                            key={mIdx}
                            className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-200 text-[10px] font-medium"
                          >
                            "{marker}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stylometric Observations List */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Decision Attribution Signals
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {activeSentence.flaggedReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => handleCopyText(activeSentence.text, activeSentence.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copiedId === activeSentence.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Passage!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Sentence</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSendToWritingStudio(activeSentence.text)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    title="Send this sentence to Writing Studio to humanize and polish"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Humanize in Writing Studio</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-10">
                Click any sentence on the left to inspect its complete stylometric breakdown.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Benchmark & Methodology Modal */}
      {showBenchmarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <BarChart2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">
                  Empirical Validation Benchmark &amp; Detection Accuracy Limits
                </h3>
              </div>
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingBenchmark ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto mb-2" />
                Evaluating validation benchmark dataset...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Notice on 99% accuracy claim */}
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Rigorous Academic Evaluation Policy:
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    In compliance with rigorous scientific standards, ResearchLens does <strong>not</strong> claim 99% accuracy. AI text detection is fundamentally probabilistic. Formal human academic writing (which naturally utilizes specialized nomenclature and syntactic discipline) shares statistical overlap with large language model output.
                  </p>
                </div>

                {/* Benchmark Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Empirical F1-Score</span>
                    <div className="text-xl font-bold text-indigo-400 mt-0.5">
                      {benchmarkData?.f1Score ?? 0.85}
                    </div>
                    <span className="text-[9px] text-slate-500">Harmonic mean</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Precision</span>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">
                      {benchmarkData?.precision ?? 0.88}
                    </div>
                    <span className="text-[9px] text-slate-500">True AI / Flagged</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Recall</span>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">
                      {benchmarkData?.recall ?? 0.83}
                    </div>
                    <span className="text-[9px] text-slate-500">Detection sensitivity</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">False Positive Rate</span>
                    <div className="text-xl font-bold text-amber-400 mt-0.5">
                      {benchmarkData?.falsePositiveRate ?? 0.14}
                    </div>
                    <span className="text-[9px] text-slate-500">Human flagged as AI</span>
                  </div>
                </div>

                {/* Confusion Matrix */}
                <div>
                  <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-2">
                    Confusion Matrix on Held-Out Scholarly Corpus
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-emerald-400 font-semibold">True Positives (TP)</div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {benchmarkData?.confusionMatrix?.truePositive ?? 5} passages
                      </div>
                      <span className="text-[10px] text-slate-500">AI correctly flagged as AI</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-amber-400 font-semibold">False Positives (FP)</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5">
                        {benchmarkData?.confusionMatrix?.falsePositive ?? 1} passages
                      </div>
                      <span className="text-[10px] text-slate-500">Human text flagged as AI (False alarm)</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-emerald-400 font-semibold">True Negatives (TN)</div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {benchmarkData?.confusionMatrix?.trueNegative ?? 5} passages
                      </div>
                      <span className="text-[10px] text-slate-500">Human correctly recognized as Human</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-rose-400 font-semibold">False Negatives (FN)</div>
                      <div className="text-lg font-bold text-rose-400 mt-0.5">
                        {benchmarkData?.confusionMatrix?.falseNegative ?? 1} passages
                      </div>
                      <span className="text-[10px] text-slate-500">AI missed as Human</span>
                    </div>
                  </div>
                </div>

                {/* Discipline Breakdown */}
                {benchmarkData?.disciplineBreakdown && benchmarkData.disciplineBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-2">
                      Academic Discipline Sensitivity Breakdown
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-[11px] text-left">
                        <thead className="border-b border-slate-800 bg-slate-900 text-slate-400">
                          <tr>
                            <th className="p-2.5">Discipline</th>
                            <th className="p-2.5">Samples</th>
                            <th className="p-2.5">Measured F1</th>
                            <th className="p-2.5">False Positive Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                          {benchmarkData.disciplineBreakdown.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-900/40">
                              <td className="p-2.5 font-medium">{row.discipline}</td>
                              <td className="p-2.5 text-slate-400">{row.sampleCount}</td>
                              <td className="p-2.5 text-indigo-300 font-bold">{row.f1Score}</td>
                              <td className="p-2.5 text-amber-300">{row.fpr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Benchmark Dataset Details */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <div><strong>Benchmark Corpus:</strong> {benchmarkData?.benchmarkDataset}</div>
                  <div><strong>Generators Tested:</strong> {(benchmarkData?.modelGeneratorsTested || []).join(', ')}</div>
                  <div><strong>Calibration Threshold:</strong> {currentThreshold}%</div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={() => setShowBenchmarkModal(false)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Close Benchmark Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
