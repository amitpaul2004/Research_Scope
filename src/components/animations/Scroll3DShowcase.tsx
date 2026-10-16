import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import {
  Sparkles,
  FileText,
  ShieldAlert,
  GitCompare,
  Lightbulb,
  PenTool,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useScrollContainer } from './ScrollContainerContext';
import { Tilt3DCard } from './Tilt3DCard';

interface Scroll3DShowcaseProps {
  onNavigate: (view: string) => void;
}

export const Scroll3DShowcase: React.FC<Scroll3DShowcaseProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollRef } = useScrollContainer();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    container: scrollRef.current ? scrollRef : undefined,
    offset: ['start end', 'end start'],
  });

  // Calculate 3D track rotation and translation based on scroll
  const trackRotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -8]);
  const trackZ = useTransform(scrollYProgress, [0, 0.5, 1], [-60, 0, -50]);
  const headingY = useTransform(scrollYProgress, [0, 0.4], [40, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  const features = [
    {
      id: 'context',
      title: 'Context Explorer',
      subtitle: 'Zero-PDF Intelligence',
      desc: 'Query any research frontier or hypothesis without a PDF. Instantly synthesize overview, key findings, and methodologies.',
      icon: Sparkles,
      color: 'from-indigo-500 to-blue-600',
      badge: 'Zero-PDF',
      accent: 'border-indigo-500/30',
    },
    {
      id: 'papers',
      title: 'Paper Studio',
      subtitle: 'Deep PDF Analysis',
      desc: 'Extract, chunk, and index academic manuscripts. Review peer-review summaries and empirical methodology tables.',
      icon: FileText,
      color: 'from-blue-500 to-cyan-600',
      badge: 'PDF Engine',
      accent: 'border-blue-500/30',
    },
    {
      id: 'detector',
      title: 'Stylometry & AI Likelihood',
      subtitle: 'Authorship Heuristics',
      desc: 'Examine sentence variance, transition entropy, and stylometric patterns across paper passages with page-by-page stats.',
      icon: ShieldAlert,
      color: 'from-amber-500 to-orange-600',
      badge: 'Stylometrics',
      accent: 'border-amber-500/30',
    },
    {
      id: 'compare',
      title: 'Matrix Comparison',
      subtitle: 'Cross-Paper Contrast',
      desc: 'Line up multiple research papers side-by-side to contrast methodologies, datasets, sample sizes, and empirical claims.',
      icon: GitCompare,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Comparative',
      accent: 'border-emerald-500/30',
    },
    {
      id: 'gaps',
      title: 'Research Gap Finder',
      subtitle: 'Unexplored Frontiers',
      desc: 'Surface concrete limitations in published literature and discover high-impact research questions with suggested experiments.',
      icon: Lightbulb,
      color: 'from-purple-500 to-fuchsia-600',
      badge: 'Discovery',
      accent: 'border-purple-500/30',
    },
    {
      id: 'writing',
      title: 'Scholarly Writing Studio',
      subtitle: '7 Editorial Modes',
      desc: 'Calibrate academic tone, eradicate ambiguities, and enforce concise clarity with Gemini AI models and custom constraints.',
      icon: PenTool,
      color: 'from-rose-500 to-pink-600',
      badge: 'Editorial AI',
      accent: 'border-rose-500/30',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="py-4 space-y-6"
    >
      {/* Section Header with 3D Depth */}
      <motion.div
        style={{
          y: shouldReduceMotion ? 0 : headingY,
          opacity: shouldReduceMotion ? 1 : headingOpacity,
        }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
            <Compass className="w-4 h-4" />
            <span>Interactive Research Architecture</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Comprehensive Scholarly Intelligence Modules
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Every module is dynamically linked to your active paper repository, vector embeddings, and autonomous n8n workflows.
          </p>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>Click any card to launch module</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </div>
      </motion.div>

      {/* 3D Perspective Card Grid */}
      <motion.div
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
          rotateX: shouldReduceMotion ? 0 : trackRotateX,
          z: shouldReduceMotion ? 0 : trackZ,
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Tilt3DCard
              key={item.id}
              index={idx}
              maxTilt={9}
              scaleOnHover={1.03}
              onClick={() => onNavigate(item.id)}
              className="cursor-pointer"
            >
              <div
                className={`p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 border ${item.accent} hover:border-indigo-400/60 shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between h-full group`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md shadow-indigo-900/20 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                      <span>{item.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-indigo-400" />
                    </h3>
                    <p className="text-[11px] font-medium text-indigo-400/90 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors">
                  <span>Launch Workspace</span>
                  <span className="text-xs text-indigo-400 font-semibold">→</span>
                </div>
              </div>
            </Tilt3DCard>
          );
        })}
      </motion.div>
    </div>
  );
};
