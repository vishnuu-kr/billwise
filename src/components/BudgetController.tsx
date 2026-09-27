'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import {
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Gauge,
  Sliders,
} from 'lucide-react';

interface BudgetControllerProps {
  currentProjectedUnits?: number;
  currentPaceUnitsPerDay?: number;
}

export default function BudgetController({
  currentProjectedUnits = 240,
  currentPaceUnitsPerDay = 3.8,
}: BudgetControllerProps) {
  const { lang, t } = useLanguage();
  const [budgetRupees, setBudgetRupees] = useState<number>(2000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Binary search or iterative solve for target units corresponding to budget amount in ₹
  const targetUnits = useMemo(() => {
    let low = 10;
    let high = 1000;
    let best = 10;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const calc = calculateBill({ units: mid, billingCycle: 'bi-monthly', phase: 'single' });
      if (calc.total <= budgetRupees) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return best;
  }, [budgetRupees]);

  const headroomUnits = targetUnits - currentProjectedUnits;
  const isWithinBudget = headroomUnits >= 0;
  const daysOfHeadroom = currentPaceUnitsPerDay > 0
    ? Math.max(0, Math.round(Math.abs(headroomUnits) / currentPaceUnitsPerDay))
    : 0;

  // Percentage of budget consumed
  const percentUsed = Math.min(150, Math.round((currentProjectedUnits / (targetUnits || 1)) * 100));

  const handleSaveBudget = () => {
    storageManager.saveBudget({
      monthlyTargetRupees: Math.round(budgetRupees / 2),
      billingCycleTargetRupees: budgetRupees,
      createdDate: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <PiggyBank className="h-4 w-4 text-sky-600" />
          <span>{lang === 'ml' ? 'ബജറ്റ് കൺട്രോൾ' : 'Budget Control'}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
          {t.budgetHeadline}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {lang === 'ml'
            ? 'നിങ്ങൾ ഉദ്ദേശിക്കുന്ന തുക നൽകുക; എത്ര യൂണിറ്റ് വരെ ഉപയോഗിക്കാം എന്ന് കൃത്യമായി കണക്കാക്കാം.'
            : 'Set your bi-monthly bill spending ceiling and monitor your usage headroom.'}
        </p>
      </div>

      {/* Budget Input & Quick Presets */}
      <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Bi-Monthly Target Limit
          </label>
          <div className="mt-1.5 relative flex items-center">
            <span className="absolute left-4 font-mono text-2xl font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              step="100"
              value={budgetRupees}
              onChange={e => setBudgetRupees(Math.max(100, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 font-mono text-2xl font-extrabold text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Quick presets:</span>
          {[1000, 1500, 2000, 3000, 4000].map(amt => (
            <button
              key={amt}
              onClick={() => setBudgetRupees(amt)}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                budgetRupees === amt
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Headroom Meter */}
      <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-600">Budget Headroom Meter</span>
          <span className={`font-bold ${isWithinBudget ? 'text-emerald-700' : 'text-amber-700'}`}>
            {percentUsed}% consumed
          </span>
        </div>

        {/* Horizontal Visual Meter */}
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentUsed > 100
                ? 'bg-red-500'
                : percentUsed > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">{t.targetConsumption}</div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-900 num-tabular">
              ~{targetUnits} {t.units}
            </div>
            <div className="text-[10px] text-slate-400">to stay under ₹{budgetRupees}</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">{t.currentProjected}</div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-900 num-tabular">
              {currentProjectedUnits} {t.units}
            </div>
            <div className="text-[10px] text-slate-400">at {currentPaceUnitsPerDay} units/day</div>
          </div>
        </div>

        {/* Outcome Statement */}
        <div
          className={`rounded-xl p-3.5 text-xs ${
            isWithinBudget
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-100'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {isWithinBudget ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">
              {isWithinBudget ? (
                <span>
                  <strong>Estimated headroom: ~{headroomUnits} units.</strong> At your current pace, your projected bill stays within your ₹{budgetRupees.toLocaleString('en-IN')} target.
                </span>
              ) : (
                <span>
                  <strong>Pace alert:</strong> At your current rate, you are projected to exceed your ₹{budgetRupees.toLocaleString('en-IN')} budget by approximately {Math.abs(headroomUnits)} units in {daysOfHeadroom} days.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleSaveBudget}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
        >
          <PiggyBank className="h-4 w-4" />
          <span>{savedSuccess ? 'Budget Saved!' : 'Save Budget Target'}</span>
        </button>

        <Link
          href={`/what-if?units=${currentProjectedUnits}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors touch-target"
        >
          <Sliders className="h-4 w-4 text-slate-500" />
          <span>Adjust my usage</span>
        </Link>
      </div>
    </div>
  );
}
