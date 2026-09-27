'use client';

import React, { useState, useMemo } from 'react';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Sliders, AlertTriangle, ArrowRight, Zap, Info } from 'lucide-react';
import Link from 'next/link';

interface WhatIfSimulatorProps {
  initialUnits?: number;
}

export default function WhatIfSimulator({ initialUnits = 240 }: WhatIfSimulatorProps) {
  const { lang, t } = useLanguage();
  const [sliderUnits, setSliderUnits] = useState<number>(initialUnits);

  // Pure deterministic recalculation on every slider step
  const result = useMemo(() => {
    return calculateBill({
      units: sliderUnits,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });
  }, [sliderUnits]);

  // Meaningful thresholds in KSEB LT-1A bi-monthly
  const isAtOrAboveSubsidyCeiling = sliderUnits > 240;
  const isAtOrAboveTelescopicCliff = sliderUnits > 500;

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Sliders className="h-4 w-4 text-sky-600" />
          <span>{lang === 'ml' ? 'ഉപയോഗ സിമുലേറ്റർ' : 'Interactive Simulator'}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
          {lang === 'ml' ? 'കൂടുതൽ ഉപയോഗിച്ചാൽ എന്ത് സംഭവിക്കും?' : 'What happens if I use more?'}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {lang === 'ml'
            ? 'സ്ലൈഡർ നീക്കി യൂണിറ്റ് മാറ്റുമ്പോൾ ബില്ലിൽ വരുന്ന മാറ്റം ഉടനടി അറിയാം.'
            : 'Drag the slider to see how unit consumption directly impacts your KSEB bill.'}
        </p>
      </div>

      {/* Large Interactive Slider */}
      <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {lang === 'ml' ? 'തിരഞ്ഞെടുത്ത ഉപയോഗം' : 'Selected Usage'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-extrabold text-sky-700 num-tabular">
              {sliderUnits}
            </span>
            <span className="text-sm font-semibold text-slate-600">{t.units}</span>
          </div>
        </div>

        <input
          type="range"
          min="50"
          max="650"
          step="5"
          value={sliderUnits}
          onChange={e => setSliderUnits(Number(e.target.value))}
          className="w-full cursor-pointer accent-sky-600"
          aria-label="Consumption units slider"
        />

        {/* Quick Jump Unit Pills */}
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-500 pt-1">
          {[100, 160, 200, 240, 300, 400, 500].map(val => (
            <button
              key={val}
              onClick={() => setSliderUnits(val)}
              className={`rounded-lg px-2 py-1 transition-all ${
                sliderUnits === val
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {val}u
            </button>
          ))}
        </div>
      </div>

      {/* Important Threshold Warning Banner */}
      {isAtOrAboveTelescopicCliff ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-950">
              500-Unit Telescopic Cliff Crossed:
            </span>{' '}
            Your entire bill has shifted from telescopic slabs to a flat ₹{result.slabBreakdown[0]?.ratePerUnit.toFixed(2)}/unit rate.
          </div>
        </div>
      ) : isAtOrAboveSubsidyCeiling ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950">
              240-Unit Subsidy Threshold Exceeded:
            </span>{' '}
            Kerala Government subsidies (₹148 benefit) are discontinued once bi-monthly consumption passes 240 units.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Within subsidised slab bracket (Eligible for ₹{result.totalSubsidies} Government rebate).
          </span>
        </div>
      )}

      {/* Live Computed Numbers Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500 font-medium">{t.energyCharges}</div>
          <div className="mt-1 font-mono text-base font-bold text-slate-900 num-tabular">
            ₹{result.grossEnergyCharge.toFixed(0)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500 font-medium">{t.fixedCharges}</div>
          <div className="mt-1 font-mono text-base font-bold text-slate-900 num-tabular">
            ₹{result.grossFixedCharge.toFixed(0)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500 font-medium">{t.dutyCharges}</div>
          <div className="mt-1 font-mono text-base font-bold text-slate-900 num-tabular">
            ₹{result.electricityDuty.toFixed(0)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500 font-medium">{t.subsidiesLabel}</div>
          <div className="mt-1 font-mono text-base font-bold text-emerald-600 num-tabular">
            {result.totalSubsidies > 0 ? `−₹${result.totalSubsidies.toFixed(0)}` : '₹0'}
          </div>
        </div>
      </div>

      {/* Hero Computed Total for this unit setting */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
            {lang === 'ml' ? 'ആകെ പ്രതീക്ഷിക്കുന്ന തുക' : 'Total Estimated Bill'}
          </span>
          <div className="mt-0.5 text-xs text-slate-500">
            Bi-monthly (60 days) • Single phase LT-1A
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 num-tabular">
            ₹{result.total.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">
            ~₹{Math.round(result.total / 2).toLocaleString('en-IN')} / month
          </div>
        </div>
      </div>

      {/* Link to budget */}
      <div className="pt-1 text-center">
        <Link
          href={`/budget?targetUnits=${sliderUnits}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
        >
          <span>{lang === 'ml' ? 'ഈ തുകയ്ക്ക് ബജറ്റ് നിശ്ചയിക്കാം' : 'Set this amount as my budget target'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
