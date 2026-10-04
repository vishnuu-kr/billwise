'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/cn';
import { ChevronsLeftRight } from 'lucide-react';

export interface ScrubInputProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  onChange: (val: number) => void;
  className?: string;
}

export function ScrubInput({
  value,
  min = 1,
  max = 5000,
  step = 5,
  unit = 'W',
  label,
  onChange,
  className,
}: ScrubInputProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const startXRef = useRef(0);
  const startValRef = useRef(value);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    setIsScrubbing(true);
    startXRef.current = e.clientX;
    startValRef.current = value;

    const handlePointerMove = (ev: PointerEvent) => {
      const deltaX = ev.clientX - startXRef.current;
      // 2 pixels per step
      const stepDelta = Math.round(deltaX / 2) * step;
      const newVal = Math.min(max, Math.max(min, startValRef.current + stepDelta));
      onChange(newVal);
    };

    const handlePointerUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        onChange(Math.min(max, Math.max(min, parsed)));
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className={cn('inline-flex flex-col gap-1 select-none', className)}>
      {label && <span className="text-[11px] font-medium text-zinc-500">{label}</span>}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'group relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition-all touch-none',
          isScrubbing
            ? 'border-emerald-500 bg-emerald-500/10 cursor-ew-resize shadow-xs'
            : 'border-zinc-200 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-650 cursor-ew-resize'
        )}
      >
        <ChevronsLeftRight className="size-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
        {isEditing ? (
          <input
            type="number"
            value={inputValue}
            autoFocus
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => {
              const parsed = parseFloat(inputValue);
              if (!isNaN(parsed)) {
                onChange(Math.min(max, Math.max(min, parsed)));
              }
              setIsEditing(false);
            }}
            onKeyDown={handleKeyDown}
            className="w-16 bg-transparent outline-none font-mono font-bold text-zinc-900 dark:text-zinc-100"
          />
        ) : (
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {value}
          </span>
        )}
        <span className="text-zinc-400 font-sans text-[11px]">{unit}</span>
      </div>
    </div>
  );
}
