'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ScribbleCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  sublabel?: string;
  className?: string;
}

export function ScribbleCheckbox({
  checked,
  onChange,
  label,
  sublabel,
  className,
}: ScribbleCheckboxProps) {
  return (
    <label
      className={cn(
        'group relative flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer select-none transition-all',
        checked
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-black/[0.06] bg-white hover:border-black/[0.12] shadow-2xs',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />

      {/* Checkbox box */}
      <div
        className={cn(
          'size-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 mt-0.5',
          checked
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-zinc-300 bg-zinc-50 group-hover:border-zinc-400'
        )}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="size-3.5 stroke-[3]" />
          </motion.div>
        )}
      </div>

      {/* Label with Scribble Strikethrough effect */}
      <div className="relative flex-1">
        <span
          className={cn(
            'text-[13px] font-semibold transition-colors',
            checked ? 'text-zinc-400' : 'text-[#17171C]'
          )}
        >
          {label}
        </span>

        {/* Dynamic Scribble Strike-through SVG */}
        {checked && (
          <motion.svg
            className="absolute top-2.5 left-0 w-full h-3 pointer-events-none"
            viewBox="0 0 100 12"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,6 Q25,2 50,6 T100,5"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </motion.svg>
        )}

        {sublabel && (
          <p
            className={cn(
              'text-[12px] mt-0.5 leading-relaxed',
              checked ? 'text-zinc-400 line-through' : 'text-[#71717A]'
            )}
          >
            {sublabel}
          </p>
        )}
      </div>
    </label>
  );
}
