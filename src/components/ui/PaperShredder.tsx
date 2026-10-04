'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PaperShredderProps {
  onShredComplete: () => void;
  title?: string;
  label?: string;
  className?: string;
}

export function PaperShredder({
  onShredComplete,
  title = 'Wipe Session & History',
  label = 'Drag or click to shred data',
  className,
}: PaperShredderProps) {
  const [isShredding, setIsShredding] = useState(false);
  const [shredded, setShredded] = useState(false);

  const startShred = () => {
    if (isShredding) return;
    setIsShredding(true);
    setTimeout(() => {
      setShredded(true);
      setIsShredding(false);
      onShredComplete();
    }, 1800);
  };

  return (
    <div className={cn('relative rounded-3xl bg-zinc-900 border border-zinc-800 p-5 text-white shadow-xl max-w-sm mx-auto text-center', className)}>
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      <p className="text-xs text-zinc-400 mt-0.5">{label}</p>

      {/* Shredder Machine Throat */}
      <div className="relative my-5 mx-auto w-48 h-3 rounded-full bg-zinc-950 border border-zinc-700 shadow-inner flex items-center justify-center">
        <div className="w-40 h-0.5 bg-black" />
      </div>

      {/* Document Being Shredded */}
      <div className="relative h-28 w-44 mx-auto overflow-hidden">
        <AnimatePresence>
          {!shredded && (
            <motion.div
              animate={isShredding ? { y: 120, opacity: [1, 0.8, 0] } : { y: 0 }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
              className="w-40 mx-auto rounded-lg bg-white text-zinc-900 p-2.5 text-left shadow-lg border border-zinc-200 text-[10px] font-mono leading-tight select-none"
            >
              <div className="flex justify-between font-bold border-b border-zinc-300 pb-1 mb-1">
                <span>KSEB LT-1A</span>
                <span>₹1,840</span>
              </div>
              <div className="opacity-60 space-y-0.5">
                <div>Cons: 240 units</div>
                <div>Duty: 10% (₹145)</div>
                <div>Meter: 489210</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shredded Strips Ejecting Below */}
        {isShredding && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0, opacity: 1 }}
                animate={{ height: [0, 45, 60], y: [0, 15, 30], opacity: [1, 1, 0] }}
                transition={{ duration: 1.4, delay: 0.3 + i * 0.05 }}
                className="w-3 bg-zinc-200 shadow-sm border-l border-zinc-300"
              />
            ))}
          </div>
        )}
      </div>

      {/* Trigger Button */}
      <button
        onClick={startShred}
        disabled={isShredding || shredded}
        className={cn(
          'w-full py-2.5 px-4 rounded-2xl font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-95 touch-target shadow-md',
          shredded
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : isShredding
            ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
        )}
      >
        {shredded ? (
          <>
            <RefreshCw className="size-3.5" />
            <span>Session Cleaned</span>
          </>
        ) : isShredding ? (
          <>
            <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Shredding local bill records...</span>
          </>
        ) : (
          <>
            <Trash2 className="size-3.5" />
            <span>Shred All Records</span>
          </>
        )}
      </button>
    </div>
  );
}
