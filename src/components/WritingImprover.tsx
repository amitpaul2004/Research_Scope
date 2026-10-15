import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Sparkles,
  Check,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../api';
import { WritingRevision } from '../types';

interface WritingImproverProps {
  initialText?: string;
}

export const WritingImprover: React.FC<WritingImproverProps> = ({ initialText = '' }) => {
  const [inputText, setInputText] = useState(initialText);
  const [selectedMode, setSelectedMode] = useState<string>('Formal Academic');
  const [customInstructions, setCustomInstructions] = useState('');
  const [revisedText, setRevisedText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [revisions, setRevisions] = useState<WritingRevision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
    loadRevisions();
  }, [initialText]);

  const loadRevisions = async () => {
    try {
      const res = await api.getRevisions();
      // Filter out any invalid historical revisions where originalText === revisedText
      const validRevisions = (res.revisions || []).filter(
        (r) => r.originalText?.trim() !== r.revisedText?.trim()
      );
      setRevisions(validRevisions);
    } catch (e) {
      console.error('Failed to load revisions:', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setError(null);
    if (revisedText) {
      setIsStale(true);
    }
  };

  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
    setError(null);
    if (revisedText) {
      setIsStale(true);
    }
  };

  const handleEnhance = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length < 10) {
      setError('Please provide at least 10 characters of academic text to enhance.');
      return;
    }

    if (loading) return; // Prevent duplicate requests

    setLoading(true);
    setError(null);
    setAccepted(false);

    try {
      const res = await api.improveWriting({
        text: trimmed,
        mode: selectedMode,
        customInstructions:
          selectedMode === 'Custom Prompt' && customInstructions.trim()
            ? customInstructions.trim()
            : undefined,
      });

      if (!res?.revision?.revisedText) {
        throw new Error('Received an empty response from the enhancement service.');
      }

      setRevisedText(res.revision.revisedText);
      setExplanation(res.revision.explanation);
      setImprovements(res.improvements || []);
      setIsStale(false);
      setRevisions([res.revision, ...revisions]);
    } catch (err: any) {
      console.error('Error enhancing text:', err);
      const errMsg = err?.message || 'Failed to enhance writing. Please try again.';
      setError(errMsg);
      setRevisedText('');
      setExplanation('');
      setImprovements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!revisedText) return;
    navigator.clipboard.writeText(revisedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = () => {
    if (!revisedText) return;
    setInputText(revisedText);
    setIsStale(false);
    setAccepted(true);
    setTimeout(() => setAccepted(false), 2500);
  };

  const modes = [
    { id: 'Formal Academic', label: 'Formal Academic', desc: 'Rigor, precise domain taxonomy, scholarly cadence' },
    { id: 'Natural Academic', label: 'Natural Academic', desc: 'Fluid sentence structures, humanized rhythm' },
    { id: 'Concise Academic', label: 'Concise Academic', desc: 'Removes bloat & passive padding without losing meaning' },
    { id: 'Technical Precision', label: 'Technical Precision', desc: 'Focus on mathematical, algorithmic, & empirical clarity' },
    { id: 'Simplified Explanation', label: 'Simplified Explanation', desc: 'Intuitive breakdown of complex formulas or theorems' },
    { id: 'Clarity & Grammar', label: 'Clarity & Grammar', desc: 'Surgical grammar, diction, and flow enhancements' },
    { id: 'Custom Prompt', label: 'Custom Prompt', desc: 'Guided by your specific editorial constraints' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <PenTool className="w-4 h-4" />
          <span>Scholarly Writing &amp; Editorial Studio</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Scholarly Clarity &amp; Tone Enhancement
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          Refine drafts, improve clarity, calibrate formal voice, and eradicate stylistic ambiguities across 7 academic modes.
        </p>
      </div>

      {/* Modes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id)}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedMode === mode.id
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="font-semibold text-xs text-white truncate">{mode.label}</div>
            <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
              {mode.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Custom instructions if in Custom Prompt mode */}
      {selectedMode === 'Custom Prompt' && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-900/50 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Custom Editorial Instructions</span>
            </label>
            <span className="text-[10px] text-slate-500">Applied directly to Gemini AI model prompt</span>
          </div>
          <textarea
            rows={2}
            value={customInstructions}
            onChange={(e) => {
              setCustomInstructions(e.target.value);
              if (revisedText) setIsStale(true);
            }}
            placeholder="e.g. Rewrite this paragraph in clear academic English, correct all grammatical errors, improve sentence flow, preserve the original meaning, and keep the revised text under 60 words."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-normal resize-none"
          />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-3 shadow-md animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="font-semibold text-rose-300">Enhancement Notice</div>
            <p className="text-[11px] text-rose-200/90 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 p-1 rounded-lg hover:bg-rose-900/40 cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Side-by-Side Comparison Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Draft Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3 flex flex-col">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Original Text</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {inputText.length} characters
            </span>
          </div>

          <textarea
            rows={12}
            value={inputText}
            onChange={handleInputChange}
            placeholder="Paste raw research abstract, methodology draft, or passage here..."
            className="flex-1 w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-normal"
          />

          <button
            onClick={handleEnhance}
            disabled={loading || !inputText.trim() || inputText.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Enhancing Text with Gemini ({selectedMode})...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enhance with {selectedMode}</span>
              </>
            )}
          </button>
        </div>

        {/* Enhanced Revision Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3 flex flex-col">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enhanced Version ({selectedMode})</span>
              </span>
              {isStale && revisedText && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" />
                  Draft/Mode Changed
                </span>
              )}
            </div>
            {revisedText && (
              <span className="text-[11px] text-slate-500">
                {revisedText.length} characters
              </span>
            )}
          </div>

          <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-200 leading-relaxed overflow-y-auto min-h-[280px]">
            {revisedText ? (
              <p className="whitespace-pre-wrap">{revisedText}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-12">
                <PenTool className="w-6 h-6 text-slate-600 mb-2" />
                <p>Click "Enhance with {selectedMode}" to generate the scholarly revision.</p>
              </div>
            )}
          </div>

          {/* Action Row */}
          {revisedText && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{accepted ? 'Accepted to Left' : 'Accept Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editorial Explanation & Improvements Card */}
      {explanation && !error && (
        <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-800/40 text-xs space-y-2">
          <h4 className="font-semibold text-indigo-300 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-400" />
            Editorial Rationale &amp; Improvements
          </h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">{explanation}</p>
          {improvements.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pt-1">
              {improvements.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Revision History */}
      {revisions.length > 0 && (
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Recent Revision History ({revisions.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {revisions.slice(0, 5).map((rev) => (
              <div
                key={rev.id}
                onClick={() => {
                  setInputText(rev.originalText);
                  setRevisedText(rev.revisedText);
                  setExplanation(rev.explanation);
                  setSelectedMode(rev.mode);
                  setIsStale(false);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex-1 pr-3 truncate">
                  <span className="font-medium text-slate-200 truncate block">
                    "{rev.revisedText.slice(0, 75)}..."
                  </span>
                  <span className="text-[10px] text-indigo-400">{rev.mode}</span>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(rev.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
