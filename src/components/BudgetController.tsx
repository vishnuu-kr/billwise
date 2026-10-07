'use client';

import React, { useState, useMemo } from 'react';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { Wallet, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { KsebOdometer } from '@/components/ui/KsebOdometer';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';
import { ElasticSlider } from '@/components/ui/ElasticSlider';

interface BudgetControllerProps {
  currentProjectedUnits?: number;
  currentPaceUnitsPerDay?: number;
  initialTargetRupees?: number;
}

export default function BudgetController({
  currentProjectedUnits = 240,
  currentPaceUnitsPerDay: _currentPaceUnitsPerDay = 3.8,
  initialTargetRupees,
}: BudgetControllerProps) {
  const { lang } = useLanguage();
  const [budgetRupees, setBudgetRupees] = useState<number>(initialTargetRupees || 2000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Binary search to find target units corresponding to rupee budget
  const targetUnits = useMemo(() => {
    let low = 10;
    let high = 1200;
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
  const percentUsed = Math.min(100, Math.round((currentProjectedUnits / (targetUnits || 1)) * 100));

  const presets = [1000, 1500, 2000, 2500, 3000];

  const handleSaveBudget = () => {
    storageManager.saveBudget({
      monthlyTargetRupees: Math.round(budgetRupees / 2),
      billingCycleTargetRupees: budgetRupees,
      createdDate: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="w-full space-y-5">
      {/* -- Title & Rupee Goal with Odometer ------------------- */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#006FEE]" />
            <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider">
              {lang === 'ml' ? 'തുക ഇതിൽ താഴെ നിർത്താം' : 'Keep my bill under'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Bi-Monthly (60d)
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[13px] text-[#71717A] block font-medium">
            {lang === 'ml' ? 'ലക്ഷ്യമിടുന്ന തുക' : 'Target bill amount'}
          </span>
          <div className="flex items-baseline">
            <KsebOdometer value={budgetRupees} size="2xl" />
          </div>
        </div>

        {/* Tactile Slider for budget */}
        <div className="pt-1">
          <ElasticSlider
            value={budgetRupees}
            min={500}
            max={5000}
            step={50}
            unitLabel="₹"
            onChange={(val) => setBudgetRupees(val)}
            milestones={[
              { value: 1000, label: '₹1k' },
              { value: 2000, label: '₹2k' },
              { value: 3000, label: '₹3k' },
              { value: 4500, label: '₹4.5k', isDanger: true },
            ]}
          />
        </div>

        {/* Quick budget chip selector */}
        <div className="grid grid-cols-5 gap-1.5 pt-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBudgetRupees(p)}
              aria-pressed={budgetRupees === p}
              aria-label={`Set budget to ₹${p}`}
              className={`py-2 px-1 text-center rounded-full text-[12px] font-semibold num-tabular transition-all cursor-pointer active:scale-[0.96] border focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] ${
                budgetRupees === p
                  ? 'bg-[#17171C] text-white border-[#17171C] shadow-xs'
                  : 'bg-white border-black/[0.06] text-[#71717A] hover:text-[#17171C] hover:border-black/[0.12]'
              }`}
            >
              ₹{p >= 1000 ? `${p / 1000}k` : p}
            </button>
          ))}
        </div>
      </div>

      {/* -- Target Units & Headroom Card ----------------------- */}
      <div className="glass-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[12px] font-medium text-[#71717A] block mb-0.5">
              {lang === 'ml' ? 'പരമാവധി ഉപയോഗം' : 'Unit ceiling'}
            </span>
            <div className="flex items-baseline">
              <KsebOdometer value={targetUnits} size="xl" prefix="~" suffix="u" />
            </div>
            <span className="text-[12px] text-[#71717A] mt-1 block">
              {lang === 'ml' ? 'യൂണിറ്റ് പരമാവധി' : 'units / 60 days'}
            </span>
          </div>

          <div>
            <span className="text-[12px] font-medium text-[#71717A] block mb-0.5">
              {lang === 'ml' ? 'ബാക്കി പരിധി' : 'Headroom'}
            </span>
            <span
              className={`num-hero text-4xl sm:text-5xl font-bold block leading-none ${
                isWithinBudget ? 'text-[#0E7036]' : 'text-[#BE123C]'
              }`}
            >
              {isWithinBudget ? `+${headroomUnits}` : `${headroomUnits}`}
            </span>
            <span className="text-[12px] text-[#71717A] mt-1 block">
              {isWithinBudget
                ? lang === 'ml'
                  ? 'യൂണിറ്റ് ബാക്കി'
                  : 'units headroom'
                : lang === 'ml'
                ? 'യൂണിറ്റ് കവിഞ്ഞു'
                : 'units over target'}
            </span>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-black/[0.05]">
          <div className="flex justify-between items-center text-[12px] text-[#71717A]">
            <span>{currentProjectedUnits} units projected</span>
            <span className="font-semibold text-[#17171C] num-tabular">{percentUsed}% of budget</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.05]">
            <div
              className={`h-full transition-all duration-500 ${
                isWithinBudget ? 'bg-[#17C964]' : 'bg-[#F31260]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* -- Slide To Confirm Gesture --------------------------- */}
      <div className="space-y-3 pt-1">
        <SlideToConfirm
          onConfirm={handleSaveBudget}
          label={lang === 'ml' ? 'ബജറ്റ് ഉറപ്പിക്കാൻ സ്വൈപ്പ് ചെയ്യൂ' : 'Slide to lock budget ceiling'}
          confirmedLabel={lang === 'ml' ? 'ബജറ്റ് രേഖപ്പെടുത്തി!' : 'Budget ceiling locked!'}
        />

        {savedSuccess && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ml' ? 'ബജറ്റ് ലക്ഷ്യം വിജയകരമായി സേവ് ചെയ്തു' : 'Budget target saved to device storage'}</span>
          </div>
        )}

        <Link
          href={`/what-if?units=${targetUnits}`}
          className="ios-btn-primary w-full py-3.5 flex items-center justify-center gap-2"
        >
          <span>{lang === 'ml' ? 'ഉപയോഗം ക്രമീകരിക്കാം' : 'Adjust usage →'}</span>
        </Link>
      </div>
    </div>
  );
}
