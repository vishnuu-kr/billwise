'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { Gauge, RotateCcw, Copy } from 'lucide-react';

export interface MeterTumblerInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  placeholder?: string;
  baselineReading?: number | null;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function MeterTumblerInput({
  value,
  onChange,
  length = 5,
  placeholder = '10450',
  baselineReading,
  disabled = false,
  autoFocus = true,
  className,
  ariaLabel = 'Electricity meter 5-digit reading',
}: MeterTumblerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [bouncingSlot, setBouncingSlot] = useState<number | null>(null);

  // Clean value string: only digits, max length
  const cleanValue = value.replace(/\D/g, '').slice(0, length);
  const digits = Array.from({ length }, (_, i) => cleanValue[i] || '');
  const placeholderDigits = Array.from({ length }, (_, i) => placeholder[i] || '0');

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // Autofocus input on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const handleInputChange = (raw: string) => {
    const nextClean = raw.replace(/\D/g, '').slice(0, length);
    onChange(nextClean);
    triggerHaptic();

    // Trigger bounce on the newly filled/changed slot
    const lastFilled = Math.max(0, nextClean.length - 1);
    setBouncingSlot(lastFilled);
    setTimeout(() => setBouncingSlot(null), 180);
  };

  const handleContainerClick = () => {
    if (disabled) return;
    inputRef.current?.focus();
  };

  const handleFillBaseline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof baselineReading === 'number' && baselineReading > 0) {
      triggerHaptic();
      const str = String(baselineReading).padStart(length, '0').slice(-length);
      onChange(str);
      if (inputRef.current) {
        inputRef.current.focus();
        setTimeout(() => {
          try {
            inputRef.current?.setSelectionRange(length, length);
          } catch {}
        }, 20);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    onChange('');
    inputRef.current?.focus();
  };

  // Determine which slot is actively awaiting input
  const activeSlotIndex = isFocused ? Math.min(cleanValue.length, length - 1) : null;

  return (
    <div className={cn('space-y-2 select-none', className)}>
      {/* Physical Mechanical Tumbler Bezel */}
      <div
        onClick={handleContainerClick}
        className="relative rounded-2xl bg-[#0F1117] p-3 border border-black/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_3px_rgba(255,255,255,0.06)] cursor-text"
        role="group"
        aria-label={ariaLabel}
      >
        {/* Faceplate Top Bar */}
        <div className="flex items-center justify-between px-1 pb-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Gauge className="w-3.5 h-3.5 text-[#006FEE]" />
            <span>KSEB LT-1A METER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono text-[9px]">TOTAL</span>
            <span className="text-amber-400 font-mono font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 text-[10px]">
              kWh
            </span>
          </div>
        </div>

        {/* Tumbler Drum Viewport / Slot Grid */}
        <div className="relative">
          {/* Master Native Input: invisible overlay catching all native keyboard, mobile keypad, paste, and backspace events */}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={length}
            autoComplete="off"
            disabled={disabled}
            value={cleanValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-text caret-transparent"
            aria-label={ariaLabel}
          />

          {/* 5 Segmented Drum Boxes */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10 pointer-events-none">
            {digits.map((digit, idx) => {
              const isActiveCaret = activeSlotIndex === idx;
              const isBouncing = bouncingSlot === idx;
              const ghostDigit = placeholderDigits[idx];
              const isFilled = digit !== '';

              return (
                <motion.div
                  key={`drum-${idx}`}
                  animate={
                    isBouncing
                      ? { scale: [1, 1.08, 0.96, 1], y: [0, -3, 1, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'relative h-15 sm:h-17 rounded-xl bg-gradient-to-b from-[#1C1F28] via-[#14161E] to-[#0D0F14] border transition-all duration-150 overflow-hidden flex flex-col items-center justify-center',
                    isActiveCaret
                      ? 'border-[#006FEE] ring-2 ring-[#006FEE]/40 shadow-[0_0_14px_rgba(0,111,238,0.4)]'
                      : isFilled
                      ? 'border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),inset_0_-2px_4px_rgba(0,0,0,0.5)]'
                      : 'border-white/10 opacity-80'
                  )}
                >
                  {/* Top & Bottom Cylinder Gradient Shadows (giving 3D curved tumbler depth) */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                  {/* Horizontal Center Groove Line */}
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/[0.05] z-10" />

                  {/* Digit Display */}
                  {isFilled ? (
                    <span className="font-mono font-black text-2xl sm:text-3xl text-white z-20 select-none">
                      {digit}
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-2xl sm:text-3xl text-white/20 z-10 select-none">
                      {ghostDigit}
                    </span>
                  )}

                  {/* Active Caret Pulse Line when slot is empty and focused */}
                  {isActiveCaret && !isFilled && (
                    <span className="absolute bottom-2.5 w-4 h-0.5 bg-[#006FEE] rounded-full animate-pulse z-20" />
                  )}

                  {/* Slot Number Indicator (1-5) */}
                  <span className="pointer-events-none absolute top-1 right-1.5 text-[8px] font-mono text-zinc-500 z-10 select-none">
                    {idx + 1}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer info: Fast guidance and actions */}
        <div className="flex items-center justify-between pt-2.5 px-1 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 font-medium">
            <span className="text-zinc-300">5 black digits</span>
            <span className="text-zinc-500">(whole kWh)</span>
          </span>

          <div className="flex items-center gap-2">
            {typeof baselineReading === 'number' && baselineReading > 0 && (
              <button
                type="button"
                onClick={handleFillBaseline}
                className="text-[11px] font-semibold text-[#006FEE] hover:text-[#338EF7] inline-flex items-center gap-1 active:scale-95 transition-transform cursor-pointer relative z-40"
                title="Prefill previous reading digits"
              >
                <Copy className="w-3 h-3" />
                <span>Last: {baselineReading.toLocaleString('en-IN')}</span>
              </button>
            )}

            {cleanValue.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-0.5 active:scale-95 transition-transform cursor-pointer relative z-40"
                title="Clear digits"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
