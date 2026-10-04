'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface ConfettiButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  colors?: string[];
  disabled?: boolean;
}

export function ConfettiButton({
  children,
  onClick,
  className,
  colors = ['#10b981', '#06b6d4', '#f59e0b', '#6366f1', '#10b981'],
  disabled = false,
}: ConfettiButtonProps) {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Trigger canvas confetti burst from click origin
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors,
        disableForReducedMotion: true,
      });
    } catch {
      // Fallback
    }

    onClick?.();
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 font-semibold text-xs tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        className
      )}
    >
      {children}
    </motion.button>
  );
}
