'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface MilestoneTick {
  value: number;
  label: string;
  isDanger?: boolean;
}

export interface ElasticSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  milestones?: MilestoneTick[];
  className?: string;
  label?: string;
  unitLabel?: string;
  trackColor?: string;
}

const DEFAULT_MILESTONES: MilestoneTick[] = [
  { value: 100, label: '100u' },
  { value: 200, label: '200u' },
  { value: 240, label: '240u Subsidy', isDanger: true },
  { value: 500, label: '500u Cliff', isDanger: true },
];

export function ElasticSlider({
  value,
  min = 0,
  max = 700,
  step = 1,
  onChange,
  milestones = DEFAULT_MILESTONES,
  className,
  label,
  unitLabel = 'units',
  trackColor,
}: ElasticSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Percentage from value
  const progressPct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Determine active track color dynamically based on dangerous milestones or progress
  const activeColor = trackColor ?? (() => {
    const dangerMilestone = milestones.find((m) => m.isDanger);
    if (dangerMilestone && value >= dangerMilestone.value) {
      return '#e11d48'; // Danger (e.g. above 500u or above ceiling)
    }
    if (progressPct >= 85) return '#f59e0b'; // Amber warning
    return '#10b981'; // Emerald calm
  })();

  const lastSnapRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback if unsupported
    }
    setIsDragging(true);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateFromPointer(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  const updateFromPointer = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const rawVal = min + ratio * (max - min);
    const stepped = Math.round(rawVal / step) * step;

    // Check magnetic snap to milestones within 4 units
    const snapped = milestones.find((m) => Math.abs(m.value - stepped) <= 4);
    const finalVal = snapped ? snapped.value : Math.min(max, Math.max(min, stepped));

    if (snapped && lastSnapRef.current !== snapped.value) {
      lastSnapRef.current = snapped.value;
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(6);
        } catch {
          // Ignore
        }
      }
    } else if (!snapped) {
      lastSnapRef.current = null;
    }

    if (finalVal !== value) {
      onChange(finalVal);
    }
  };

  return (
    <div className={cn('w-full select-none space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {value} {unitLabel}
          </span>
        </div>
      )}

      {/* Interactive Slider Track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label || 'Electricity usage slider'}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(min, value - step));
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(max, value + step));
          } else if (e.key === 'Home') {
            e.preventDefault();
            onChange(min);
          } else if (e.key === 'End') {
            e.preventDefault();
            onChange(max);
          } else if (e.key === 'PageDown') {
            e.preventDefault();
            onChange(Math.max(min, value - step * 10));
          } else if (e.key === 'PageUp') {
            e.preventDefault();
            onChange(Math.min(max, value + step * 10));
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-10 w-full flex items-center cursor-pointer touch-none rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {/* Background Track with inset depth */}
        <div className="relative h-2.5 w-full rounded-full bg-zinc-200 overflow-hidden shadow-inner">
          {/* Active Spring Fill */}
          <motion.div
            className="h-full rounded-full"
            style={{ width: `${progressPct}%` }}
            animate={{
              backgroundColor: activeColor,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Milestone Tick Markers */}
        {milestones.map((m) => {
          const tickPct = ((m.value - min) / (max - min)) * 100;
          const isPassed = value >= m.value;
          return (
            <div
              key={m.value}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${tickPct}%` }}
            >
              <div
                className={cn(
                  'w-1 h-3 rounded-full transition-colors',
                  m.isDanger
                    ? isPassed
                      ? 'bg-rose-500'
                      : 'bg-rose-400/40'
                    : isPassed
                    ? 'bg-zinc-800'
                    : 'bg-zinc-400/50'
                )}
              />
            </div>
          );
        })}

        {/* Tactile Thumb Knob with Elastic Scale */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-7 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.08)] flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${progressPct}%` }}
          animate={{
            scale: isDragging ? 1.25 : 1,
            boxShadow: isDragging
              ? '0 4px 16px rgba(0,0,0,0.25), 0 0 0 4px rgba(16,185,129,0.2)'
              : '0 2px 10px rgba(0,0,0,0.18)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="size-2 rounded-full bg-zinc-700" />
        </motion.div>
      </div>

      {/* Milestone Labels Footer */}
      <div className="relative h-4 w-full">
        {milestones.map((m) => {
          const tickPct = ((m.value - min) / (max - min)) * 100;
          return (
            <span
              key={`label-${m.value}`}
              className={cn(
                'absolute -translate-x-1/2 text-[10px] font-mono whitespace-nowrap cursor-pointer hover:underline',
                m.isDanger ? 'text-rose-500 font-semibold' : 'text-zinc-400'
              )}
              style={{ left: `${tickPct}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(m.value);
              }}
            >
              {m.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
