'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AlertCircle, HelpCircle, Sliders, PiggyBank, Sparkles } from 'lucide-react';

interface ProductPreviewProps {
  interactive?: boolean;
}

export default function ProductPreviewCard({ interactive = true }: ProductPreviewProps) {
  const { lang, t } = useLanguage();

  return (
    <div className="w-full rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] transition-all">
      {/* Top Header with Honest Example Label */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t.yourNextBill}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
          <Sparkles className="h-3 w-3 text-sky-600" />
          <span>{lang === 'ml' ? 'ഉദാഹരണം (Example Preview)' : 'Example Preview'}</span>
        </span>
      </div>

      {/* Hero Bill Number */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 num-tabular">
            ₹1,284
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.estimated}
          </span>
        </div>
        
        {/* Likely Range */}
        <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <span className="text-slate-500">{t.likelyRange}:</span>
          <span className="font-mono font-semibold text-slate-800 num-tabular">
            ₹1,210 – ₹1,360
          </span>
        </div>
      </div>

      {/* Recent Usage & Comparison Badges */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 mb-5 border border-slate-100">
        <div>
          <div className="text-xs text-slate-500 font-medium">{t.currentUsage}</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-mono text-lg font-bold text-slate-900 num-tabular">3.8</span>
            <span className="text-xs text-slate-600">{t.unitsPerDay}</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 font-medium">{t.comparedWithLast}</div>
          <div className="mt-0.5 flex items-center gap-1 text-slate-700">
            <span className="text-xs font-semibold text-amber-600">↑ ₹136</span>
            <span className="text-[11px] text-slate-500">(+11%)</span>
          </div>
        </div>
      </div>

      {/* Cycle Progress Bar */}
      <div className="mb-5 space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-slate-600">
          <span>{t.billingPeriod}</span>
          <span className="font-mono text-slate-700 num-tabular">17 / 60 {t.daysElapsed}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-sky-600 transition-all duration-500"
            style={{ width: '28.3%' }}
          />
        </div>
      </div>

      {/* Calm Slab Warning */}
      <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-3.5 text-xs text-amber-900">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-bold text-amber-950">
            {t.approachingSlabWarning}
          </p>
          <p className="mt-0.5 text-amber-800">
            <strong className="font-semibold text-amber-950">23 units remaining</strong> before next tariff rate (~6 days at your current rate).
          </p>
        </div>
      </div>

      {/* Action Links */}
      {interactive && (
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
          <Link
            href="/explain"
            className="rounded-xl py-2 px-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors"
          >
            {t.whyThisAmount}
          </Link>
          <Link
            href="/what-if"
            className="rounded-xl py-2 px-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors"
          >
            {t.whatIfUseMore}
          </Link>
          <Link
            href="/budget"
            className="rounded-xl py-2 px-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors"
          >
            {t.setABudget}
          </Link>
        </div>
      )}
    </div>
  );
}
