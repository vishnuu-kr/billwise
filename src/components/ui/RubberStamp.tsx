'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface RubberStampProps {
  text?: string;
  subtext?: string;
  color?: 'emerald' | 'rose' | 'amber' | 'blue';
  className?: string;
}

export function RubberStamp({
  text = 'KSERC TARIFF',
  subtext = 'VERIFIED',
  color = 'emerald',
  className,
}: RubberStampProps) {
  const [rotation, setRotation] = useState(-8);

  useEffect(() => {
    // Generate slight random tilt for authentic physical stamped look
    setRotation(-10 + Math.random() * 8);
  }, []);

  const colorStyles = {
    emerald: 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-500 bg-emerald-500/5',
    rose: 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-500 bg-rose-500/5',
    amber: 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500 bg-amber-500/5',
    blue: 'border-[#006FEE] text-[#006FEE] bg-[#006FEE]/5',
  }[color];

  return (
    <motion.div
      initial={{ scale: 2.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.88, rotate: rotation }}
      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
      className={cn(
        'inline-flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-2.5 py-1 font-mono tracking-widest uppercase select-none shadow-sm',
        colorStyles,
        className
      )}
      style={{
        maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 85%, rgba(0,0,0,0.7) 100%)',
      }}
    >
      <span className="text-[9px] font-bold opacity-80 leading-tight">{text}</span>
      <span className="text-xs font-black tracking-widest leading-none mt-0.5">{subtext}</span>
    </motion.div>
  );
}
