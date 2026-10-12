import React, { useState } from 'react';
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
} from 'lucide-react';
import { ResearchPaper, PaperPassage } from '../types';
import { api } from '../api';

interface AiLikelihoodPanelProps {
  paper: ResearchPaper | null;
  onSendToWritingStudio: (text: string) => void;
  onRefreshPaper: () => void;
}

export const AiLikelihoodPanel: React.FC<AiLikelihoodPanelProps> = ({
  paper,
  onSendToWritingStudio,
  onRefreshPaper,
}) => {
  const [selectedPassage, setSelectedPassage] = useState<PaperPassage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium'>('all');

  if (!paper) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 max-w-4xl mx-auto">
        <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">Please select a research paper to inspect AI-content likelihood analysis.</p>
      </div>
    );
  }

  const report = paper.aiLikelihood;

  const handleReanalyze = async () => {
    setAnalyzing(true);
    try {
      await api.reanalyzeAiLikelihood(paper.id);
      onRefreshPaper();
    } catch (e) {
      console.error('Failed to reanalyze AI likelihood:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const passages = report?.passages || [];
  const filteredPassages = passages.filter(p => {
    if (filterLevel === 'high') return p.aiScore >= 40;
    if (filterLevel === 'medium') return p.aiScore >= 20;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Title & Paper Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>AI-Generated Content Likelihood Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Stylometric &amp; Language Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Document: <span className="text-slate-200 font-medium">{paper.title}</span> ({paper.pageCount} pages)
          </p>
        </div>

        <button
          onClick={handleReanalyze}
          disabled={analyzing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Evaluating...' : 'Re-Run Heuristic'}</span>
        </button>
      </div>

      {/* Mandatory Disclaimer Callout */}
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-amber-200/90 text-xs flex items-start gap-3 shadow-md">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            Important Stylometric Evaluation Notice &amp; Academic Disclaimer:
          </p>
          <p className="text-[11px] leading-relaxed text-amber-200/80">
            AI-detection scores are calculated using experimental linguistic heuristics (perplexity variance, uniform sentence length distribution, and formulaic rhetorical transitions). These scores do <strong>not</strong> constitute definitive proof of machine generation. Highly polished peer-reviewed prose and standard scientific taxonomy naturally exhibit syntactic regularity.
          </p>
        </div>
      </div>

      {/* Score Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estimated AI Score */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-medium text-slate-400">Estimated AI-Likelihood</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {report?.overallAiScore ?? 22}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${report?.overallAiScore ?? 22}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Confidence: {report?.confidence || 'High'}
          </span>
        </div>

        {/* Estimated Human Score */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Estimated Human Composition</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {report?.overallHumanScore ?? 78}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${report?.overallHumanScore ?? 78}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Dominant empirical markers present
          </span>
        </div>

        {/* Heuristic Markers Evaluated */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Heuristic Methodology</div>
          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed line-clamp-3">
            {report?.methodologyExplanation || 'Evaluated lexical dispersion, passive voice density, and transition entropy.'}
          </p>
          <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
            Experimental Heuristic v2.4
          </span>
        </div>
      </div>

      {/* Passages Inspector & Highlight Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Passages List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Analyzed Passages ({passages.length})
            </h3>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-500">Filter:</span>
              <button
                onClick={() => setFilterLevel('all')}
                className={`px-2 py-0.5 rounded ${filterLevel === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterLevel('medium')}
                className={`px-2 py-0.5 rounded ${filterLevel === 'medium' ? 'bg-amber-900/60 text-amber-200' : 'text-slate-400 hover:text-white'}`}
              >
                &ge; 20%
              </button>
              <button
                onClick={() => setFilterLevel('high')}
                className={`px-2 py-0.5 rounded ${filterLevel === 'high' ? 'bg-rose-900/60 text-rose-200' : 'text-slate-400 hover:text-white'}`}
              >
                &ge; 40%
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredPassages.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No passages match the current filter.
              </p>
            ) : (
              filteredPassages.map((passage, i) => {
                const isSelected = selectedPassage?.id === passage.id || (!selectedPassage && i === 0);
                return (
                  <div
                    key={passage.id || i}
                    onClick={() => setSelectedPassage(passage)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-600/50 shadow-md'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                      <span className="font-semibold text-slate-300">Page {passage.pageNumber}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${
                        passage.aiScore >= 40 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        AI Likelihood: {passage.aiScore}%
                      </span>
                    </div>

                    <p className="text-slate-300 line-clamp-2 leading-relaxed">
                      "{passage.text}"
                    </p>

                    {passage.flaggedReasons && passage.flaggedReasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {passage.flaggedReasons.map((r, rIdx) => (
                          <span key={rIdx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Passage Detail Panel */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Passage Inspection Details</span>
              {selectedPassage && (
                <span className="text-[10px] text-indigo-400">
                  Page {selectedPassage.pageNumber}
                </span>
              )}
            </h3>

            {selectedPassage ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Excerpt Text
                  </label>
                  <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed mt-1 text-xs">
                    "{selectedPassage.text}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">AI Likelihood</span>
                    <div className="text-lg font-bold text-amber-400 mt-0.5">
                      {selectedPassage.aiScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Confidence</span>
                    <div className="text-lg font-bold text-slate-200 mt-0.5">
                      {selectedPassage.confidence}
                    </div>
                  </div>
                </div>

                {selectedPassage.flaggedReasons && selectedPassage.flaggedReasons.length > 0 && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Stylometric Observations
                    </label>
                    <ul className="mt-1 space-y-1 list-disc list-inside text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      {selectedPassage.flaggedReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => handleCopyText(selectedPassage.text, selectedPassage.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    {copiedId === selectedPassage.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSendToWritingStudio(selectedPassage.text)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Send to Writing Studio</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                Click any passage on the left to inspect detailed stylometric observations.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
