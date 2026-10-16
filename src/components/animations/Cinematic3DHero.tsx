import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import {
  Sparkles,
  FileText,
  Lightbulb,
  Workflow,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Database,
  Search,
} from 'lucide-react';
import { useScrollContainer } from './ScrollContainerContext';

interface Cinematic3DHeroProps {
  onNavigate: (view: string) => void;
  totalGaps: number;
  totalPapers: number;
}

export const Cinematic3DHero: React.FC<Cinematic3DHeroProps> = ({
  onNavigate,
  totalGaps,
  totalPapers,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollRef } = useScrollContainer();

  // Mouse tilt tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 300 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D camera angles based on mouse
  const heroRotateX = useTransform(smoothMouseY, [-0.5, 0.5], [6, -6]);
  const heroRotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-8, 8]);

  // Floating card shifts
  const card1X = useTransform(smoothMouseX, [-0.5, 0.5], [-20, 20]);
  const card1Y = useTransform(smoothMouseY, [-0.5, 0.5], [-16, 16]);

  const card2X = useTransform(smoothMouseX, [-0.5, 0.5], [24, -24]);
  const card2Y = useTransform(smoothMouseY, [-0.5, 0.5], [18, -18]);

  const card3X = useTransform(smoothMouseX, [-0.5, 0.5], [-14, 14]);
  const card3Y = useTransform(smoothMouseY, [-0.5, 0.5], [20, -20]);

  // Scroll linked 3D camera-dive
  const { scrollYProgress } = useScroll({
    target: containerRef,
    container: scrollRef.current ? scrollRef : undefined,
    offset: ['start start', 'end start'],
  });

  const scrollCameraZ = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const scrollRotateX = useTransform(scrollYProgress, [0, 1], [0, 12]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.85, 0.4]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1400px',
        transformStyle: 'preserve-3d',
        opacity: shouldReduceMotion ? 1 : scrollOpacity,
      }}
      className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl backdrop-blur-md"
    >
      {/* 3D Background Grid & Depth Gradients */}
      <motion.div
        style={{
          y: shouldReduceMotion ? 0 : backgroundY,
        }}
        className="pointer-events-none absolute -inset-24 opacity-25"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            transform: 'perspective(600px) rotateX(60deg) scale(2)',
            transformOrigin: 'top center',
          }}
        />
      </motion.div>

      {/* Floating 3D Glowing Ambient Orbs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />

      {/* Inner 3D Container with Perspective */}
      <motion.div
        style={{
          transformStyle: 'preserve-3d',
          rotateX: shouldReduceMotion ? 0 : heroRotateX,
          rotateY: shouldReduceMotion ? 0 : heroRotateY,
          z: shouldReduceMotion ? 0 : scrollCameraZ,
        }}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
      >
        {/* Left Column: Heading & Staggered Actions */}
        <div className="lg:col-span-7 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -16, z: -20 }}
            animate={{ opacity: 1, y: 0, z: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold shadow-inner"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>AI-Powered Research Intelligence &amp; Autonomous Synthesis</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]"
          >
            Scholarly Intelligence{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
              in 3D Dimension
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal"
          >
            Explore frontier literature with or without a PDF, interrogate methodology matrices, unearth verifiable research gaps, evaluate stylometric AI-authorship heuristics, and orchestrate n8n automated research pipelines.
          </motion.p>

          {/* Interactive 3D Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24, z: -30 }}
            animate={{ opacity: 1, y: 0, z: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3 pt-3"
          >
            <motion.button
              whileHover={{ scale: 1.04, z: 20 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('context')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer border border-indigo-400/30"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Explore Topic (No PDF Needed)</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-80" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, z: 15 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('papers')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs transition-all cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Upload Research PDF</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, z: 10 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('gaps')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/50 text-purple-200 text-xs transition-all cursor-pointer shadow-sm"
            >
              <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
              <span>Research Gaps ({totalGaps})</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Right Column: Floating 3D Depth Card Cluster */}
        <div className="lg:col-span-5 relative h-72 sm:h-80 w-full flex items-center justify-center">
          {/* Card 1: Live Model & Paper Synthesis (Front-layer, High Z) */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : card1X,
              y: shouldReduceMotion ? 0 : card1Y,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(65px)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            whileHover={{ scale: 1.05, z: 85 }}
            onClick={() => onNavigate('papers')}
            className="absolute top-2 right-4 sm:right-8 w-60 sm:w-64 p-3.5 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl cursor-pointer hover:border-indigo-400 transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Paper Studio</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Index ({totalPapers})
              </span>
            </div>
            <p className="text-xs font-semibold text-white line-clamp-1">
              Cross-Modal Latent Transfer
            </p>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
              Synthesized with Gemini 3.8 &amp; chunked vector embeddings.
            </p>
          </motion.div>

          {/* Card 2: AI Stylometric Detector Gauge (Mid-layer, Moderate Z) */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : card2X,
              y: shouldReduceMotion ? 0 : card2Y,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(35px)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            whileHover={{ scale: 1.05, z: 55 }}
            onClick={() => onNavigate('detector')}
            className="absolute bottom-4 left-2 sm:left-4 w-56 sm:w-60 p-3.5 rounded-2xl bg-slate-900/95 border border-purple-500/40 shadow-2xl backdrop-blur-xl cursor-pointer hover:border-purple-400 transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Stylometry Engine</span>
              </span>
              <span className="text-[10px] font-bold text-slate-300">Entropy Score</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 w-[78%]" />
              </div>
              <span className="text-xs font-bold text-emerald-300">78% Human</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5">Lexical dispersion &amp; cadence verified</p>
          </motion.div>

          {/* Card 3: Automation Node Stream (Deep-layer, Subtle Z) */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : card3X,
              y: shouldReduceMotion ? 0 : card3Y,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(15px)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            whileHover={{ scale: 1.05, z: 35 }}
            onClick={() => onNavigate('automation')}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-52 p-3 rounded-xl bg-slate-950/90 border border-slate-700/60 shadow-xl backdrop-blur-md cursor-pointer hover:border-rose-400/60 transition-colors"
          >
            <div className="flex items-center gap-2 text-rose-300 text-[10px] font-semibold mb-1">
              <Workflow className="w-3 h-3 text-rose-400" />
              <span>n8n Active Pipeline</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-400">
              <span>Auto-Literature Digest</span>
              <span className="text-emerald-400 font-bold">200 OK</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
