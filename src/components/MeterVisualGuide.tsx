'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Info, Gauge } from 'lucide-react';

interface MeterVisualGuideProps {
  currentReadingVal: string;
}

export default function MeterVisualGuide({ currentReadingVal }: MeterVisualGuideProps) {
  const { lang } = useLanguage();

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Gauge className="h-4 w-4 text-sky-600" />
        <span>{lang === 'ml' ? 'മീറ്റർ നോക്കേണ്ട വിധം' : 'Where to look on your meter'}</span>
      </div>

      {/* Realistic Digital Meter Illustration */}
      <div className="relative mx-auto max-w-sm rounded-xl border-2 border-slate-300 bg-slate-900 p-4 text-white shadow-inner">
        {/* Meter Brand & Type Header */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-700/60 pb-1.5 mb-2.5">
          <span className="font-mono">KSEBL STATIC 1-PHASE</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            CAL
          </span>
        </div>

        {/* LCD Display */}
        <div className="relative rounded-lg bg-emerald-950/70 border border-emerald-700/40 p-3 text-center">
          <div className="absolute top-1.5 right-2 text-[10px] font-mono font-bold text-emerald-300 tracking-wider">
            kWh
          </div>

          {/* Highlight indicator arrow pointing to kWh number */}
          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-emerald-300 num-tabular">
            {currentReadingVal ? currentReadingVal.padStart(5, '0') : '10412'}
          </div>

          <div className="mt-1 text-[10px] font-mono text-emerald-400/80">
            CUMULATIVE CONSUMPTION
          </div>
        </div>

        {/* Bottom indicators */}
        <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400 px-1">
          <span>240V 5-30A 50Hz</span>
          <span>3200 imp/kWh</span>
          <span className="text-sky-400 font-semibold">LT-1A</span>
        </div>
      </div>

      {/* Clear Explanation Note */}
      <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 bg-white rounded-lg p-2.5 border border-slate-200/80">
        <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
        <p>
          {lang === 'ml'
            ? 'മീറ്ററിന്റെ സ്ക്രീനിൽ "kWh" എന്ന് കാണിക്കുന്ന വലിയ അക്കങ്ങൾ മാത്രം നൽകുക. ദശാംശ സംഖ്യകൾ (ചുവന്ന ബോക്സിലെ അക്കങ്ങൾ) ഉണ്ടെങ്കിൽ ഒഴിവാക്കുക.'
            : 'Enter only the main digits next to "kWh". Ignore decimals or digits inside a red border if present.'}
        </p>
      </div>
    </div>
  );
}
