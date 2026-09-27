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
  Tag,
  Smartphone,
  Info,
} from 'lucide-react';
import ShareModal from './ShareModal';
import FeedbackWidget from './FeedbackWidget';
import { APP_CONFIG } from '@/lib/config/flags';
import { storageManager } from '@/lib/storage';

interface ResultCardProps {
  prediction: PredictionResult;
  previousBillAmount?: number;
}

export default function ResultCard({
  prediction,
  previousBillAmount,
}: ResultCardProps) {
  const { lang, t } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTariffDetails, setShowTariffDetails] = useState(false);

  const hasPreviousBill = typeof previousBillAmount === 'number' && previousBillAmount > 0;
  const billDiff = hasPreviousBill ? prediction.estimatedBill - previousBillAmount : 0;
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
            {hasPreviousBill ? t.comparedWithLast : 'Projected Units'}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            {hasPreviousBill ? (
              <>
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
              </>
            ) : (
              <>
                <span className="font-mono text-lg font-bold text-sky-800 num-tabular">
                  {prediction.projectedUnits}
                </span>
                <span className="text-xs text-slate-500">{t.units}</span>
              </>
            )}
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
            {lang === 'ml'
              ? `${prediction.daysElapsed}/${prediction.totalCycleDays} ദിവസങ്ങൾ (${prediction.daysRemaining} ദിവസം ബാക്കി)`
              : `${prediction.daysElapsed} of ${prediction.totalCycleDays} days (${prediction.daysRemaining} days left)`}
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
                {lang === 'ml'
                  ? (prediction.approachingSlab.currentSlabLimit === 240
                      ? `240 യൂണിറ്റ് സബ്സിഡി പരിധി അടുക്കുന്നു (${prediction.approachingSlab.unitsRemainingInSlab} യൂണിറ്റ് ബാക്കി)`
                      : prediction.approachingSlab.currentSlabLimit === 500
                      ? `500 യൂണിറ്റ് ടെലിസ്കോപ്പിക് പരിധി അടുക്കുന്നു (${prediction.approachingSlab.unitsRemainingInSlab} യൂണിറ്റ് ബാക്കി)`
                      : `${prediction.approachingSlab.currentSlabLimit} യൂണിറ്റിലെ അടുത്ത സ്ലാബ് അടുക്കുന്നു`)
                  : prediction.approachingSlab.warningMessage}
              </div>
              <p className="text-amber-800 leading-relaxed">
                {lang === 'ml' ? (
                  <>
                    പ്രതിദിനം {prediction.unitsPerDay} യൂണിറ്റ് വീതം ഉപയോഗിച്ചാൽ, ഈ സ്ലാബിൽ{' '}
                    <strong className="font-semibold text-amber-950">
                      {prediction.approachingSlab.unitsRemainingInSlab} യൂണിറ്റുകൾ
                    </strong>{' '}
                    കൂടി ബാക്കിയുണ്ട് (ഏകദേശം {prediction.approachingSlab.estimatedDaysRemaining ?? 5} ദിവസങ്ങൾ).
                  </>
                ) : (
                  <>
                    At your current pace of {prediction.unitsPerDay} units/day, you have{' '}
                    <strong className="font-semibold text-amber-950">
                      {prediction.approachingSlab.unitsRemainingInSlab} units remaining
                    </strong>{' '}
                    (approx {prediction.approachingSlab.estimatedDaysRemaining ?? 5} days).
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controllable Impact (Item 12) */}
      {prediction.controllableImpact && prediction.daysRemaining > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>{lang === 'ml' ? 'നിങ്ങൾക്ക് മാറ്റങ്ങൾ വരുത്താം' : 'YOU CAN CONTROL THIS'}</span>
            <span className="text-slate-500 font-normal">
              {lang === 'ml' ? `${prediction.daysRemaining} ദിവസം ബാക്കി` : `${prediction.daysRemaining} days left`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white border border-emerald-100 p-3 shadow-2xs">
              <div className="text-slate-500 font-medium">
                {lang === 'ml' ? '0.5 യൂണിറ്റ്/ദിവസം കുറച്ചാൽ' : 'If you reduce 0.5 u/day'}
              </div>
              <div className="mt-1 font-mono text-base font-bold text-emerald-600 num-tabular">
                {prediction.controllableImpact.reducedHalfUnitSaving > 0
                  ? (lang === 'ml' ? `ലാഭം ~₹${prediction.controllableImpact.reducedHalfUnitSaving.toLocaleString('en-IN')}` : `Save ~₹${prediction.controllableImpact.reducedHalfUnitSaving.toLocaleString('en-IN')}`)
                  : (lang === 'ml' ? 'അതേ സ്ലാബിൽ' : 'Same slab')}
              </div>
            </div>
            <div className="rounded-xl bg-white border border-amber-100 p-3 shadow-2xs">
              <div className="text-slate-500 font-medium">
                {lang === 'ml' ? '1.0 യൂണിറ്റ്/ദിവസം കൂട്ടിയാൽ' : 'If you use +1.0 u/day'}
              </div>
              <div className="mt-1 font-mono text-base font-bold text-amber-700 num-tabular">
                +₹{prediction.controllableImpact.increasedOneUnitCost.toLocaleString('en-IN')} {lang === 'ml' ? 'അധിക തുക' : 'extra'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Note if applicable */}
      {prediction.calculatedBillResult.discrepancyNote && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-800 mb-0.5">
            {lang === 'ml' ? 'ബിൽ പരിശോധനാ കുറിപ്പ്:' : 'Bill Reconciliation Note:'}
          </p>
          <p>{prediction.calculatedBillResult.discrepancyNote}</p>
        </div>
      )}

      {/* Tariff Transparency & Visibility (Section 13) */}
      <div className="border-t border-slate-100 pt-3 mb-6">
        <button
          type="button"
          onClick={() => setShowTariffDetails(!showTariffDetails)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-between w-full py-1"
        >
          <span>{lang === 'ml' ? 'ഉപയോഗിച്ച താരിഫ് വിവരങ്ങൾ' : 'Tariff rules used'}</span>
          <span className="font-mono text-slate-400">{showTariffDetails ? '▲ Hide' : '▼ Inspect'}</span>
        </button>
        {showTariffDetails && (
          <div className="mt-2 rounded-xl bg-slate-50 p-3.5 text-[11px] text-slate-600 space-y-1.5 font-mono border border-slate-100">
            <div>Schedule: {prediction.calculatedBillResult.effectiveTariffVersion} (LT-1A Domestic)</div>
            <div>Period: Effective from 2024-11-01 to Present (Active)</div>
            <div>Cycle: {prediction.calculatedBillResult.billingCycle} • Phase: {prediction.calculatedBillResult.phase}</div>
            <div>Connected Load: {prediction.calculatedBillResult.connectedLoadWatts} W</div>
            <div>Fuel Adjustment (FAC): ₹{prediction.calculatedBillResult.fuelAdjustment.toFixed(2)} (1p/unit baseline)</div>
            <div>Electricity Duty: 10% statutory state duty (₹{prediction.calculatedBillResult.electricityDuty.toFixed(2)})</div>
            {prediction.calculatedBillResult.totalSubsidies > 0 ? (
              <div className="text-emerald-700 font-bold">Government Subsidy: ₹{prediction.calculatedBillResult.totalSubsidies} applied (up to 240 units limit)</div>
            ) : (
              <div className="text-slate-400">Subsidies: None (above 240 units bi-monthly ceiling)</div>
            )}
          </div>
        )}
      </div>

      {/* Smart Need-More-Data Contextual Notice (Section 20) */}
      {(!hasPreviousBill || storageManager.getHistory().length <= 1) && (
        <div className="mb-6 rounded-2xl bg-sky-50/80 border border-sky-100 p-3 text-xs text-sky-900 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block text-xs text-sky-950">
              {lang === 'ml' ? 'കൂടുതൽ വിവരങ്ങൾ ആവശ്യമാണ്' : 'Early estimate based on initial reading'}
            </span>
            <span className="text-[11px] text-sky-800 leading-relaxed block">
              {lang === 'ml'
                ? 'നിങ്ങളുടെ ആദ്യ റീഡിംഗ് അടിസ്ഥാനമാക്കിയുള്ളതാണ് ഈ കണക്ക്. അടുത്ത സൈക്കിളിൽ ഒരു റീഡിംഗ് കൂടി ചേർക്കുമ്പോൾ കൂടുതൽ കൃത്യമായ കണക്കുകൂട്ടൽ ലഭിക്കും.'
                : 'Your estimate is based on one previous bill. Add one more reading next cycle for a more personalized estimate.'}
            </span>
          </div>
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

      {/* User Feedback Widget (Beta calibration) */}
      <div className="pt-1 mb-4">
        <FeedbackWidget
          context="prediction_result"
          units={prediction.projectedUnits}
          predictedBill={prediction.estimatedBill}
        />
      </div>

      {/* Subtle PWA Install Suggestion (Section 25) */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 mb-5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Smartphone className="h-4 w-4 text-slate-500 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800 block text-xs">
              {lang === 'ml' ? 'ഹോം സ്ക്രീനിൽ വെക്കാം' : 'Keep BILLWISE on your phone'}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {lang === 'ml' ? 'ആപ്പ് സ്റ്റോറുകൾ ഇല്ലാതെ വേഗത്തിൽ മീറ്റർ പരിശോധിക്കാം' : 'Access your meter estimates anytime without app stores'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => alert(lang === 'ml' ? 'ബ്രൗസർ മെനുവിൽ നിന്ന് (⋮) "Add to Home screen" ക്ലിക്ക് ചെയ്യുക' : 'Tap your browser menu (⋮ or Share) and select "Add to Home Screen"')}
          className="shrink-0 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          {lang === 'ml' ? 'ഇൻസ്റ്റാൾ' : 'Add to Home'}
        </button>
      </div>

      {/* Tariff Version Indicator */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 pb-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-mono">
          <Tag className="h-3 w-3 text-sky-600" />
          <span>{APP_CONFIG.tariffVersionLabel}</span>
        </div>
        <Link
          href="/tariff"
          className="font-semibold text-sky-600 hover:text-sky-700 underline"
        >
          {lang === 'ml' ? 'നിരക്കുകൾ പരിശോധിക്കുക' : 'Verify Rates'}
        </Link>
      </div>

      {/* Reassurance Disclaimer at bottom */}
      <div className="pt-2 text-center">
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
