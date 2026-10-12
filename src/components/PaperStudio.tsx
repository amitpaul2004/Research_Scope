import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Search,
  Trash2,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Download,
  Filter,
} from 'lucide-react';
import { api } from '../api';
import { ResearchPaper } from '../types';

interface PaperStudioProps {
  papers: ResearchPaper[];
  onRefreshPapers: () => void;
  onOpenAiLikelihood: (paper: ResearchPaper) => void;
  onOpenWritingImprover: (text?: string) => void;
  onExport: (type: 'paper', id: string) => void;
}

export const PaperStudio: React.FC<PaperStudioProps> = ({
  papers,
  onRefreshPapers,
  onOpenAiLikelihood,
  onOpenWritingImprover,
  onExport,
}) => {
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(papers[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'findings' | 'chat' | 'text'>('overview');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat with paper state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'assistant'; text: string; citations?: { pageNumber: number; passageExcerpt: string }[] }[]
  >([]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploading(true);
    setUploadProgressText('Extracting text and computing cryptographic hash...');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF documents are supported.');
        setUploading(false);
        return;
      }
      formData.append('papers', file);
    }

    try {
      setUploadProgressText('Parsing page layouts, running AI analysis and stylometric detection...');
      const res = await api.uploadPapers(formData);
      onRefreshPapers();
      if (res.papers && res.papers.length > 0) {
        setSelectedPaper(res.papers[0]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and analyze paper');
    } finally {
      setUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAskPaper = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatQuestion.trim() || !selectedPaper) return;

    const q = chatQuestion.trim();
    setChatQuestion('');
    setChatLoading(true);

    const newHistory = [...chatHistory, { role: 'user' as const, text: q }];
    setChatHistory(newHistory);

    try {
      const res = await api.askPaper(selectedPaper.id, q);
      setChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          text: res.answer,
          citations: res.citations || [],
        },
      ]);
    } catch (err: any) {
      setChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          text: 'Failed to retrieve answer from paper text.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeletePaper = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this paper?')) return;
    try {
      await api.deletePaper(id);
      onRefreshPapers();
      if (selectedPaper?.id === id) {
        setSelectedPaper(papers.find(p => p.id !== id) || null);
      }
    } catch (err) {
      console.error('Delete paper error:', err);
    }
  };

  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 scale-[1.005]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="pdf-upload-input"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Upload Academic Research Papers (PDF)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Drag &amp; drop single or multiple PDFs here, or{' '}
              <label
                htmlFor="pdf-upload-input"
                className="text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
              >
                browse files
              </label>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports full-text extraction, page boundary mapping, duplicate SHA-256 detection, and OCR fallback.
            </p>
          </div>

          {uploading && (
            <div className="pt-2 space-y-1.5 animate-pulse text-xs text-indigo-300">
              <div className="flex items-center justify-center gap-2 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span>{uploadProgressText}</span>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center justify-center gap-2 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Paper Library List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Research Library ({papers.length})
            </h2>
          </div>

          {/* Search Library */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter library by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Papers Cards */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredPapers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                No papers found matching filter.
              </div>
            ) : (
              filteredPapers.map((paper) => {
                const isSelected = selectedPaper?.id === paper.id;
                return (
                  <div
                    key={paper.id}
                    onClick={() => setSelectedPaper(paper)}
                    className={`group relative p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-100 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 pr-2">
                        <h4 className="font-semibold line-clamp-2 text-white text-xs leading-snug">
                          {paper.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {paper.authors.join(', ')} • {paper.publicationYear || '2025'}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDeletePaper(paper.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                        title="Delete paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {paper.pageCount} Pages
                      </span>
                      {paper.aiLikelihood && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          AI: {paper.aiLikelihood.overallAiScore}%
                        </span>
                      )}
                      <span className="text-slate-500 truncate ml-auto">
                        {paper.fileName}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Paper Analysis & Reader */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPaper ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold uppercase">
                        {selectedPaper.journalOrConference || 'Peer-Reviewed'}
                      </span>
                      <span>{selectedPaper.pageCount} Pages</span>
                      <span>•</span>
                      <span>Hash: {selectedPaper.fileHash.slice(0, 10)}...</span>
                      {selectedPaper.doi && (
                        <span className="text-indigo-400">DOI: {selectedPaper.doi}</span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {selectedPaper.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedPaper.authors.join(', ')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => onOpenAiLikelihood(selectedPaper)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-600/30 transition-colors"
                      title="Inspect AI Likelihood"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>AI Detector</span>
                    </button>
                    <button
                      onClick={() => onExport('paper', selectedPaper.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      title="Export report"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs */}
                <div className="flex items-center gap-1 mt-4 border-t border-slate-800/80 pt-3 text-xs overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Summary & Objectives' },
                    { id: 'methodology', label: 'Methodology & Datasets' },
                    { id: 'findings', label: 'Findings & Limitations' },
                    { id: 'chat', label: 'Chat With Paper (RAG)' },
                    { id: 'text', label: 'Raw Extracted Text' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
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
              <div className="p-5 text-xs text-slate-300 max-h-[580px] overflow-y-auto leading-relaxed space-y-5">
                {/* 1. SUMMARY & OBJECTIVES */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Abstract</h4>
                      <p className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-300">
                        {selectedPaper.analysis?.abstract || 'No abstract available.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Executive Summary</h4>
                      <p className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-300">
                        {selectedPaper.analysis?.executiveSummary || 'No executive summary.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Problem Statement</h4>
                      <p className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-300">
                        {selectedPaper.analysis?.problemStatement || 'Problem statement not detailed.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Primary Research Objectives</h4>
                      <ul className="space-y-1.5 list-disc list-inside bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {(selectedPaper.analysis?.researchObjectives || []).map((obj, i) => (
                          <li key={i} className="text-slate-300">{obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Main Contributions</h4>
                      <ul className="space-y-1.5 list-disc list-inside bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {(selectedPaper.analysis?.mainContributions || []).map((c, i) => (
                          <li key={i} className="text-slate-300">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. METHODOLOGY & DATASETS */}
                {activeTab === 'methodology' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Methodology Formulation</h4>
                      <p className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {selectedPaper.analysis?.methodology || 'Methodology not extracted.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Algorithms &amp; Models Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedPaper.analysis?.algorithmsAndModels || []).map((algo, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-800/60 text-indigo-300 text-xs font-medium">
                            {algo}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Dataset &amp; Benchmark Information</h4>
                      <p className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {selectedPaper.analysis?.datasetInformation || 'Dataset information not specified.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Experimental Setup</h4>
                      <p className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {selectedPaper.analysis?.experimentalSetup || 'Setup information not available.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. FINDINGS & LIMITATIONS */}
                {activeTab === 'findings' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Results &amp; Empirical Findings</h4>
                      <ul className="space-y-1.5 list-disc list-inside bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {(selectedPaper.analysis?.resultsAndFindings || []).map((res, i) => (
                          <li key={i} className="text-slate-300">{res}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 text-rose-300">
                        Acknowledged Limitations (Research Gap Sources)
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside bg-rose-950/20 p-4 rounded-xl border border-rose-900/40 text-slate-300">
                        {(selectedPaper.analysis?.limitations || []).map((lim, i) => (
                          <li key={i} className="text-slate-300">{lim}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 text-indigo-300">
                        Proposed Future Directions
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {(selectedPaper.analysis?.futureWork || []).map((fw, i) => (
                          <li key={i} className="text-slate-300">{fw}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Key Paper Terminology</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(selectedPaper.analysis?.keyTerminology || []).map((term, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="font-semibold text-indigo-300">{term.term}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{term.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CHAT WITH PAPER (RAG WITH PAGE CITATIONS) */}
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-indigo-300 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>
                        Ask any question about this document. Responses are grounded in extracted text with page citations.
                      </span>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-3 min-h-[220px]">
                      {chatHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          Ask questions like "What are the key limitations?", "Explain the mathematical formulation", or "What baseline models were evaluated?"
                        </div>
                      ) : (
                        chatHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                              item.role === 'user'
                                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-100 ml-10'
                                : 'bg-slate-950 border border-slate-800 text-slate-200 mr-10'
                            }`}
                          >
                            <div className="text-[10px] font-semibold text-slate-500 mb-1">
                              {item.role === 'user' ? 'You' : 'Paper Analyst (RAG)'}
                            </div>
                            <div className="whitespace-pre-wrap">{item.text}</div>

                            {/* Citations Box */}
                            {item.citations && item.citations.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                                <span className="text-[10px] font-semibold text-slate-400 block">
                                  Supporting Page Excerpts:
                                </span>
                                {item.citations.map((cite, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                                  >
                                    <span className="font-bold text-indigo-400">
                                      [Page {cite.pageNumber}]:
                                    </span>{' '}
                                    <span className="italic">"{cite.passageExcerpt}"</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleAskPaper} className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        placeholder="Ask a question about this paper..."
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatQuestion.trim()}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        {chatLoading ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* 5. RAW TEXT */}
                {activeTab === 'text' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>Total characters: {selectedPaper.extractedText.length.toLocaleString()}</span>
                      <button
                        onClick={() => onOpenWritingImprover(selectedPaper.extractedText.slice(0, 800))}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                      >
                        Send Excerpt to Writing Studio
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {selectedPaper.extractedText}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
              Select or upload a research paper to view analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
