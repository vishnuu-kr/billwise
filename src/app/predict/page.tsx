'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { predictUsage } from '@/lib/prediction/engine';
import { calculateConsumedUnits } from '@/lib/calculation/engine';
import { storageManager } from '@/lib/storage';
import { PredictionResult } from '@/types';
import MeterVisualGuide from '@/components/MeterVisualGuide';
import ResultCard from '@/components/ResultCard';
import {
  Zap,
  Gauge,
  Calendar,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

function PredictContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  // URL / State parameters
  const [prevReading, setPrevReading] = useState<number>(10295);
  const [currentReading, setCurrentReading] = useState<string>('10412');
  const [daysElapsed, setDaysElapsed] = useState<number>(30);
  const [totalCycleDays, setTotalCycleDays] = useState<number>(60);
  
  // Meter replacement state
  const [isMeterReplaced, setIsMeterReplaced] = useState<boolean>(false);
  const [oldMeterFinal, setOldMeterFinal] = useState<number>(10350);
  const [newMeterInitial, setNewMeterInitial] = useState<number>(0);

  // Prediction result state
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load initial params from URL if present
  useEffect(() => {
    const pReading = searchParams.get('prevReading');
    const cReading = searchParams.get('reading');
    const uParam = searchParams.get('units');

    if (pReading) setPrevReading(Number(pReading));
    if (cReading) setCurrentReading(cReading);

    // If units directly provided (e.g. from Manglish query or manual entry)
    if (uParam) {
      const units = Number(uParam);
      const res = predictUsage({
        currentCycleUnits: units,
        daysElapsed: 60,
        totalCycleDays: 60,
        billingCycle: 'bi-monthly',
        phase: 'single',
      });
      setPrediction(res);
    } else {
      // Run prediction with default values
      handleCalculate();
    }
  }, [searchParams]);

  // Derived units consumed
  const unitCalc = calculateConsumedUnits({
    previousReading: prevReading,
    presentReading: currentReading ? Number(currentReading) : prevReading,
    isMeterReplaced,
    oldMeterFinalReading: oldMeterFinal,
    newMeterInitialReading: newMeterInitial,
    billingCycle: 'bi-monthly',
    phase: 'single',
  });

  const handleCalculate = () => {
    setValidationError(null);

    const curNum = Number(currentReading);
    if (isNaN(curNum)) {
      setValidationError('Please enter a valid numeric meter reading.');
      return;
    }

    if (!isMeterReplaced && curNum < prevReading) {
      setValidationError(
        lang === 'ml'
          ? 'ഇന്നത്തെ റീഡിംഗ് കഴിഞ്ഞ റീഡിംഗിനേക്കാൾ കുറവാണ്. ദയവായി അക്കങ്ങൾ പരിശോധിക്കുക അല്ലെങ്കിൽ മീറ്റർ മാറ്റിയിരുന്നോ എന്ന് വ്യക്തമാക്കുക.'
          : 'Current reading is lower than previous reading. Check the digits or specify if your meter was replaced.'
      );
      return;
    }

    try {
      const result = predictUsage({
        previousReading: prevReading,
        currentReading: curNum,
        daysElapsed,
        totalCycleDays,
        billingCycle: totalCycleDays === 30 ? 'monthly' : 'bi-monthly',
        phase: 'single',
      });

      setPrediction(result);

      // Save to local history automatically
      storageManager.addRecord({
        dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        meterReading: curNum,
        consumedUnits: result.currentUnits,
        projectedUnits: result.projectedUnits,
        predictedBill: result.estimatedBill,
        billingCycle: totalCycleDays === 30 ? 'monthly' : 'bi-monthly',
        source: 'reading',
      });
    } catch (e: any) {
      setValidationError(e.message || 'Calculation error occurred.');
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'ബിൽ പ്രവചനം' : 'Bill Prediction'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {t.checkMeterTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {t.checkMeterSubtitle}
        </p>
      </div>

      {/* Visual Meter Guide Illustration */}
      <MeterVisualGuide currentReadingVal={currentReading} />

      {/* Reading Input Form */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Previous Reading */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t.previousReading}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={prevReading}
              onChange={e => setPrevReading(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono font-bold text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">From last KSEB bill</span>
          </div>

          {/* Current Reading */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-sky-800 flex items-center justify-between">
              <span>{t.currentReading}</span>
              <span className="text-[10px] text-sky-600 font-normal">Next to &apos;kWh&apos;</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={currentReading}
              onChange={e => setCurrentReading(e.target.value)}
              className="w-full rounded-xl border-2 border-sky-500 bg-white p-3 font-mono text-lg font-bold text-slate-900 focus:outline-none"
              placeholder="e.g. 10412"
            />
            <span className="text-[10px] text-slate-400">Recorded today</span>
          </div>
        </div>

        {/* Current Units Consumed Difference Card */}
        <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-sky-950">
              {t.electricityUsedLabel}
            </div>
            <div className="text-[11px] text-sky-800">
              {unitCalc.units} units consumed so far
            </div>
          </div>
          <div className="font-mono text-2xl font-extrabold text-sky-800 num-tabular">
            {unitCalc.units} <span className="text-xs font-medium">{t.units}</span>
          </div>
        </div>

        {/* Meter Replaced Accordion Option */}
        <div>
          <button
            type="button"
            onClick={() => setIsMeterReplaced(!isMeterReplaced)}
            className="text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
          >
            {isMeterReplaced ? '− Hide meter replacement' : `+ ${t.meterReplacedQuestion}`}
          </button>

          {isMeterReplaced && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3 text-xs">
              <p className="text-slate-600">
                If your meter was replaced during this cycle, enter the final reading of the old meter and starting reading of the new meter.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500">{t.oldMeterFinal}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={oldMeterFinal}
                    onChange={e => setOldMeterFinal(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-slate-300 p-1.5 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-500">{t.newMeterInitial}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={newMeterInitial}
                    onChange={e => setNewMeterInitial(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-slate-300 p-1.5 font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Days Elapsed in Cycle */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Billing cycle elapsed time</span>
            <span className="font-mono text-sky-700 num-tabular">
              {daysElapsed} of {totalCycleDays} days
            </span>
          </div>
          <input
            type="range"
            min="5"
            max={totalCycleDays}
            value={daysElapsed}
            onChange={e => setDaysElapsed(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>5 days into cycle</span>
            <span>Mid-cycle (30d)</span>
            <span>Full cycle (60d)</span>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Calculate CTA */}
        <button
          onClick={handleCalculate}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>{t.predictMyBill}</span>
        </button>
      </div>

      {/* RESULT SECTION IF CALCULATED */}
      {prediction && (
        <section className="space-y-6 pt-2">
          <ResultCard prediction={prediction} previousBillAmount={1148} />
        </section>
      )}

      {/* Alternative Manual Link */}
      <div className="text-center pt-2 pb-6">
        <Link
          href="/manual"
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          {lang === 'ml' ? 'യൂണിറ്റ് മാത്രം അറിയാമോ? ഇവിടെ കണക്കാക്കാം' : 'Just know your total units? Calculate directly'}
        </Link>
      </div>
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading prediction engine...</div>}>
      <PredictContent />
    </Suspense>
  );
}
