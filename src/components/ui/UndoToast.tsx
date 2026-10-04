'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Undo2, X } from 'lucide-react';

export interface UndoToastProps {
  isOpen: boolean;
  message: string;
  onUndo: () => void;
  onClose: () => void;
  durationMs?: number;
}

export function UndoToast({
  isOpen,
  message,
  onUndo,
  onClose,
  durationMs = 5000,
}: UndoToastProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isOpen, durationMs, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
        >
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 p-3.5 shadow-2xl flex items-center justify-between gap-3 border border-zinc-700/50 dark:border-zinc-300">
            {/* Draining bottom bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: durationMs / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-emerald-500"
            />

            <span className="text-xs font-medium truncate">{message}</span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onUndo();
                  onClose();
                }}
                className="flex items-center gap-1 rounded-xl bg-zinc-800 dark:bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-emerald-400 dark:text-emerald-700 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500"
              >
                <Undo2 className="size-3.5" aria-hidden="true" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss notification"
                className="rounded-lg p-2 -mr-1 text-zinc-400 hover:text-zinc-200 dark:hover:text-zinc-700 transition-colors flex items-center justify-center cursor-pointer active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
