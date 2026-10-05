'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  placeholder,
  baselineReading,
  disabled = false,
  autoFocus = true,
  className,
  ariaLabel = 'Electricity meter 5-digit reading',
}: MeterTumblerInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
  const [bouncingIndex, setBouncingIndex] = useState<number | null>(null);

  // Normalize string to exactly `length` chars (padded with empty strings)
  const digits = Array.from({ length }, (_, i) => value[i] || '');
  const placeholderDigits = placeholder
    ? Array.from({ length }, (_, i) => placeholder[i] || '')
    : [];

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore vibration errors if blocked by browser policy
      }
    }
  }, []);

  // Autofocus the first empty digit or first digit on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmpty = digits.findIndex((d) => !d);
      const targetIndex = firstEmpty !== -1 ? firstEmpty : length - 1;
      const el = inputRefs.current[targetIndex] || inputRefs.current[0];
      if (el) {
        // Small delay to ensure modal transition doesn't steal focus
        const timer = setTimeout(() => {
          el.focus();
          el.select();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled, length]);

  const handleDigitChange = (index: number, char: string) => {
    // Only accept numeric digits
    const cleaned = char.replace(/\D/g, '');
    if (!cleaned) return;

    // Take the last typed character if multiple
    const digit = cleaned.slice(-1);

    const nextDigits = [...digits];
    nextDigits[index] = digit;
    const nextVal = nextDigits.join('');
    onChange(nextVal);

    triggerHaptic();

    // Trigger visual spring pop
    setBouncingIndex(index);
    setTimeout(() => setBouncingIndex(null), 180);

    // Auto-advance to next input if not at the end
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      triggerHaptic();

      if (digits[index]) {
        // Clear current slot
        const nextDigits = [...digits];
        nextDigits[index] = '';
        onChange(nextDigits.join(''));
      } else if (index > 0) {
        // Move to previous and clear it
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        onChange(nextDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const cleaned = pasteData.replace(/\D/g, '').slice(0, length);
    if (!cleaned) return;

    triggerHaptic();
    onChange(cleaned);

    // Focus last filled digit
    const focusTarget = Math.min(cleaned.length, length - 1);
    inputRefs.current[focusTarget]?.focus();
  };

  const handleFillBaseline = () => {
    if (typeof baselineReading === 'number' && baselineReading > 0) {
      triggerHaptic();
      const str = String(baselineReading).padStart(length, '0').slice(-length);
      onChange(str);
      // Focus the last digit so user can quickly increment/tweak
      inputRefs.current[length - 1]?.focus();
      inputRefs.current[length - 1]?.select();
    }
  };

  const handleClear = () => {
    triggerHaptic();
    onChange('');
    inputRefs.current[0]?.focus();
  };

  return (
    <div className={cn('space-y-2 select-none', className)}>
      {/* Physical Mechanical Tumbler Bezel */}
      <div
        className="relative rounded-2xl bg-[#0F1117] p-2.5 sm:p-3 border border-black/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_3px_rgba(255,255,255,0.06)]"
        role="group"
        aria-label={ariaLabel}
      >
        {/* Faceplate Top Bar */}
        <div className="flex items-center justify-between px-1.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <div className="flex items-center gap-1 text-zinc-400">
            <Gauge className="w-3 h-3 text-[#006FEE]" />
            <span>KSEB LT-1A METER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono text-[9px]">TOTAL</span>
            <span className="text-amber-400/90 font-mono font-bold bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20">
              kWh
            </span>
          </div>
        </div>

        {/* Tumbler Drum Slots */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {digits.map((digit, idx) => {
            const isFocused = focusedIndex === idx;
            const isBouncing = bouncingIndex === idx;
            const ghostDigit = placeholderDigits[idx];

            return (
              <motion.div
                key={`tumbler-${idx}`}
                animate={
                  isBouncing
                    ? { scale: [1, 1.08, 0.96, 1], y: [0, -3, 1, 0] }
                    : { scale: 1, y: 0 }
                }
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'relative h-15 sm:h-17 rounded-xl bg-gradient-to-b from-[#1C1F28] via-[#14161E] to-[#0D0F14] border transition-all duration-150 overflow-hidden flex flex-col items-center justify-center cursor-text',
                  isFocused
                    ? 'border-[#006FEE] ring-2 ring-[#006FEE]/40 shadow-[0_0_12px_rgba(0,111,238,0.35)]'
                    : digit
                    ? 'border-white/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5)]'
                    : 'border-white/8 opacity-90'
                )}
                onClick={() => inputRefs.current[idx]?.focus()}
              >
                {/* 3D Drum cylinder shadows (top & bottom curvature) */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-3.5 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-10" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />

                {/* Center alignment groove line */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/[0.04] z-10" />

                {/* Hidden/styled native input for keyboard, IME, and numeric pad */}
                <input
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  disabled={disabled}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onFocus={() => setFocusedIndex(idx)}
                  onBlur={() => setFocusedIndex(null)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${idx + 1} of 5`}
                  className="w-full h-full text-center font-mono font-black text-2xl sm:text-3xl text-white bg-transparent outline-none caret-transparent z-20 selection:bg-transparent"
                />

                {/* Ghost placeholder when slot is empty */}
                {!digit && ghostDigit && (
                  <span className="pointer-events-none absolute font-mono font-bold text-2xl sm:text-3xl text-white/20 select-none z-10">
                    {ghostDigit}
                  </span>
                )}

                {/* Slot index indicator at top-right */}
                <span className="pointer-events-none absolute top-1 right-1 text-[8px] font-mono text-zinc-600 z-10">
                  {idx + 1}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Footer info: Physical drum hint */}
        <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-400 font-medium">
            <span>Read 5 black digits</span>
            <span className="text-zinc-500">(omit red decimal)</span>
          </span>

          <div className="flex items-center gap-2">
            {typeof baselineReading === 'number' && baselineReading > 0 && (
              <button
                type="button"
                onClick={handleFillBaseline}
                className="text-[11px] font-semibold text-[#006FEE] hover:text-[#338EF7] inline-flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                title="Prefill previous reading digits"
              >
                <Copy className="w-3 h-3" />
                <span>Last: {baselineReading}</span>
              </button>
            )}

            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-0.5 active:scale-95 transition-transform cursor-pointer"
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
