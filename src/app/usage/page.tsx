'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { calculateBill, calculateBillDifference } from '@/lib/calculation/engine';
import { HistoryRecord, BillDifferenceBreakdown } from '@/types';
import { Info, ArrowRight, TrendingUp } from 'lucide-react';
import { CompareSlider } from '@/components/ui/CompareSlider';

export default function UsagePage() {
  const { lang } = useLanguage();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showSampleComparison, setShowSampleComparison] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const records = storageManager.getHistory();
    setHistory(records);
    setLoaded(true);
  }, []);

  const hasSufficientHistory = history.length >= 2;
  const isUsingSample = !hasSufficientHistory && showSampleComparison;

  let currentUnits = 0;
  let previousUnits = 0;

  if (hasSufficientHistory) {
    currentUnits = history[0].consumedUnits;
    previousUnits = history[1].consumedUnits;
  } else if (isUsingSample) {
    currentUnits = 286;
    previousUnits = 240;
  }

  const currentBill = calculateBill({ units: currentUnits, billingCycle: 'bi-monthly', phase: 'single' });
  const prevBill = calculateBill({ units: previousUnits, billingCycle: 'bi-monthly', phase: 'single' });
  const diff: BillDifferenceBreakdown = calculateBillDifference(prevBill, currentBill);

  if (!loaded) {
    return <div className="max-w-[430px] mx-auto px-4 pt-10 text-center text-xs text-[#71717A]">Loading...</div>;
  }

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#71717A] hover:text-[#17171C] active:opacity-60 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <span className="text-[12px] font-medium text-[var(--tertiary)] block">
          {lang === 'ml' ? 'ഉപയോഗത്തിലെ മാറ്റങ്ങൾ' : 'How your usage is changing'}
        </span>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[var(--foreground)]">
          {lang === 'ml' ? 'എന്താണ് മാറിയത്?' : 'What changed?'}
        </h1>
        <p className="text-[14px] font-normal text-[var(--secondary)] leading-relaxed pt-0.5">
          {lang === 'ml'
            ? 'കഴിഞ്ഞ ബില്ലിംഗ് കാലയളവുമായി ഉപയോഗ മാറ്റം താരതമ്യം ചെയ്യുന്നു.'
            : 'Compare consecutive billing cycles to understand your consumption shift.'}
        </p>
      </div>

      {/* Empty State */}
      {!hasSufficientHistory && !isUsingSample && (
        <div className="glass-card p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#006FEE]/10 border border-[#006FEE]/15 flex items-center justify-center text-[#006FEE] mx-auto shadow-2xs">
            <TrendingUp className="w-7 h-7 text-[#006FEE]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold tracking-tight text-[#17171C]">
              {lang === 'ml' ? '2 ബില്ലിംഗ് കാലയളവ് വേണം' : 'Needs 2 billing cycles'}
            </h3>
            <p className="text-[14px] text-[#71717A] max-w-xs mx-auto leading-relaxed">
              {lang === 'ml'
                ? 'രണ്ട് ബില്ലിംഗ് കാലയളവ് രേഖപ്പെടുത്തിയാൽ ഇവിടെ മാറ്റങ്ങളും ചിലവ് വ്യത്യാസങ്ങളും കാണാം.'
                : 'Record two cycles to see exact usage differences and rupee drivers.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/predict"
              className="ios-btn-primary w-full sm:w-auto"
            >
              <span>{lang === 'ml' ? 'റീഡിംഗ് നൽകൂ' : 'Enter reading'}</span>
              <ArrowRight style={{ width: '15px', height: '15px' }} />
            </Link>

            <button
              type="button"
              onClick={() => setShowSampleComparison(true)}
              className="text-[13px] font-medium text-[#006FEE] hover:underline py-2 cursor-pointer"
            >
              {lang === 'ml' ? 'മാതൃകാ താരതമ്യം കാണൂ' : 'View sample comparison'}
            </button>
          </div>
        </div>
      )}

      {/* Populated / Sample State */}
      {(hasSufficientHistory || isUsingSample) && (
        <div className="space-y-5">
          {isUsingSample && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.04] text-[12px] text-[#71717A]">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="h-4 w-4 text-[#006FEE] shrink-0" />
                {lang === 'ml' ? 'മാതൃകാ താരതമ്യ വിവരങ്ങൾ' : 'Sample comparison demonstration'}
              </span>
              <button
                type="button"
                onClick={() => setShowSampleComparison(false)}
                className="text-[#006FEE] font-semibold hover:underline cursor-pointer"
              >
                {lang === 'ml' ? 'ഒഴിവാക്കുക' : 'Dismiss'}
              </button>
            </div>
          )}

          {/* Hero Difference Card */}
          <div className="glass-card p-5 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] block">
              {diff.isIncrease ? (lang === 'ml' ? 'ഉപയോഗം വർദ്ധിച്ചു' : 'Usage increased') : (lang === 'ml' ? 'ഉപയോഗം കുറഞ്ഞു' : 'Usage decreased')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`num-tabular text-5xl font-bold tracking-tight ${diff.isIncrease ? 'text-[#B45309]' : 'text-[#0E7036]'}`}>
                {diff.percentageChange}%
              </span>
              <span className="text-sm font-medium text-[#71717A]">
                {diff.isIncrease ? (lang === 'ml' ? 'കൂടുതൽ' : 'increase') : (lang === 'ml' ? 'കുറവ്' : 'decrease')}
              </span>
            </div>
            <p className="text-[14px] font-medium text-[#17171C] pt-0.5 num-tabular">
              {previousUnits} → {currentUnits} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}{' '}
              <span className="text-[13px] text-[#71717A] font-normal">
                ({diff.isIncrease ? `+${currentUnits - previousUnits}` : `${currentUnits - previousUnits}`} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'})
              </span>
            </p>
          </div>

          {/* Interactive Split Compare Slider */}
          <CompareSlider
            beforeLabel={`Last Cycle (${previousUnits}u)`}
            afterLabel={`This Cycle (${currentUnits}u)`}
            beforeContent={
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">Previous Bill</span>
                <span className="text-2xl sm:text-3xl font-bold num-tabular text-[#17171C] block">
                  ₹{prevBill.total.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#71717A] block">{previousUnits} units · LT-1A</span>
              </div>
            }
            afterContent={
              <div className="space-y-1 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Current Bill</span>
                <span className="text-2xl sm:text-3xl font-bold num-tabular text-emerald-800 block">
                  ₹{currentBill.total.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-600 block">{currentUnits} units · LT-1A</span>
              </div>
            }
            className="h-44 shadow-sm"
          />

          {/* Context Stats */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 grid grid-cols-2 gap-4 shadow-[var(--shadow-subtle)]">
            <div>
              <span className="text-[11px] text-[var(--secondary)] block">Previous bill</span>
              <span className="num-tabular text-xl font-semibold text-[var(--foreground)] block">
                ₹{prevBill.total.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[var(--tertiary)]">{previousUnits} units</span>
            </div>
            <div>
              <span className="text-[11px] text-[var(--secondary)] block">Current bill</span>
              <span className="num-tabular text-xl font-semibold text-[var(--foreground)] block">
                ₹{currentBill.total.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[var(--tertiary)]">{currentUnits} units</span>
            </div>
          </div>

          {/* Exact Rupee Drivers */}
          <div className="space-y-2">
            <span className="text-[12px] font-medium text-[var(--secondary)] block px-1">
              {lang === 'ml' ? 'തുകയിലെ പ്രധാന മാറ്റങ്ങൾ' : 'Primary rupee drivers'}
            </span>
            <div className="ios-grouped-list">
              <div className="ios-row">
                <span className="text-[14px] text-[var(--secondary)]">Energy charge shift</span>
                <span className="num-tabular font-semibold text-[14px] text-[var(--foreground)]">
                  +₹{diff.usageImpactAmount.toFixed(0)}
                </span>
              </div>
              {diff.subsidyImpactAmount > 0 && (
                <div className="ios-row text-[var(--warning-text)]">
                  <span className="text-[14px]">Subsidies discontinued (&gt;240u)</span>
                  <span className="num-tabular font-semibold text-[14px]">+₹{diff.subsidyImpactAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="ios-row">
                <span className="text-[14px] text-[var(--secondary)]">Duty (10%)</span>
                <span className="num-tabular font-semibold text-[14px] text-[var(--foreground)]">+₹{diff.dutyImpactAmount.toFixed(0)}</span>
              </div>
              <div className="ios-row font-semibold">
                <span className="text-[14px] text-[var(--foreground)]">Net bill difference</span>
                <span className="num-tabular text-[16px] text-[var(--foreground)]">
                  {diff.isIncrease ? '+' : ''}₹{diff.differenceAmount.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
