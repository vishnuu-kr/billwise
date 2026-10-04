'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SingleWheelProps {
  value: number;
  onChange: (val: number) => void;
  isRedDecimal?: boolean;
}

function SingleWheel({ value, onChange, isRedDecimal }: SingleWheelProps) {
  const increment = () => onChange((value + 1) % 10);
  const decrement = () => onChange((value + 9) % 10);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={decrement}
        aria-label="Decrease digit"
        className="w-full py-1.5 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
      >
        <ChevronUp className="size-3.5" aria-hidden="true" />
      </button>

      {/* Wheel Drum Slot with recessed inner shadow */}
      <div
        className={cn(
          'relative h-11 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] border select-none overflow-hidden',
          isRedDecimal
            ? 'bg-rose-950/70 border-rose-600 text-rose-300'
            : 'bg-zinc-900 border-zinc-750 text-zinc-100'
        )}
      >
        {/* Curved Glass Highlight */}
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

        <motion.span
          key={value}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {value}
        </motion.span>

        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      <button
        type="button"
        onClick={increment}
        aria-label="Increase digit"
        className="w-full py-1.5 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
      >
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export interface WheelPickerProps {
  value: string; // e.g. "04285"
  length?: number;
  hasDecimalDigit?: boolean;
  onChange: (val: string) => void;
  className?: string;
}

export function WheelPicker({
  value,
  length = 5,
  hasDecimalDigit = false,
  onChange,
  className,
}: WheelPickerProps) {
  // Pad value to length
  const padded = value.padStart(length, '0').slice(-length);
  const digits = padded.split('').map((d) => parseInt(d, 10) || 0);

  const handleDigitChange = (index: number, newDigit: number) => {
    const nextDigits = [...digits];
    nextDigits[index] = newDigit;
    onChange(nextDigits.join(''));
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 p-3 rounded-2xl bg-zinc-800/90 border border-zinc-700 shadow-xl',
        className
      )}
    >
      {digits.map((d, idx) => {
        const isDecimal = hasDecimalDigit && idx === length - 1;
        return (
          <React.Fragment key={idx}>
            {isDecimal && (
              <span className="text-rose-400 font-bold font-mono text-lg pb-1">.</span>
            )}
            <SingleWheel
              value={d}
              isRedDecimal={isDecimal}
              onChange={(newVal) => handleDigitChange(idx, newVal)}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
