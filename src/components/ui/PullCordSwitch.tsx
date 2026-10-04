'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type PanInfo } from 'motion/react';
import { cn } from '@/lib/cn';

export interface PullCordSwitchProps {
  isOn: boolean;
  onToggle: (state: boolean) => void;
  label?: string;
  className?: string;
  cordLength?: number;
}

export function PullCordSwitch({
  isOn,
  onToggle,
  label = 'Simulation Mode',
  className,
  cordLength = 100,
}: PullCordSwitchProps) {
  const [isPulling, setIsPulling] = useState(false);
  const dragY = useMotionValue(0);
  const springY = useSpring(dragY, { stiffness: 400, damping: 15 });

  const currentLength = useTransform(springY, (v) => cordLength + Math.max(0, v));

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsPulling(false);
    if (info.offset.y > 45) {
      onToggle(!isOn);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
    dragY.set(0);
  };

  return (
    <div className={cn('relative flex flex-col items-center select-none', className)}>
      {/* Ceiling Mount / Socket */}
      <div className="w-8 h-3 rounded-b-md bg-zinc-800 dark:bg-zinc-700 shadow-sm border-b border-white/10" />

      {/* Cord Line */}
      <svg
        className="overflow-visible pointer-events-none"
        style={{ width: '2px', height: `${cordLength}px` }}
      >
        <motion.line
          x1="1"
          y1="0"
          x2="1"
          y2={currentLength}
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 2"
          className="text-zinc-400 dark:text-zinc-500"
        />
      </svg>

      {/* Pull Handle (Draggable Bead) */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 60 }}
        dragElastic={0.4}
        style={{ y: springY }}
        onDragStart={() => setIsPulling(true)}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'w-7 h-10 rounded-full cursor-grab active:cursor-grabbing flex flex-col items-center justify-center shadow-lg transition-colors border',
          isPulling && 'scale-105 shadow-xl',
          isOn
            ? 'bg-amber-400 border-amber-300 text-amber-950 shadow-amber-500/30'
            : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-black/10'
        )}
      >
        <div className="w-1.5 h-4 rounded-full bg-current opacity-40 mb-0.5" />
        <div className="w-2.5 h-1 rounded-full bg-current opacity-60" />
      </motion.div>

      {/* Label & Active State Pill */}
      {label && (
        <div className="mt-3 text-center">
          <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 block">{label}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5',
              isOn
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'
            )}
          >
            <span className={cn('size-1.5 rounded-full', isOn ? 'bg-amber-500 animate-pulse' : 'bg-zinc-400')} />
            {isOn ? 'Active' : 'Off'}
          </span>
        </div>
      )}
    </div>
  );
}
