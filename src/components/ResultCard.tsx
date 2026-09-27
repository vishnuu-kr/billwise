'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PredictionResult } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  AlertCircle,
  HelpCircle,
  Sliders,
  PiggyBank,
  Share2,
  TrendingUp,
  Clock,
  Check,
} from 'lucide-react';
import ShareModal from './ShareModal';

interface ResultCardProps {
  prediction: PredictionResult;
  previousBillAmount?: number;
}

export default function ResultCard({
  prediction,
  previousBillAmount = 1148,
}: ResultCardProps) {
  const { lang, t } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);

  const billDiff = prediction.estimatedBill - previousBillAmount;
  const isHigher = billDiff > 0;
  const cyclePercent = Math.min(
    100,
    Math.round((prediction.daysElapsed / prediction.totalCycleDays) * 100)
  );

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* Top Tag & Cycle */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            {t.yourNextBill}
          </span>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors touch-target"
          title="Share estimate card"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>{t.shareResult}</span>
        </button>
      </div>

      {/* Hero Bill Amount Typography */}
      <div className="text-center sm:text-left mb-6">
        <div className="flex items-baseline justify-center sm:justify-start gap-2">
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 num-tabular">
            ₹{prediction.estimatedBill.toLocaleString('en-IN')}
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t.estimated}
          </span>
        </div>

        {/* Likely Range */}
        <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600">
          <span className="text-slate-500">{t.likelyRange}:</span>
          <span className="font-mono font-semibold text-slate-800 num-tabular">
            ₹{prediction.likelyRangeMin.toLocaleString('en-IN')} – ₹{prediction.likelyRangeMax.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Stats Cards: Diff vs Last Bill & Daily Run Rate */}
      <div className="grid grid-cols-2 gap-3.5 rounded-2xl bg-slate-50 p-4 mb-6 border border-slate-100">
        <div>
          <div className="text-xs text-slate-500 font-medium">
            {t.comparedWithLast}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`font-mono text-lg font-bold num-tabular ${
                isHigher ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {isHigher ? '↑' : '↓'} ₹{Math.abs(billDiff).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">
              ({isHigher ? '+' : '-'}{Math.round(Math.abs(billDiff) / (previousBillAmount || 1) * 100)}%)
            </span>
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 font-medium">
            {t.currentUsage}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-lg font-bold text-slate-900 num-tabular">
              {prediction.unitsPerDay}
            </span>
            <span className="text-xs text-slate-500">{t.unitsPerDay}</span>
          </div>
        </div>
      </div>

      {/* Cycle Progress Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-600">
          <span>{t.billingPeriod}</span>
          <span className="font-mono text-slate-700 num-tabular">
            {prediction.daysElapsed} of {prediction.totalCycleDays} days ({prediction.daysRemaining} days left)
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-sky-600 transition-all duration-700"
            style={{ width: `${cyclePercent}%` }}
          />
        </div>
      </div>

      {/* Primary Insight / Slab Warning */}
      {prediction.approachingSlab && (
        <div className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-950 text-sm">
                {prediction.approachingSlab.warningMessage}
              </div>
              <p className="text-amber-800 leading-relaxed">
                At your current pace of {prediction.unitsPerDay} units/day, you have{' '}
                <strong className="font-semibold text-amber-950">
                  {prediction.approachingSlab.unitsRemainingInSlab} units remaining
                </strong>{' '}
                (approx {prediction.approachingSlab.estimatedDaysRemaining ?? 5} days).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Note if applicable */}
      {prediction.calculatedBillResult.discrepancyNote && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-800 mb-0.5">Bill Reconciliation Note:</p>
          <p>{prediction.calculatedBillResult.discrepancyNote}</p>
        </div>
      )}

      {/* Three Primary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 mb-6">
        <Link
          href={`/explain?units=${prediction.projectedUnits}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-3 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700 active:scale-[0.98] transition-all touch-target text-center"
        >
          <HelpCircle className="h-4 w-4 text-sky-600" />
          <span>{t.whyThisAmount}</span>
        </Link>

        <Link
          href={`/what-if?units=${prediction.projectedUnits}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-3 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700 active:scale-[0.98] transition-all touch-target text-center"
        >
          <Sliders className="h-4 w-4 text-sky-600" />
          <span>{t.whatIfUseMore}</span>
        </Link>

        <Link
          href={`/budget?currentUnits=${prediction.projectedUnits}&rate=${prediction.unitsPerDay}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-3 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700 active:scale-[0.98] transition-all touch-target text-center"
        >
          <PiggyBank className="h-4 w-4 text-sky-600" />
          <span>{t.setABudget}</span>
        </Link>
      </div>

      {/* Reassurance Disclaimer at bottom */}
      <div className="border-t border-slate-100 pt-4 text-center">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {t.disclaimer}
        </p>
      </div>

      {/* Share Card Modal */}
      {showShareModal && (
        <ShareModal
          prediction={prediction}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
