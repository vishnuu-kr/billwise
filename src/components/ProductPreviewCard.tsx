'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AlertCircle, ArrowUpRight, TrendingUp, Calendar, Zap } from 'lucide-react';

interface ProductPreviewProps {
  interactive?: boolean;
}

export default function ProductPreviewCard({ interactive = true }: ProductPreviewProps) {
  const { lang, t } = useLanguage();

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all">
      {/* Header Label */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t.yourNextBill}
          </span>
        </div>
        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">
          Bi-monthly (60 days)
        </span>
      </div>

      {/* Hero Bill Number */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 num-tabular">
            ₹1,284
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {t.estimated}
          </span>
        </div>
        
        {/* Likely Range */}
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500">{t.likelyRange}:</span>
          <span className="font-mono font-medium text-slate-800 num-tabular">₹1,210 – ₹1,360</span>
        </div>
      </div>

      {/* Comparison badge & daily run rate */}
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50/80 p-3 mb-5 border border-slate-100">
        <div>
          <div className="text-[11px] text-slate-500 font-medium">{t.currentUsage}</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-slate-900 num-tabular">3.8</span>
            <span className="text-xs text-slate-600">{t.unitsPerDay}</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 font-medium">{t.comparedWithLast}</div>
          <div className="mt-0.5 flex items-center gap-1 text-slate-700">
            <span className="text-xs font-semibold text-amber-600">↑ ₹136</span>
            <span className="text-[11px] text-slate-500">(+11%)</span>
          </div>
        </div>
      </div>

      {/* Billing Cycle Progress */}
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
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-amber-950">
            {t.approachingSlabWarning}
          </p>
          <p className="mt-0.5 text-amber-800">
            <strong className="font-semibold text-amber-950">23 units remaining</strong> before next tariff rate (~6 days at current usage).
          </p>
        </div>
      </div>

      {/* Interactive Action Links */}
      {interactive && (
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
          <Link
            href="/explain"
            className="rounded-lg py-2 px-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors"
          >
            {t.whyThisAmount}
          </Link>
          <Link
            href="/what-if"
            className="rounded-lg py-2 px-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors"
          >
            {t.whatIfUseMore}
          </Link>
          <Link
            href="/budget"
            className="rounded-lg py-2 px-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors"
          >
            {t.setABudget}
          </Link>
        </div>
      )}
    </div>
  );
}
