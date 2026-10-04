'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface HoldToDeleteButtonProps {
  onDelete: () => void;
  label?: string;
  confirmingLabel?: string;
  holdDurationMs?: number;
  className?: string;
}

export function HoldToDeleteButton({
  onDelete,
  label = 'Hold to delete',
  confirmingLabel = 'Keep holding...',
  holdDurationMs = 1400,
  className,
}: HoldToDeleteButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  const circumference = 2 * Math.PI * 14; // r = 14 => ~87.96

  const startHold = () => {
    if (completed) return;
    setIsHolding(true);
    controls.start({
      strokeDashoffset: 0,
      transition: { duration: holdDurationMs / 1000, ease: 'linear' },
    });

    timerRef.current = setTimeout(() => {
      setCompleted(true);
      setIsHolding(false);
      onDelete();
      setTimeout(() => setCompleted(false), 2000);
    }, holdDurationMs);
  };

  const cancelHold = () => {
    if (completed) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    controls.start({
      strokeDashoffset: circumference,
      transition: { duration: 0.15, ease: 'easeOut' },
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          cancelHold();
        }
      }}
      className={cn(
        'relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger,#F31260)] cursor-pointer',
        isHolding
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          : completed
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          : 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-750',
        className
      )}
    >
      <div className="relative size-4 flex items-center justify-center shrink-0">
        <Trash2 className="size-3.5 z-10" />
        <svg
          className="absolute -inset-1 size-6 -rotate-90 pointer-events-none"
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            className="stroke-zinc-300/40 dark:stroke-zinc-700/40"
            strokeWidth="3"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            className="stroke-rose-500"
            strokeWidth="3"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={controls}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <span>{completed ? 'Deleted' : isHolding ? confirmingLabel : label}</span>
    </button>
  );
}
