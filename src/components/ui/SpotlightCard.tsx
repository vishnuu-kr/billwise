'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { cn } from '@/lib/cn';

export interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(0, 111, 238, 0.10)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) =>
      `radial-gradient(400px circle at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white/95 backdrop-blur-xl transition-all shadow-sm hover:shadow-md',
        className
      )}
    >
      {/* Specular Spotlight Glow following cursor */}
      <motion.div
        className={cn(
          'pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300',
          isHovered && 'opacity-100'
        )}
        style={{ background }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
