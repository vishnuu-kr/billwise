'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { cn } from '@/lib/cn';

interface CycleTimelineProps {
  daysElapsed: number;
  totalCycleDays?: number;
  confidenceLabel?: string;
  className?: string;
}

export default function CycleTimeline({
  daysElapsed,
  totalCycleDays = 60,
  confidenceLabel,
  className,
}: CycleTimelineProps) {
  const { lang } = useLanguage();

  const safeElapsed = Math.max(0, Math.min(totalCycleDays, daysElapsed));
  const progressPct = Math.round((safeElapsed / totalCycleDays) * 100);
  const daysRemaining = Math.max(0, totalCycleDays - safeElapsed);

  return (
    <div className={cn('rounded-2xl bg-black/[0.02] border border-black/[0.04] p-3.5 space-y-2.5', className)}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
        <span>{lang === 'ml' ? 'സൈക്കിൾ പുരോഗതി' : 'Cycle progress'}</span>
        <span className="text-[#17171C] font-bold num-tabular">
          {safeElapsed}d of {totalCycleDays}d ({daysRemaining}d left)
        </span>
      </div>

      {/* Lightweight Track */}
      <div className="relative pt-1 pb-2">
        <div className="h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden relative">
          <div
            className="h-full bg-[#006FEE] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(4, Math.min(98, progressPct))}%` }}
          />
        </div>

        {/* Current position node */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${Math.max(4, Math.min(96, progressPct))}%` }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#006FEE] shadow-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#006FEE]" />
          </div>
        </div>
      </div>

      {/* 3 Milestones */}
      <div className="flex items-center justify-between text-[11px] text-[#71717A]">
        <div className="text-left">
          <span className="block font-medium text-[#17171C]">
            {lang === 'ml' ? 'ബിൽ ആരംഭം' : 'Bill paid'}
          </span>
          <span className="text-[10px] text-[#71717A]">Day 1</span>
        </div>

        <div className="text-center px-1">
          <span className="block font-semibold text-[#006FEE]">
            {lang === 'ml' ? 'നിലവിലെ ഘട്ടം' : 'Current reading'}
          </span>
          <span className="text-[10px] text-[#71717A] num-tabular">Day {safeElapsed}</span>
        </div>

        <div className="text-right">
          <span className="block font-medium text-[#17171C]">
            {lang === 'ml' ? 'അടുത്ത ബിൽ' : 'Expected billing'}
          </span>
          <span className="text-[10px] text-[#71717A] num-tabular">Day {totalCycleDays}</span>
        </div>
      </div>

      {confidenceLabel && (
        <div className="pt-1 border-t border-black/[0.04] flex items-center justify-between text-[11px]">
          <span className="text-[#71717A]">{lang === 'ml' ? 'പ്രവചന കൃത്യത:' : 'Estimate precision:'}</span>
          <span className="font-semibold text-[#17171C]">{confidenceLabel}</span>
        </div>
      )}
    </div>
  );
}
