'use client';

import React, { useRef, useState } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CompareSliderProps {
  beforeLabel?: string;
  afterLabel?: string;
  beforeContent: React.ReactNode;
  afterContent: React.ReactNode;
  className?: string;
  initialSplit?: number; // 0 to 100
}

export function CompareSlider({
  beforeLabel = 'Previous / Standard',
  afterLabel = 'Projected / Optimized',
  beforeContent,
  afterContent,
  className,
  initialSplit = 50,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSplit(e.clientX);

    const handlePointerMove = (ev: PointerEvent) => {
      updateSplit(ev.clientX);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const updateSplit = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
    setSplit(pct);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 select-none shadow-sm touch-none',
        className
      )}
    >
      {/* Right / After Content (Base layer) */}
      <div className="absolute inset-0 p-3.5 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center justify-end">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {afterLabel}
          </span>
        </div>
        <div className="w-full flex-1 flex flex-col justify-center">{afterContent}</div>
      </div>

      {/* Left / Before Content (Clipped overlay) */}
      <div
        className="absolute inset-0 p-3.5 overflow-hidden bg-white dark:bg-zinc-850 border-r border-zinc-300 dark:border-zinc-700 flex flex-col justify-between"
        style={{ width: `${split}%` }}
      >
        <div className="flex items-center justify-start">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600">
            {beforeLabel}
          </span>
        </div>
        <div className="w-full min-w-[280px] flex-1 flex flex-col justify-center">{beforeContent}</div>
      </div>

      {/* Draggable Divider Line & Knob */}
      <div
        className="absolute inset-y-0 -translate-x-1/2 flex items-center justify-center pointer-events-none"
        style={{ left: `${split}%` }}
      >
        <div className="h-full w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
        <div
          className={cn(
            'absolute size-7 rounded-full bg-white dark:bg-zinc-100 shadow-md border border-zinc-300 flex items-center justify-center text-zinc-700 transition-transform duration-100',
            isDragging && 'scale-110 shadow-lg'
          )}
        >
          <ChevronsLeftRight className="size-3.5" />
        </div>
      </div>
    </div>
  );
}
