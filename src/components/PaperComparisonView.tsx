import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckSquare,
  Square,
  Sparkles,
  Search,
  Download,
  AlertCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  Table,
} from 'lucide-react';
import { api } from '../api';
import { ResearchPaper, PaperComparison } from '../types';

interface PaperComparisonViewProps {
  papers: ResearchPaper[];
}

export const PaperComparisonView: React.FC<PaperComparisonViewProps> = ({ papers }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    papers.length >= 2 ? [papers[0].id, papers[1].id] : papers.map(p => p.id)
  );
  const [comparisons, setComparisons] = useState<PaperComparison[]>([]);
  const [activeComparison, setActiveComparison] = useState<PaperComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState('');

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      const res = await api.getComparisons();
      setComparisons(res.comparisons);
      if (res.comparisons.length > 0 && !activeComparison) {
        setActiveComparison(res.comparisons[0]);
      }
    } catch (err) {
      console.error('Failed to load comparisons:', err);
    }
  };

  const toggleSelectPaper = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRunComparison = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    try {
      const res = await api.runComparison(selectedIds);
      setActiveComparison(res.comparison);
      setComparisons([res.comparison, ...comparisons]);
    } catch (err) {
      console.error('Error running comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatrix = (activeComparison?.comparisonMatrix || []).filter(row =>
    row.criterion.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
    Object.values(row.papers).some(v => v.toLowerCase().includes(searchTableQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <GitCompare className="w-4 h-4" />
          <span>Cross-Paper Comparative Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Multi-Paper Methodology &amp; Benchmark Matrix
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          Select multiple research papers to synthesize direct objective-by-objective, algorithmic, and dataset comparisons.
        </p>
      </div>

      {/* Paper Selection Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Select Papers from Library to Compare ({selectedIds.length} selected):
          </span>
          <button
            onClick={handleRunComparison}
            disabled={selectedIds.length < 2 || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Generating Comparative Synthesis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Multi-Paper Comparison</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {papers.length === 0 ? (
            <div className="col-span-full p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
              No research papers in your library yet. Upload at least 2 papers in Paper Intelligence to generate a comparative matrix.
            </div>
          ) : (
            papers.map((p) => {
              const isChecked = selectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelectPaper(p.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                    isChecked
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-100 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 text-indigo-400">
                    {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-white block truncate">{p.title}</span>
                    <span className="text-[10px] text-slate-500">{p.authors[0] || 'Author'} ({p.publicationYear || 2025})</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comparison Results */}
      {activeComparison ? (
        <div className="space-y-6">
          {/* Executive Comparative Summary */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Comparative Synthesis
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              {activeComparison.summary}
            </p>
          </div>

          {/* Searchable Comparison Matrix Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-950/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Table className="w-4 h-4 text-indigo-400" />
                <span>Structured Comparison Matrix</span>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter criteria or models..."
                  value={searchTableQuery}
                  onChange={(e) => setSearchTableQuery(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="p-3.5 w-48 shrink-0">Analytical Criterion</th>
                    {activeComparison.paperIds.map((pId) => {
                      const paper = papers.find(p => p.id === pId);
                      return (
                        <th key={pId} className="p-3.5 min-w-[260px]">
                          <span className="text-indigo-300 font-bold block">{paper?.title || pId}</span>
                          <span className="text-[10px] text-slate-500 lowercase">
                            {paper?.authors[0]} ({paper?.publicationYear || 2025})
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-200 bg-slate-950/40 align-top">
                        {row.criterion}
                      </td>
                      {activeComparison.paperIds.map((pId) => (
                        <td key={pId} className="p-3.5 leading-relaxed align-top">
                          {row.papers[pId] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tradeoffs & Combined Research Gaps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Methodology Tradeoffs */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Methodological Tradeoffs
              </h4>
              <div className="space-y-3">
                {activeComparison.methodologyTradeoffs.map((to, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                      <span>{to.approachA}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>{to.approachB}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{to.tradeoffs}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Combined Research Gaps */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Cross-Cutting Research Opportunities
              </h4>
              <ul className="space-y-2 text-xs">
                {activeComparison.combinedResearchGaps.map((gap, i) => (
                  <li key={i} className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-200 text-xs leading-relaxed">
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
          Select at least 2 papers above and click "Run Multi-Paper Comparison" to generate matrix.
        </div>
      )}
    </div>
  );
};
