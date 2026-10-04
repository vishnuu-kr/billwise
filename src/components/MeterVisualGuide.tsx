'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Info, Gauge } from 'lucide-react';

interface MeterVisualGuideProps {
  currentReadingVal: string;
}

export default function MeterVisualGuide({ currentReadingVal }: MeterVisualGuideProps) {
  const { lang } = useLanguage();

  const displayReading = currentReadingVal ? currentReadingVal.padStart(5, '0') : '10412';

  return (
    <div className="w-full glass-card p-4 sm:p-5 space-y-3.5">
      {/* Header with Icon & Clean Non-wrapping Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--foreground)]">
          <Gauge className="h-4 w-4 text-[#006FEE]" />
          <span>{lang === 'ml' ? 'മീറ്റർ നോക്കേണ്ട വിധം' : 'Meter visual guide'}</span>
        </div>
        <span className="text-[10px] font-semibold text-[#006FEE] bg-[#006FEE]/10 border border-[#006FEE]/20 px-2 py-0.5 rounded-full shrink-0">
          KSEB LT-1A
        </span>
      </div>

      {/* Realistic Digital Meter Hardware Body */}
      <div className="relative mx-auto w-full rounded-2xl border border-black/[0.08] bg-gradient-to-b from-[#1C1D22] to-[#121316] p-4 sm:p-5 text-white shadow-xl shadow-black/15">
        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-x-0 top-0 h-8 rounded-t-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

        {/* Meter Brand & Type Header */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/10 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold tracking-wider text-zinc-100">KSEBL STATIC</span>
            <span className="text-[9px] font-semibold text-zinc-300 bg-white/10 px-1.5 py-0.5 rounded">1-PHASE</span>
          </div>
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* LCD Screen Display Window */}
        <div className={`relative rounded-xl bg-[#090D0A] border p-3.5 sm:p-4 text-center shadow-inner transition-all duration-300 ${
          currentReadingVal
            ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
            : 'border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.08)]'
        }`}>
          {/* LCD Status Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/90 mb-1.5">
            <span className="tracking-widest">ACTIVE IMPORT</span>
            <span className="font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 shadow-xs">
              kWh
            </span>
          </div>

          {/* Primary Digits with Visual Decimal Separation */}
          <div className="py-1 flex items-baseline justify-center gap-1 font-mono">
            {/* Main Whole Units (Highlighted in Emerald) */}
            <span className="text-3xl sm:text-4xl font-black tracking-widest text-[#10B981] num-tabular drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              {displayReading}
            </span>

            {/* Simulated Decimal Digit in Red Border (Teaches users what to ignore) */}
            <div className="flex items-center ml-1">
              <span className="text-xl sm:text-2xl font-bold text-rose-400/80 border border-rose-500/50 bg-rose-950/40 rounded px-1.5 py-0.5 leading-none">
                .4
              </span>
            </div>
          </div>

          {/* Visual Instruction Badges beneath the digits */}
          <div className="mt-2 flex items-center justify-center gap-2 text-[9px] font-mono">
            <span className="text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {lang === 'ml' ? '✓ ഈ 5 അക്കങ്ങൾ നൽകുക' : '✓ Enter these 5 digits'}
            </span>
            <span className="text-rose-400 bg-rose-950/70 border border-rose-500/30 px-1.5 py-0.5 rounded-full">
              {lang === 'ml' ? '✗ ദശാംശം വേണ്ട' : '✗ Ignore decimal'}
            </span>
          </div>
        </div>

        {/* Bottom Hardware Details: Pulse LED, Optical Port, Specs */}
        <div className="mt-3.5 flex items-center justify-between text-[10px] text-zinc-400 px-1 pt-1.5 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
            </span>
            <span className="font-mono text-[9px] text-zinc-300">3200 imp/kWh</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px]">
            <span>240V · 5-30A</span>
            <span className="text-[#006FEE] font-bold bg-[#006FEE]/10 px-1.5 py-0.5 rounded border border-[#006FEE]/20">
              LT-1A
            </span>
          </div>
        </div>
      </div>

      {/* Clear Explanation Note */}
      <div className="flex items-start gap-2.5 text-[12px] text-[var(--secondary)] bg-[#006FEE]/5 rounded-xl p-3 border border-[#006FEE]/15">
        <Info className="h-4 w-4 text-[#006FEE] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'ml'
            ? 'മീറ്ററിന്റെ സ്ക്രീനിൽ "kWh" എന്ന് കാണിക്കുന്ന വലിയ അക്കങ്ങൾ മാത്രം നൽകുക. ചുവന്ന ബോർഡറിലുള്ള ദശാംശ സംഖ്യകൾ ഒഴിവാക്കുക.'
            : 'Enter only the main digits next to "kWh". Ignore decimals or digits inside a red border if present.'}
        </p>
      </div>
    </div>
  );
}
