'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { calculateBill, calculateBillDifference } from '@/lib/calculation/engine';
import { HistoryRecord, BillDifferenceBreakdown } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wind,
  Droplets,
  Flame,
  Refrigerator,
  SunMedium,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

export default function UsagePage() {
  const { lang, t } = useLanguage();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showSampleComparison, setShowSampleComparison] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const records = storageManager.getHistory();
    setHistory(records);
    setLoaded(true);
  }, []);

  // Determine comparison dataset
  const hasSufficientHistory = history.length >= 2;
  const isUsingSample = !hasSufficientHistory && showSampleComparison;

  // Derive comparison units
  let currentUnits = 0;
  let previousUnits = 0;
  let currentDateLabel = '';
  let previousDateLabel = '';

  if (hasSufficientHistory) {
    currentUnits = history[0].consumedUnits;
    previousUnits = history[1].consumedUnits;
    currentDateLabel = history[0].dateLabel;
    previousDateLabel = history[1].dateLabel;
  } else if (isUsingSample) {
    currentUnits = 286;
    previousUnits = 240;
    currentDateLabel = 'Current cycle (Demo)';
    previousDateLabel = 'Previous cycle (Demo)';
  }

  // Calculate bill difference breakdown deterministically
  const currentBill = calculateBill({ units: currentUnits, billingCycle: 'bi-monthly', phase: 'single' });
  const prevBill = calculateBill({ units: previousUnits, billingCycle: 'bi-monthly', phase: 'single' });
  const diff: BillDifferenceBreakdown = calculateBillDifference(prevBill, currentBill);

  const contributorsIncrease = [
    {
      name: 'Air Conditioner (AC)',
      nameMl: 'എയർ കണ്ടീഷണർ (AC)',
      icon: Wind,
      description: 'Extended summer night cooling or setting temperature below 24°C significantly escalates compressor run hours.',
      impact: 'High potential contributor',
    },
    {
      name: 'Water Heater / Geyser',
      nameMl: 'വാട്ടർ ഹീറ്റർ (Geyser)',
      icon: Flame,
      description: 'High wattage (2000W–3000W). Even 30 additional minutes per day can add 30–45 units to a bi-monthly cycle.',
      impact: 'Moderate contributor',
    },
    {
      name: 'Water Pump',
      nameMl: 'മോട്ടോർ പമ്പ്',
      icon: Droplets,
      description: 'Running pump during dry spells or unexpected pipe leaks.',
      impact: 'Low to moderate contributor',
    },
    {
      name: 'Seasonal Weather Factor',
      nameMl: 'കാലാവസ്ഥാ വ്യതിയാനം (ചൂട്/മഴ)',
      icon: SunMedium,
      description: 'Elevated ambient temperature causes refrigerators and inverter cooling appliances to work harder to maintain internal temperatures.',
      impact: 'Ambient impact',
    },
  ];

  const contributorsDecrease = [
    {
      name: 'Reduced Cooling Demand',
      nameMl: 'കൂളിംഗ് ഉപയോഗം കുറഞ്ഞു',
      icon: Wind,
      description: 'Milder seasonal weather or using ceiling fans instead of high-tonnage AC significantly lowered overall energy demand.',
      impact: 'Major saver',
    },
    {
      name: 'Efficient Appliance Timing',
      nameMl: 'കാര്യക്ഷമമായ ഉപകരണ ഉപയോഗം',
      icon: Sparkles,
      description: 'Shorter water pump runs, optimized geyser schedules, and turning off standby appliances.',
      impact: 'Moderate saver',
    },
    {
      name: 'Slab Conservation Benefit',
      nameMl: 'താഴ്ന്ന സ്ലാബ് ആനുകൂല്യം',
      icon: CheckCircle2,
      description: 'Staying within lower consumption tiers allowed you to benefit from lower base rates and eligible government subsidies.',
      impact: 'Tariff savings',
    },
  ];

  if (!loaded) {
    return <div className="mx-auto max-w-xl px-4 pt-10 text-center text-xs text-slate-400">Loading usage analysis...</div>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'ഉപയോഗ മാറ്റം' : 'Usage Analysis'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
          {lang === 'ml' ? 'ഉപയോഗത്തിൽ വന്ന മാറ്റങ്ങൾ' : 'What changed this cycle?'}
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          {lang === 'ml'
            ? 'കഴിഞ്ഞ ബില്ലിംഗ് കാലയളവുമായി ഇപ്പോഴത്തെ ഉപയോഗം താരതമ്യം ചെയ്യാം.'
            : 'Compare your current billing cycle against the previous period.'}
        </p>
      </div>

      {/* Empty State when fewer than 2 cycles exist and sample is not active */}
      {!hasSufficientHistory && !isUsingSample && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-7 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'ml' ? 'താരതമ്യം ചെയ്യാൻ കൂടുതൽ വിവരങ്ങൾ വേണം' : 'Needs at least 2 billing cycles'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {lang === 'ml'
                ? 'നിങ്ങളുടെ വൈദ്യുതി ഉപയോഗത്തിലെ മാറ്റങ്ങളും രൂപയുടെ കാരണങ്ങളും താരതമ്യം ചെയ്യാൻ കുറഞ്ഞത് രണ്ട് തവണത്തെ വിവരങ്ങൾ ആവശ്യമാണ്.'
                : 'BILLWISE compares consecutive cycles to pinpoint exact rupee drivers (subsidy loss, slab jumps, appliance shifts).'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/predict"
              className="w-full sm:w-auto rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
            >
              {lang === 'ml' ? 'റീഡിംഗ് നൽകി കണക്കാക്കുക' : 'Scan or enter reading'}
            </Link>

            <button
              type="button"
              onClick={() => setShowSampleComparison(true)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {lang === 'ml' ? 'ഉദാഹരണ താരതമ്യം കാണുക (286u vs 240u)' : 'View example comparison (286u vs 240u)'}
            </button>
          </div>
        </div>
      )}

      {/* Cycle Comparison Hero Card (Visible when sufficient history OR sample mode is active) */}
      {(hasSufficientHistory || isUsingSample) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          {/* Sample Mode Notice Badge */}
          {isUsingSample && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs text-amber-900">
              <span className="font-semibold flex items-center gap-1.5">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                {lang === 'ml' ? 'ഡെമോ താരതമ്യ വിവരങ്ങൾ (286 vs 240 യൂണിറ്റ്)' : 'Demonstration comparison using reference bill data'}
              </span>
              <button
                type="button"
                onClick={() => setShowSampleComparison(false)}
                className="text-[11px] font-bold text-amber-800 hover:underline ml-2"
              >
                {lang === 'ml' ? 'ഒഴിവാക്കുക' : 'Dismiss'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {lang === 'ml' ? 'രണ്ട് മാസ താരതമ്യം' : 'Bi-Monthly Comparison'}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                diff.isIncrease
                  ? 'bg-amber-50 text-amber-700'
                  : diff.differenceAmount < 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {diff.isIncrease ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5" /> +{diff.percentageChange}%
                </>
              ) : diff.differenceAmount < 0 ? (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5" /> -{diff.percentageChange}%
                </>
              ) : (
                <>
                  <Minus className="h-3.5 w-3.5" /> 0%
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-sky-50/70 p-4 border border-sky-100">
              <div className="text-xs font-medium text-sky-800">
                {currentDateLabel || (lang === 'ml' ? 'ഈ തവണ' : 'This Cycle')}
              </div>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 num-tabular">
                {currentUnits} <span className="text-xs font-medium text-slate-500">{lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}</span>
              </div>
              <div className="text-[11px] font-semibold text-sky-700 mt-1">
                ₹{currentBill.total.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div className="text-xs font-medium text-slate-500">
                {previousDateLabel || (lang === 'ml' ? 'കഴിഞ്ഞ തവണ' : 'Previous Cycle')}
              </div>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-extrabold text-slate-700 num-tabular">
                {previousUnits} <span className="text-xs font-medium text-slate-500">{lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-1">
                ₹{prevBill.total.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Categorized Impact Explainer */}
          <div
            className={`rounded-2xl border p-4 text-xs space-y-2 ${
              diff.isIncrease
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : diff.differenceAmount < 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{lang === 'ml' ? diff.primaryDriverMl : diff.primaryDriver}</span>
              <span className="font-mono text-sm">
                {diff.differenceAmount > 0 ? `+₹${diff.differenceAmount}` : diff.differenceAmount < 0 ? `-₹${Math.abs(diff.differenceAmount)}` : '₹0'}
              </span>
            </div>

            <p className="leading-relaxed">
              {lang === 'ml' ? diff.explanationTextMl : diff.explanationText}
            </p>

            {/* Micro Breakdown of the Difference */}
            <div className="pt-2 border-t border-black/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Energy delta</span>
                <span className="font-mono font-bold">
                  {diff.usageImpactAmount >= 0 ? `+₹${diff.usageImpactAmount}` : `-₹${Math.abs(diff.usageImpactAmount)}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Fixed charge</span>
                <span className="font-mono font-bold">
                  {diff.fixedChargeImpactAmount >= 0 ? `+₹${diff.fixedChargeImpactAmount}` : `-₹${Math.abs(diff.fixedChargeImpactAmount)}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Duty (10%)</span>
                <span className="font-mono font-bold">
                  {diff.dutyImpactAmount >= 0 ? `+₹${diff.dutyImpactAmount}` : `-₹${Math.abs(diff.dutyImpactAmount)}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Subsidy delta</span>
                <span className="font-mono font-bold">
                  {diff.subsidyImpactAmount > 0 ? `+₹${diff.subsidyImpactAmount} (lost)` : diff.subsidyImpactAmount < 0 ? `-₹${Math.abs(diff.subsidyImpactAmount)} (saved)` : '₹0'}
                </span>
              </div>
            </div>
          </div>

          {/* Likely Contributors Section */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-sm">
              {diff.isIncrease
                ? (lang === 'ml' ? 'ഉപയോഗം കൂടാൻ സാധ്യതയുള്ള കാരണങ്ങൾ' : 'Possible contributors to your increase')
                : (lang === 'ml' ? 'ഉപയോഗം കുറയാൻ സഹായിച്ച ഘടകങ്ങൾ' : 'Drivers behind your consumption reduction')}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ml'
                ? 'കേരളത്തിലെ സാധാരണ വീടുകളിലെ വൈദ്യുതി ഉപയോഗ രീതികളെ അടിസ്ഥാനമാക്കിയുള്ളത്:'
                : 'Statistical likelihood based on typical Kerala residential consumption patterns:'}
            </p>

            <div className="space-y-2.5">
              {(diff.isIncrease ? contributorsIncrease : contributorsDecrease).map(c => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.name}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">
                          {lang === 'ml' ? c.nameMl : c.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {c.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      {c.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action to Appliance Estimator */}
      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900 text-xs">
            {lang === 'ml' ? 'ഉപകരണങ്ങളുടെ കണക്ക് കൃത്യമായി അറിയണോ?' : 'Want exact appliance breakdown?'}
          </h4>
          <p className="text-[11px] text-slate-600">
            {lang === 'ml'
              ? 'നിങ്ങളുടെ വീട്ടുപകരണങ്ങളുടെ ഉപയോഗ സമയം നൽകി പരിശോധിക്കാം.'
              : 'Enter your household appliance hours in the estimator.'}
          </p>
        </div>
        <Link
          href="/appliances"
          className="rounded-xl bg-sky-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shrink-0 touch-target flex items-center justify-center"
        >
          {lang === 'ml' ? 'എസ്റ്റിമേറ്റർ തുറക്കാം' : 'Open Estimator'}
        </Link>
      </div>
    </div>
  );
}
