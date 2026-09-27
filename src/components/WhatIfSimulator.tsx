'use client';

import React, { useState, useMemo } from 'react';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Sliders, AlertTriangle, ArrowRight, Zap, PiggyBank, Gauge, Info } from 'lucide-react';
import Link from 'next/link';

interface WhatIfSimulatorProps {
  initialUnits?: number;
}

export default function WhatIfSimulator({ initialUnits = 240 }: WhatIfSimulatorProps) {
  const { lang, t } = useLanguage();
  const [controlMode, setControlMode] = useState<'units' | 'budget'>('units');
  const [sliderUnits, setSliderUnits] = useState<number>(initialUnits);

  // Pure deterministic recalculation for the current unit setting
  const result = useMemo(() => {
    return calculateBill({
      units: sliderUnits,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });
  }, [sliderUnits]);

  // Budget state synchronized with result.total
  const [budgetLimit, setBudgetLimit] = useState<number>(result.total);

  // Find target units from a given rupee budget using monotonic binary search
  const solveUnitsForBudget = (targetRupees: number): number => {
    let low = 0;
    let high = 1500;
    let best = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const calc = calculateBill({ units: mid, billingCycle: 'bi-monthly', phase: 'single' });
      if (calc.total <= targetRupees) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return best;
  };

  const handleUnitsChange = (newUnits: number) => {
    setSliderUnits(newUnits);
    const updated = calculateBill({ units: newUnits, billingCycle: 'bi-monthly', phase: 'single' });
    setBudgetLimit(updated.total);
  };

  const handleBudgetChange = (newBudget: number) => {
    setBudgetLimit(newBudget);
    const derivedUnits = solveUnitsForBudget(newBudget);
    setSliderUnits(derivedUnits);
  };

  // Meaningful thresholds in KSEB LT-1A bi-monthly
  const isAtOrAboveSubsidyCeiling = sliderUnits > 240;
  const isAtOrAboveTelescopicCliff = sliderUnits > 500;
  const dailyPace = (sliderUnits / 60).toFixed(1);

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Sliders className="h-4 w-4 text-sky-600" />
          <span>{lang === 'ml' ? 'ഉപയോഗ സിമുലേറ്റർ' : 'Bi-Directional Simulator'}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
          {lang === 'ml' ? 'മാറ്റങ്ങൾ മുൻകൂട്ടി പരിശോധിക്കാം' : 'What if my usage changes?'}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {lang === 'ml'
            ? 'യൂണിറ്റ് മാറ്റിയോ ഉദ്ദേശിക്കുന്ന ബജറ്റ് നൽകിയോ ബില്ലിലെ വ്യത്യാസം തത്സമയം അറിയാം.'
            : 'Adjust either consumption units or desired rupee budget — both stay bi-directionally synchronized.'}
        </p>
      </div>

      {/* Mode Switcher: By Units vs By Budget */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setControlMode('units')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all touch-target ${
            controlMode === 'units'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gauge className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'യൂണിറ്റ് പ്രകാരം' : 'By Units (kWh)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setControlMode('budget')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all touch-target ${
            controlMode === 'budget'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PiggyBank className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'ബജറ്റ് പ്രകാരം (₹)' : 'By Budget (₹)'}</span>
        </button>
      </div>

      {/* Interactive Controller Card */}
      {controlMode === 'units' ? (
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
            min="40"
            max="650"
            step="5"
            value={sliderUnits}
            onChange={e => handleUnitsChange(Number(e.target.value))}
            className="w-full cursor-pointer accent-sky-600"
            aria-label="Consumption units slider"
          />

          {/* Quick Jump Unit Pills */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-500 pt-1">
            {[100, 160, 200, 240, 300, 400, 500].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleUnitsChange(val)}
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

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span>{lang === 'ml' ? 'പ്രതിദിന ശരാശരി:' : 'Implied daily pace:'}</span>
            <span className="font-mono font-bold text-slate-700">~{dailyPace} units/day</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {lang === 'ml' ? 'ലക്ഷ്യ ബജറ്റ്' : 'Desired Budget Target'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-extrabold text-sky-700 num-tabular">
                ₹{budgetLimit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <input
            type="range"
            min="300"
            max="4500"
            step="50"
            value={budgetLimit}
            onChange={e => handleBudgetChange(Number(e.target.value))}
            className="w-full cursor-pointer accent-sky-600"
            aria-label="Rupee budget slider"
          />

          {/* Quick Jump Budget Pills */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-500 pt-1">
            {[600, 1000, 1500, 2000, 2500, 3500].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleBudgetChange(val)}
                className={`rounded-lg px-2 py-1 transition-all ${
                  budgetLimit === val
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                ₹{val}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span>{lang === 'ml' ? 'അനുവദനീയമായ ഉപയോഗം:' : 'Allowed consumption limit:'}</span>
            <span className="font-mono font-bold text-slate-700">up to {sliderUnits} units (~{dailyPace} u/day)</span>
          </div>
        </div>
      )}

      {/* Important Threshold Warning Banner */}
      {isAtOrAboveTelescopicCliff ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-950">
              {lang === 'ml' ? '500 യൂണിറ്റ് പരിധി കഴിഞ്ഞു:' : '500-Unit Telescopic Cliff Crossed:'}
            </span>{' '}
            {lang === 'ml'
              ? `നിങ്ങളുടെ മുഴുവൻ ബില്ലും ഫ്ലാറ്റ് നിരക്കിലേക്ക് (യൂണിറ്റിന് ₹${result.slabBreakdown[0]?.ratePerUnit.toFixed(2)}) മാറി.`
              : `Your entire bill shifts to a non-telescopic flat rate of ₹${result.slabBreakdown[0]?.ratePerUnit.toFixed(2)}/unit.`}
          </div>
        </div>
      ) : isAtOrAboveSubsidyCeiling ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950">
              {lang === 'ml' ? '240 യൂണിറ്റ് സബ്സിഡി പരിധി കഴിഞ്ഞു:' : '240-Unit Subsidy Threshold Exceeded:'}
            </span>{' '}
            {lang === 'ml'
              ? 'രണ്ട് മാസത്തെ ഉപയോഗം 240 യൂണിറ്റിൽ കൂടുതലായാൽ സർക്കാർ സബ്സിഡി (₹148 ഇളവ്) ലഭിക്കില്ല.'
              : 'Kerala Government subsidies (₹148 benefit) are removed once bi-monthly consumption passes 240 units.'}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            {lang === 'ml'
              ? `സബ്സിഡി പരിധിക്കുള്ളിലാണ് (₹${result.totalSubsidies} സർക്കാർ ഇളവ് ലഭ്യമാണ്).`
              : `Within subsidised slab bracket (Eligible for ₹${result.totalSubsidies} Government rebate).`}
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

      {/* Hero Computed Total for this setting */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
            {lang === 'ml' ? 'ആകെ കണക്കാക്കിയ തുക' : 'Total Payable Bill'}
          </span>
          <div className="mt-0.5 text-xs text-slate-500">
            {lang === 'ml' ? 'രണ്ട് മാസം (60 ദിവസം) • LT-1A ഗാർഹികം' : 'Bi-monthly (60 days) • LT-1A Domestic'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 num-tabular">
            ₹{result.total.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">
            {lang === 'ml'
              ? `~₹${Math.round(result.total / 2).toLocaleString('en-IN')} / മാസം`
              : `~₹${Math.round(result.total / 2).toLocaleString('en-IN')} / month`}
          </div>
        </div>
      </div>

      {/* Link to budget */}
      <div className="pt-1 text-center">
        <Link
          href={`/budget?currentUnits=${sliderUnits}&rate=${dailyPace}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 touch-target"
        >
          <span>{lang === 'ml' ? 'ഈ തുകയ്ക്ക് ബജറ്റ് നിശ്ചയിക്കാം' : 'Set this as my budget target'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
