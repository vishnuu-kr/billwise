'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SlideToConfirmProps {
  onConfirm: () => void;
  label?: string;
  confirmedLabel?: string;
  className?: string;
}

export function SlideToConfirm({
  onConfirm,
  label = 'Slide to lock budget ceiling',
  confirmedLabel = 'Budget ceiling locked!',
  className,
}: SlideToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const x = useMotionValue(0);

  // Dynamic opacity of label as user slides
  const labelOpacity = useTransform(x, [0, 140], [1, 0.2]);

  const handleDragEnd = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const maxDrag = containerWidth - 52; // thumb width ~44px + margins

    if (x.get() > maxDrag * 0.75) {
      animate(x, maxDrag, { type: 'spring', stiffness: 350, damping: 25 });
      setConfirmed(true);
      onConfirm();
      setTimeout(() => {
        setConfirmed(false);
        animate(x, 0, { type: 'spring', stiffness: 350, damping: 25 });
      }, 2500);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label={confirmed ? confirmedLabel : `${label} (Press Space or Enter to lock)`}
      aria-disabled={confirmed}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !confirmed) {
          e.preventDefault();
          setConfirmed(true);
          onConfirm();
          setTimeout(() => {
            setConfirmed(false);
          }, 2500);
        }
      }}
      className={cn(
        'relative h-13 w-full rounded-full p-1.5 overflow-hidden select-none transition-all duration-300 border flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] cursor-pointer',
        confirmed
          ? 'bg-emerald-50 border-emerald-500/30'
          : 'bg-black/[0.03] border-black/[0.08] shadow-inner',
        className
      )}
    >
      {/* Background Track Label */}
      <motion.div
        style={{ opacity: labelOpacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none pl-6 pr-4"
      >
        <span
          className={cn(
            'text-[11px] font-semibold tracking-wider transition-colors uppercase select-none',
            confirmed
              ? 'text-emerald-700'
              : 'text-[var(--secondary)]'
          )}
        >
          {confirmed ? confirmedLabel : label}
        </span>
      </motion.div>

      {/* Draggable Thumb Knob */}
      {!confirmed ? (
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.04}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="relative z-10 size-10 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] flex items-center justify-center cursor-grab active:cursor-grabbing border border-black/[0.06] active:scale-95 transition-transform"
        >
          <ArrowRight className="size-4 text-[var(--foreground)]" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative z-10 size-10 rounded-full bg-emerald-600 text-white shadow-md flex items-center justify-center ml-auto border border-emerald-700"
        >
          <Check className="size-4 stroke-[2.5]" />
        </motion.div>
      )}
    </div>
  );
}
