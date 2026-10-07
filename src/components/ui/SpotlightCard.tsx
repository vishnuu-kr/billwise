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

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.touches[0].clientX - rect.left);
    mouseY.set(e.touches[0].clientY - rect.top);
    if (!isHovered) setIsHovered(true);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 800)}
      className={cn(
        'group relative overflow-hidden rounded-[26px] border border-black/[0.06] bg-white/95 backdrop-blur-xl transition-all shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02]',
        className
      )}
    >
      {/* Specular Spotlight Glow following cursor / finger */}
      <motion.div
        className={cn(
          'pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300',
          isHovered && 'opacity-100'
        )}
        style={{ background }}
      />

      {/* Subtle ambient lighting for mobile touch devices */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 bg-[#006FEE]/[0.05] rounded-full blur-2xl" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
