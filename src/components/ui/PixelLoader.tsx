'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface PixelLoaderProps {
  label?: string;
  className?: string;
  size?: number; // Matrix dimension (default 6x6)
}

export function PixelLoader({
  label = 'Processing Image Matrix...',
  className,
  size = 6,
}: PixelLoaderProps) {
  const totalPixels = size * size;

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center select-none', className)}>
      {/* Pixel Grid Matrix */}
      <div
        className="grid gap-1 mb-4"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: totalPixels }).map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const delay = (row + col) * 0.08;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.15, scale: 0.8 }}
              animate={{
                opacity: [0.15, 1, 0.15],
                scale: [0.8, 1.1, 0.8],
                backgroundColor: ['#10b981', '#34d399', '#059669'],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay,
                ease: 'easeInOut',
              }}
              className="size-2.5 rounded-[2px] bg-emerald-500 shadow-sm"
            />
          );
        })}
      </div>

      {/* Label */}
      <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">
        {label}
      </span>
    </div>
  );
}
