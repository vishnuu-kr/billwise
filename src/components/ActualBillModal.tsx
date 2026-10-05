'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { SavedHomeProfile } from '@/types';
import { analytics } from '@/lib/observability/analytics';
import { Receipt, X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ActualBillModalProps {
  home: SavedHomeProfile;
  onClose: () => void;
  onReconciled: () => void;
}

export default function ActualBillModal({
  home,
  onClose,
  onReconciled,
}: ActualBillModalProps) {
  const { lang } = useLanguage();
  const [actualAmountInput, setActualAmountInput] = useState<string>('');
  const [stage, setStage] = useState<'entry' | 'compared'>('entry');
  const [comparisonResult, setComparisonResult] = useState<{
    predicted: number;
    actual: number;
    diff: number;
    diffPercent: number;
    dominantReasonEn?: string;
    dominantReasonMl?: string;
  } | null>(null);
  const [accuracyFeedback, setAccuracyFeedback] = useState<'accurate' | 'too_high' | 'too_low' | null>(null);

  const predicted = home.latestPrediction?.estimatedBill || home.lastBillAmount || 0;

  const handleRecord = () => {
    const num = parseFloat(actualAmountInput);
    if (isNaN(num) || num <= 0) return;

    const res = storageManager.recordActualBillForHome(num);
    const diff = res.diff;
    const diffPercent = res.diffPercent;

    setComparisonResult({
      predicted,
      actual: num,
      diff,
      diffPercent,
      dominantReasonEn: res.comparison?.dominantReasonEn,
      dominantReasonMl: res.comparison?.dominantReasonMl,
    });

    analytics.track('actual_bill_recorded', {
      predicted,
      actual: num,
      difference: diff,
    });

    setStage('compared');
  };

  const handleFeedback = (rating: 'accurate' | 'too_high' | 'too_low') => {
    setAccuracyFeedback(rating);
    if (comparisonResult) {
      storageManager.saveFeedback({
        context: 'history_actual_bill',
        sentiment: rating === 'accurate' ? 'positive' : 'negative',
        accuracyRating: rating,
        predictedBill: comparisonResult.predicted,
        actualBill: comparisonResult.actual,
        comment: `User marked actual bill comparison as ${rating} (diff: ₹${comparisonResult.diff})`,
      });
      analytics.track('prediction_feedback', { rating, diff: comparisonResult.diff });
    }
  };

  const handleFinish = () => {
    onReconciled();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.8 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
        className="ios-sheet w-full max-h-[90vh] md:max-h-[85vh] md:max-w-[460px] md:rounded-[28px] md:shadow-2xl overflow-y-auto"
        style={{
          padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 24px)',
        }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-1 pb-3 md:hidden">
          <div className="ios-sheet-handle cursor-grab active:cursor-grabbing" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[#17171C]">
                {stage === 'entry'
                  ? lang === 'ml' ? 'യഥാർത്ഥ ബിൽ രേഖപ്പെടുത്താം' : 'Record actual bill'
                  : lang === 'ml' ? 'പ്രവചനവും യഥാർത്ഥ ബില്ലും' : 'Prediction vs Actual'}
              </h3>
              <p className="text-[11px] text-[#71717A]">
                {stage === 'entry'
                  ? lang === 'ml' ? 'KSEB ബിൽ തുക നൽകുക' : 'Enter the final amount from your KSEB bill'
                  : lang === 'ml' ? 'ഞങ്ങളുടെ കണക്കുകൂട്ടൽ എത്ര അടുത്തായിരുന്നു?' : 'See how close our estimate was'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-[#71717A] hover:text-[#17171C] active:scale-[0.96] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] rounded-full"
            aria-label="Close modal"
          >
            <span className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.1] flex items-center justify-center">
              <X className="w-4 h-4" aria-hidden="true" />
            </span>
          </button>
        </div>

        {stage === 'entry' ? (
          <div className="space-y-4 pt-3">
            {/* Predicted reference card */}
            {predicted > 0 && (
              <div className="flex items-center justify-between bg-black/[0.03] rounded-2xl p-3.5 text-[13px]">
                <div>
                  <span className="text-[11px] text-[#71717A] block font-medium">
                    {lang === 'ml' ? 'ഞങ്ങൾ കണക്കാക്കിയ തുക' : 'Previous estimate'}
                  </span>
                  <span className="font-bold text-[#17171C] text-xl num-tabular">
                    ₹{predicted.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[11px] text-[#006FEE] bg-[#006FEE]/10 font-semibold px-2.5 py-1 rounded-full">
                  {lang === 'ml' ? 'പ്രവചനം' : 'Predicted'}
                </span>
              </div>
            )}

            {/* Actual Bill Amount Input */}
            <div className="space-y-1.5">
              <label htmlFor="actual-amount-input" className="text-[13px] font-semibold text-[#17171C]">
                {lang === 'ml' ? 'KSEB ബില്ലിൽ വന്ന തുക' : 'What was your actual bill?'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-2xl text-[#71717A]">
                  ₹
                </span>
                <input
                  id="actual-amount-input"
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  value={actualAmountInput}
                  onChange={(e) => setActualAmountInput(e.target.value)}
                  placeholder={predicted > 0 ? String(predicted) : 'e.g. 1250'}
                  className="w-full h-14 rounded-2xl bg-[#F7F7F5] pl-9 pr-4 font-bold text-2xl num-tabular text-[#17171C] border border-black/[0.12] outline-none focus:border-[#006FEE] focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRecord}
              disabled={!actualAmountInput || Number(actualAmountInput) <= 0}
              className="ios-btn-primary w-full py-3.5 px-4 text-[14px] font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{lang === 'ml' ? 'താരതമ്യം കാണുക' : 'Compare with estimate'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Stage 2: Comparison & Accuracy calibration */
          <div className="space-y-4 pt-3">
            {comparisonResult && (
              <div className="rounded-2xl bg-black/[0.03] p-4 sm:p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl shadow-2xs">
                    <span className="text-[11px] text-[#71717A] block font-medium">
                      {lang === 'ml' ? 'പ്രവചിച്ചത്' : 'Predicted'}
                    </span>
                    <span className="text-xl font-bold text-[#17171C] num-tabular">
                      ₹{comparisonResult.predicted.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-2xs">
                    <span className="text-[11px] text-[#71717A] block font-medium">
                      {lang === 'ml' ? 'യഥാർത്ഥ ബിൽ' : 'Actual Bill'}
                    </span>
                    <span className="text-xl font-bold text-[#006FEE] num-tabular">
                      ₹{comparisonResult.actual.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 pt-1 border-t border-black/[0.05] text-[13px]">
                  <span className="text-[#71717A] font-medium">
                    {lang === 'ml' ? 'വ്യത്യാസം' : 'Difference'}
                  </span>
                  <span
                    className={`font-bold num-tabular ${
                      Math.abs(comparisonResult.diff) <= 30
                        ? 'text-[#0E7036]'
                        : 'text-[#17171C]'
                    }`}
                  >
                    {comparisonResult.diff === 0
                      ? 'Exact match (₹0)'
                      : comparisonResult.diff > 0
                      ? `+₹${comparisonResult.diff} (${comparisonResult.diffPercent}%)`
                      : `−₹${Math.abs(comparisonResult.diff)} (${comparisonResult.diffPercent}%)`}
                  </span>
                </div>

                {(comparisonResult.dominantReasonEn || comparisonResult.dominantReasonMl) && (
                  <div className="p-3 bg-white rounded-xl text-[12px] text-[#71717A] border border-black/[0.04]">
                    <span className="font-semibold text-[#17171C] block mb-0.5">
                      {lang === 'ml' ? 'വ്യത്യാസത്തിന് കാരണം:' : 'Why this difference:'}
                    </span>
                    <span>
                      {lang === 'ml'
                        ? comparisonResult.dominantReasonMl || comparisonResult.dominantReasonEn
                        : comparisonResult.dominantReasonEn || comparisonResult.dominantReasonMl}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* How close was that feedback question */}
            <div className="space-y-2 pt-1">
              <span className="text-[13px] font-semibold text-[#17171C] block text-center">
                {lang === 'ml' ? 'കണക്കുകൂട്ടൽ എത്രത്തോളം അടുത്തായിരുന്നു?' : 'How close was that?'}
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleFeedback('accurate')}
                  className={`py-2 px-2 rounded-xl text-[12px] font-semibold transition-all border cursor-pointer active:scale-[0.96] ${
                    accuracyFeedback === 'accurate'
                      ? 'bg-[#17C964] text-white border-[#17C964]'
                      : 'bg-white border-black/[0.08] text-[#17171C] hover:bg-black/[0.02]'
                  }`}
                >
                  {lang === 'ml' ? 'വളരെ കൃത്യം' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback('too_high')}
                  className={`py-2 px-2 rounded-xl text-[12px] font-semibold transition-all border cursor-pointer active:scale-[0.96] ${
                    accuracyFeedback === 'too_high'
                      ? 'bg-[#F5A524] text-white border-[#F5A524]'
                      : 'bg-white border-black/[0.08] text-[#17171C] hover:bg-black/[0.02]'
                  }`}
                >
                  {lang === 'ml' ? 'കൂടുതലായിരുന്നു' : 'Too high'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback('too_low')}
                  className={`py-2 px-2 rounded-xl text-[12px] font-semibold transition-all border cursor-pointer active:scale-[0.96] ${
                    accuracyFeedback === 'too_low'
                      ? 'bg-[#F31260] text-white border-[#F31260]'
                      : 'bg-white border-black/[0.08] text-[#17171C] hover:bg-black/[0.02]'
                  }`}
                >
                  {lang === 'ml' ? 'കുറവായിരുന്നു' : 'Too low'}
                </button>
              </div>

              <p className="text-[11px] text-[#71717A] text-center pt-0.5">
                {lang === 'ml'
                  ? 'ഇത് നിങ്ങളുടെ അടുത്ത തവണത്തെ കണക്കുകൂട്ടലുകൾ കൂടുതൽ മെച്ചപ്പെടുത്താൻ സഹായിക്കും.'
                  : 'This calibrates future predictions for your household.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="ios-btn-primary w-full py-3.5 px-4 text-[14px] font-semibold rounded-2xl cursor-pointer active:scale-[0.97]"
            >
              {lang === 'ml' ? 'പൂർത്തിയായി' : 'Done'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
