import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api';
import { ResearchGap } from '../types';
import { Tilt3DCard } from './animations/Tilt3DCard';
import { Scroll3DSection } from './animations/Scroll3DSection';

export const ResearchGapFinder: React.FC = () => {
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGapId, setExpandedGapId] = useState<string | null>(null);

  useEffect(() => {
    loadGaps();
  }, [selectedCategory, onlyBookmarked]);

  const loadGaps = async () => {
    setLoading(true);
    try {
      const res = await api.getGaps(
        selectedCategory === 'all' ? undefined : selectedCategory,
        onlyBookmarked
      );
      setGaps(res.gaps);
    } catch (err) {
      console.error('Failed to load gaps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverNewGaps = async () => {
    setDiscovering(true);
    try {
      const res = await api.discoverGaps();
      setGaps([...res.gaps, ...gaps]);
    } catch (err) {
      console.error('Failed to discover gaps:', err);
    } finally {
      setDiscovering(false);
    }
  };

  const toggleBookmark = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleBookmarkGap(id, !current);
      setGaps(gaps.map(g => (g.id === id ? res.gap : g)));
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  const categories = [
    'all',
    'Methodological',
    'Dataset & Benchmark',
    'Theoretical',
    'Evaluation & Generalization',
    'Real-World Constraints',
  ];

  const filteredGaps = gaps.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.whyItMatters.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Title & Discovery Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
            <Lightbulb className="w-4 h-4" />
            <span>AI Research Gap Discovery Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Candidate Literature Gaps &amp; Opportunities
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Identifies underexplored questions, hardware constraints, benchmark deficits, and conflicting findings grounded in paper citations.
          </p>
        </div>

        <button
          onClick={handleDiscoverNewGaps}
          disabled={discovering}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer self-start sm:self-auto"
        >
          {discovering ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Scanning Literature Gaps...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Discover New Gaps</span>
            </>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-600/25 border border-purple-500/40 text-purple-200'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800/80'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              onlyBookmarked
                ? 'bg-amber-600/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>Bookmarked</span>
          </button>

          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search gaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Gap Cards with 3D Depth */}
      <Scroll3DSection depth="medium">
        <div className="space-y-4">
        {filteredGaps.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
            No research gaps match criteria. Click "Discover New Gaps" above to generate new candidates!
          </div>
        ) : (
          filteredGaps.map((gap) => {
            const isExpanded = expandedGapId === gap.id;

            return (
              <div
                key={gap.id}
                onClick={() => setExpandedGapId(isExpanded ? null : gap.id)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md transition-all cursor-pointer space-y-3"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className="font-semibold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        {gap.category}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          gap.evidenceStrength === 'Strong Literature Evidence'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : gap.evidenceStrength === 'Emerging Pattern'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {gap.evidenceStrength}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white hover:text-purple-200 transition-colors">
                      {gap.title}
                    </h3>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => toggleBookmark(gap.id, gap.isBookmarked, e)}
                    className={`p-2 rounded-xl border transition-colors ${
                      gap.isBookmarked
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={gap.isBookmarked ? 'Remove bookmark' : 'Bookmark gap'}
                  >
                    {gap.isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {gap.description}
                </p>

                {/* Why It Matters */}
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-purple-200 flex items-start gap-2">
                  <Flame className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Significance: </span>
                    {gap.whyItMatters}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-4 text-xs">
                    {/* Supporting Papers & Page References */}
                    {gap.supportingPapers && gap.supportingPapers.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Supporting Evidence &amp; Citations
                        </h4>
                        <div className="space-y-1.5">
                          {gap.supportingPapers.map((sp, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                              <div className="font-medium text-indigo-300">{sp.paperTitle}</div>
                              {sp.pageReferences && (
                                <div className="text-slate-400 text-[10px]">Reference: {sp.pageReferences}</div>
                              )}
                              {sp.quoteOrFinding && (
                                <div className="text-slate-300 italic mt-1">"{sp.quoteOrFinding}"</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Potential Questions */}
                    {gap.potentialResearchQuestions && gap.potentialResearchQuestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                          Testable Research Questions
                        </h4>
                        <ul className="space-y-1 list-disc list-inside text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                          {gap.potentialResearchQuestions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggested Experiments & Expected Challenges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gap.suggestedExperiments && gap.suggestedExperiments.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <h5 className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" /> Suggested Experiments
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                            {gap.suggestedExperiments.map((exp, i) => (
                              <li key={i}>{exp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {gap.expectedChallenges && gap.expectedChallenges.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <h5 className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Key Bottlenecks &amp; Risks
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                            {gap.expectedChallenges.map((ch, i) => (
                              <li key={i}>{ch}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Toggle */}
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Created {new Date(gap.createdAt).toLocaleDateString()}</span>
                  <span className="text-indigo-400 font-medium flex items-center gap-1">
                    {isExpanded ? (
                      <>
                        Collapse Details <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Expand Full Protocol &amp; Evidence <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
        </div>
      </Scroll3DSection>
    </div>
  );
};
