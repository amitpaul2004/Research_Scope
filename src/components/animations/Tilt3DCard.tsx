import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees, default 10
  perspective?: number; // perspective in px, default 1000
  glareEffect?: boolean;
  scaleOnHover?: number; // scale factor on hover, default 1.02
  depthEffect?: boolean; // add 3D depth styling
  onClick?: () => void;
  index?: number; // for staggered entrance
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  maxTilt = 8,
  perspective = 1000,
  glareEffect = true,
  scaleOnHover = 1.02,
  depthEffect = true,
  onClick,
  index = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Mouse normalized position (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs for smooth physics
  const springConfig = { damping: 25, stiffness: 350 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // 3D rotation transforms
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position
  const glareX = useTransform(smoothX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(smoothY, [-0.5, 0.5], ['0%', '100%']);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  if (shouldReduceMotion) {
    return (
      <div
        className={className}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      initial={{ opacity: 0, y: 28, rotateX: 8, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.08, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
      }}
      whileHover={{
        scale: scaleOnHover,
        transition: { duration: 0.2 },
      }}
      className={`relative overflow-hidden transition-shadow duration-300 ${className}`}
    >
      <div
        className="w-full h-full"
        style={{
          transformStyle: depthEffect ? 'preserve-3d' : undefined,
          transform: depthEffect && isHovered ? 'translateZ(12px)' : 'translateZ(0px)',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>

      {/* Dynamic Specular Glare Effect */}
      {glareEffect && isHovered && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-35 mix-blend-overlay transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 240px at ${glareX.get()} ${glareY.get()}, rgba(255,255,255,0.4), transparent 80%)`,
          }}
        />
      )}
    </motion.div>
  );
};
