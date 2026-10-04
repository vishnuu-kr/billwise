'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layoutId?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  layoutId,
}: SegmentedControlProps<T>) {
  const generatedId = React.useId();
  const activeLayoutId = layoutId || `seg-active-${generatedId}`;

  const sizeStyles = {
    sm: 'p-0.5 text-xs h-8',
    md: 'p-1 text-xs sm:text-sm h-10',
    lg: 'p-1.5 text-sm sm:text-base h-12',
  }[size];

  return (
    <div
      role="radiogroup"
      className={cn(
        'relative flex items-center rounded-2xl bg-black/[0.04] p-1 border border-black/[0.04] select-none',
        sizeStyles,
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <motion.button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (value !== option.value) {
                onChange(option.value);
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try {
                    navigator.vibrate(8);
                  } catch {
                    // Ignore if vibrate not supported or permitted
                  }
                }
              }
            }}
            className={cn(
              'relative flex-1 h-full px-3 rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors duration-140 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent,#006FEE)] cursor-pointer select-none touch-manipulation',
              isSelected
                ? 'text-[#17171C] font-semibold'
                : 'text-[#71717A] hover:text-[#17171C]'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={activeLayoutId}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 35,
                  mass: 0.5,
                }}
                className="absolute inset-0 rounded-xl bg-white shadow-xs border border-black/[0.08] z-0"
              />
            )}
            {option.icon && <span className="relative z-10 size-4 flex items-center justify-center">{option.icon}</span>}
            <span className="relative z-10 truncate">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
