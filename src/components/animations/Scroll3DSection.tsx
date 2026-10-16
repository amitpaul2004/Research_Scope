import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { useScrollContainer } from './ScrollContainerContext';

interface Scroll3DSectionProps {
  children: React.ReactNode;
  className?: string;
  depth?: 'shallow' | 'medium' | 'deep';
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}

export const Scroll3DSection: React.FC<Scroll3DSectionProps> = ({
  children,
  className = '',
  depth = 'medium',
  direction = 'up',
  delay = 0,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollRef } = useScrollContainer();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: scrollRef.current ? scrollRef : undefined,
    offset: ['start end', 'end start'],
  });

  // Calculate 3D rotations based on scroll progress
  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    depth === 'deep' ? [12, 0, 0, -8] : depth === 'medium' ? [7, 0, 0, -4] : [3, 0, 0, -2]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.25, 0.8, 1],
    depth === 'deep' ? [0.94, 1, 1, 0.96] : [0.97, 1, 1, 0.98]
  );

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.4]);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={sectionRef}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        rotateX,
        scale,
        opacity,
      }}
      initial={{ opacity: 0, y: direction === 'up' ? 30 : -30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
};
