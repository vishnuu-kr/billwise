'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  className?: string;
}

export function NumberStepper({
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  label,
  className,
}: NumberStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 select-none', className)}>
      {label && <span className="text-xs text-zinc-500 mr-1">{label}</span>}
      <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200/80 dark:border-zinc-700/60 shadow-inner">
        {/* Minus button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={handleDecrement}
          disabled={value <= min}
          className="size-7 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs cursor-pointer"
          aria-label="Decrement"
        >
          <Minus className="size-3.5" />
        </motion.button>

        {/* Value with sliding animation */}
        <div className="relative h-7 w-9 overflow-hidden flex items-center justify-center font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="inline-block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Plus button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={handleIncrement}
          disabled={value >= max}
          className="size-7 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs cursor-pointer"
          aria-label="Increment"
        >
          <Plus className="size-3.5" />
        </motion.button>
      </div>
    </div>
  );
}
