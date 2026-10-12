import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  ExternalLink,
  BookOpen,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { api } from '../api';
import { NormalizedAcademicPaper, ResearchDiscoverySubscription } from '../types';

export const AcademicDiscovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'arxiv' | 'openalex'>('all');
  const [results, setResults] = useState<NormalizedAcademicPaper[]>([]);
  const [searching, setSearching] = useState(false);
  const [subscriptions, setSubscriptions] = useState<ResearchDiscoverySubscription[]>([]);

  // Subscription modal / form state
  const [showSubModal, setShowSubModal] = useState(false);
  const [subTopic, setSubTopic] = useState('');
  const [subKeywords, setSubKeywords] = useState('');
  const [subFrequency, setSubFrequency] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.searchAcademic(searchQuery, sourceFilter);
      setResults(res.papers);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const res = await api.getSubscriptions();
      setSubscriptions(res.subscriptions);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTopic.trim()) return;

    try {
      const kw = subKeywords.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.createSubscription({
        topic: subTopic.trim(),
        keywords: kw.length > 0 ? kw : [subTopic.trim()],
        frequency: subFrequency,
      });

      setSubscriptions([res.subscription, ...subscriptions]);
      setShowSubModal(false);
      setSubTopic('');
      setSubKeywords('');
    } catch (err) {
      console.error('Create subscription error:', err);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      setSubscriptions(subscriptions.filter(s => s.id !== id));
    } catch (err) {
      console.error('Delete subscription error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Compass className="w-4 h-4" />
            <span>Academic Index &amp; Repository Discovery</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Live Academic Search (arXiv &amp; OpenAlex)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Query millions of peer-reviewed articles, conference proceedings, and preprints with verified DOI resolution.
          </p>
        </div>

        <button
          onClick={() => setShowSubModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-600/30 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>New Discovery Alert</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers by keyword, concept, or domain..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Unified (arXiv + OpenAlex)</option>
            <option value="arxiv">arXiv.org Only</option>
            <option value="openalex">OpenAlex Index Only</option>
          </select>

          <button
            type="submit"
            disabled={searching}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {searching ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </form>

      {/* Subscriptions Panel */}
      {subscriptions.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <BellRing className="w-3.5 h-3.5 text-cyan-400" />
            Automated Discovery Subscriptions (n8n Workflow B Active)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-200 block truncate">{sub.topic}</span>
                  <span className="text-[10px] text-slate-500">
                    Frequency: {sub.frequency} • Sources: {sub.sources.join(', ')}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteSubscription(sub.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  title="Remove alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-300">
          Discovered Literature ({results.length})
        </h3>

        {results.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
            {searching ? 'Querying academic API endpoints...' : 'No papers found. Try different search terms.'}
          </div>
        ) : (
          results.map((paper) => (
            <div
              key={paper.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md transition-all space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                      {paper.source}
                    </span>
                    <span>Year: {paper.year}</span>
                    {paper.doi && <span className="text-indigo-400">DOI: {paper.doi}</span>}
                    {typeof paper.citationCount === 'number' && (
                      <span className="text-slate-400">Citations: {paper.citationCount}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white hover:text-cyan-300 transition-colors leading-snug">
                    {paper.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {paper.authors.join(', ')}
                  </p>
                </div>

                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors shrink-0"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {paper.abstract && (
                <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {paper.abstract}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-cyan-400" />
              Configure Automated Research Discovery Subscription
            </h3>

            <form onSubmit={handleCreateSubscription} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Research Topic / Focus</label>
                <input
                  type="text"
                  required
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  placeholder="e.g. Physics-Informed Neural Networks in Water Treatment"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={subKeywords}
                  onChange={(e) => setSubKeywords(e.target.value)}
                  placeholder="e.g. PINN, advection-diffusion, biofouling"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Polling Schedule</label>
                <select
                  value={subFrequency}
                  onChange={(e) => setSubFrequency(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200"
                >
                  <option value="daily">Daily Poll (Every 24h via n8n)</option>
                  <option value="weekly">Weekly Digest (Monday 8 AM)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
