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
import CardSkeleton from '@/components/CardSkeleton';
import {
  Zap,
  Gauge,
  Calendar,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

function PredictContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  // Meter inputs
  const [prevReading, setPrevReading] = useState<number>(10295);
  const [currentReading, setCurrentReading] = useState<string>('10412');
  const [daysElapsed, setDaysElapsed] = useState<number>(30);
  const [totalCycleDays, setTotalCycleDays] = useState<number>(60);
  
  // Meter replacement state
  const [isMeterReplaced, setIsMeterReplaced] = useState<boolean>(false);
  const [oldMeterFinal, setOldMeterFinal] = useState<number>(10350);
  const [newMeterInitial, setNewMeterInitial] = useState<number>(0);

  // Status & results
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLowerError, setIsLowerError] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Read URL query params on initial mount
  useEffect(() => {
    const pReading = searchParams.get('prevReading');
    const cReading = searchParams.get('reading');
    const uParam = searchParams.get('units');

    if (pReading) setPrevReading(Number(pReading));
    if (cReading) setCurrentReading(cReading);

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
      runCalculation(
        pReading ? Number(pReading) : 10295,
        cReading || '10412',
        30,
        false
      );
    }
  }, [searchParams]);

  const runCalculation = (
    prev: number,
    currStr: string,
    days: number,
    replaced: boolean
  ) => {
    setValidationError(null);
    setIsLowerError(false);

    const curr = Number(currStr);
    if (isNaN(curr) || currStr.trim() === '') {
      setValidationError('Please enter your current meter reading numbers.');
      setPrediction(null);
      return;
    }

    if (!replaced && curr < prev) {
      setIsLowerError(true);
      setPrediction(null);
      return;
    }

    try {
      const res = predictUsage({
        previousReading: prev,
        currentReading: curr,
        daysElapsed: days,
        totalCycleDays,
        billingCycle: totalCycleDays === 30 ? 'monthly' : 'bi-monthly',
        phase: 'single',
      });

      setPrediction(res);

      // Persist reading in local device storage
      storageManager.addRecord({
        dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        meterReading: curr,
        consumedUnits: res.currentUnits,
        projectedUnits: res.projectedUnits,
        predictedBill: res.estimatedBill,
        billingCycle: totalCycleDays === 30 ? 'monthly' : 'bi-monthly',
        source: 'reading',
      });
    } catch (e: any) {
      setValidationError(e.message || 'Error occurred calculating prediction.');
      setPrediction(null);
    }
  };

  const handleCurrentChange = (val: string) => {
    setCurrentReading(val);
    runCalculation(prevReading, val, daysElapsed, isMeterReplaced);
  };

  const handlePrevChange = (val: number) => {
    setPrevReading(val);
    runCalculation(val, currentReading, daysElapsed, isMeterReplaced);
  };

  const handleDaysChange = (val: number) => {
    setDaysElapsed(val);
    runCalculation(prevReading, currentReading, val, isMeterReplaced);
  };

  const currNum = Number(currentReading) || 0;
  const consumedSoFar = Math.max(0, currNum - prevReading);

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'മീറ്റർ പരിശോധന' : 'Step 2: Meter Reading'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {t.checkMeterTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {t.checkMeterSubtitle}
        </p>
      </div>

      {/* Visual Digital Meter Guide */}
      <MeterVisualGuide currentReadingVal={currentReading} />

      {/* The Core Meter Experience Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Readings Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Previous Reading */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              LAST READING (On Bill)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={prevReading}
              onChange={e => handlePrevChange(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xl font-bold text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">From your previous KSEB bill</span>
          </div>

          {/* Current Reading */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-sky-800 flex items-center justify-between">
              <span>NOW (On Meter)</span>
              <span className="text-[10px] text-sky-600 font-normal">Next to &apos;kWh&apos;</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={currentReading}
              onChange={e => handleCurrentChange(e.target.value)}
              className="w-full rounded-2xl border-2 border-sky-500 bg-white p-3.5 font-mono text-2xl font-extrabold text-slate-900 focus:outline-none"
              placeholder="10412"
            />
            <span className="text-[10px] text-slate-400">Digits currently on your meter</span>
          </div>
        </div>

        {/* ERROR STATE: Current < Previous */}
        {isLowerError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3 text-xs text-red-950">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-950">
                  Your new reading is lower than the previous reading.
                </h4>
                <p className="mt-1 text-red-800 leading-relaxed">
                  Your meter records cumulative electricity used, so the current reading cannot decrease unless the meter was replaced or rolled over.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 pl-7">
              <button
                type="button"
                onClick={() => {
                  setCurrentReading(String(prevReading + 100));
                  runCalculation(prevReading, String(prevReading + 100), daysElapsed, false);
                }}
                className="rounded-xl border border-red-300 bg-white px-3.5 py-2 font-semibold text-red-800 hover:bg-red-50 transition-colors"
              >
                Edit current reading
              </button>
              <button
                type="button"
                onClick={() => setIsMeterReplaced(true)}
                className="rounded-xl bg-red-700 px-3.5 py-2 font-semibold text-white hover:bg-red-800 transition-colors"
              >
                My meter was replaced
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS DERIVED CONSUMPTION (Prompt 8 requirement) */}
        {!isLowerError && (
          <div className="rounded-2xl bg-sky-50/80 border border-sky-100 p-5 space-y-2">
            <div className="text-xs font-semibold text-sky-950 uppercase tracking-wide">
              You&apos;ve used {consumedSoFar} units since your last reading
            </div>

            {/* Arithmetic clarification (secondary, kept calm) */}
            <div className="flex items-center gap-3 text-xs font-mono text-sky-900 pt-1">
              <span>{currNum.toLocaleString()} (now)</span>
              <span>−</span>
              <span>{prevReading.toLocaleString()} (last)</span>
              <span>=</span>
              <span className="font-bold text-sky-950 text-sm">
                {consumedSoFar} {t.units}
              </span>
            </div>

            <p className="text-[11px] text-sky-800/80 pt-1 leading-relaxed">
              Your meter shows total electricity recorded since installation. We calculate this period&apos;s usage by subtracting the previous reading.
            </p>
          </div>
        )}

        {/* Meter Replaced Option */}
        <div>
          <button
            type="button"
            onClick={() => setIsMeterReplaced(!isMeterReplaced)}
            className="text-xs font-semibold text-slate-500 hover:text-sky-700 transition-colors"
          >
            {isMeterReplaced ? '− Close meter replacement' : `+ Was your meter replaced recently?`}
          </button>

          {isMeterReplaced && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Enter the final units recorded on the old removed meter and starting reading on the newly installed meter:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500">Old meter final reading</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={oldMeterFinal}
                    onChange={e => {
                      setOldMeterFinal(Number(e.target.value));
                      runCalculation(prevReading, currentReading, daysElapsed, true);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-500">New meter initial reading</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={newMeterInitial}
                    onChange={e => {
                      setNewMeterInitial(Number(e.target.value));
                      runCalculation(prevReading, currentReading, daysElapsed, true);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Days Elapsed in Current Cycle */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>How many days since your last bill?</span>
            <span className="font-mono text-sky-700 num-tabular">
              {daysElapsed} of {totalCycleDays} days
            </span>
          </div>
          <input
            type="range"
            min="5"
            max={totalCycleDays}
            value={daysElapsed}
            onChange={e => handleDaysChange(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Early (5d)</span>
            <span>Halfway (~30d)</span>
            <span>Full Cycle (60d)</span>
          </div>
        </div>

        {validationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            {validationError}
          </div>
        )}
      </div>

      {/* RESULT SECTION */}
      {prediction && !isLowerError && (
        <section className="space-y-6 pt-2">
          <ResultCard prediction={prediction} previousBillAmount={1148} />
        </section>
      )}

      {/* Manual direct unit calculation link */}
      <div className="text-center pt-2 pb-6">
        <Link
          href="/manual"
          className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          {lang === 'ml' ? 'യൂണിറ്റ് നേരിട്ട് നൽകി കണക്കാക്കാം' : 'Already know your total units? Calculate directly without readings'}
        </Link>
      </div>
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10">
          <CardSkeleton title="Preparing meter prediction engine..." />
        </div>
      }
    >
      <PredictContent />
    </Suspense>
  );
}
