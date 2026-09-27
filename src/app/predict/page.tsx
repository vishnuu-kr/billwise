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
import { extractMeterReadingFromImage } from '@/lib/ocr/extractor';
import { MeterScanResult } from '@/types';
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
  Camera,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

function PredictContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const meterFileRef = React.useRef<HTMLInputElement>(null);

  // Meter inputs - initialize from params/storage without fake defaults
  const [prevReading, setPrevReading] = useState<number | null>(null);
  const [currentReading, setCurrentReading] = useState<string>('');
  const [daysElapsed, setDaysElapsed] = useState<number>(30);
  const [totalCycleDays, setTotalCycleDays] = useState<number>(60);
  const [previousBillAmount, setPreviousBillAmount] = useState<number | undefined>(undefined);
  
  // Meter camera scan state
  const [isScanningMeter, setIsScanningMeter] = useState<boolean>(false);
  const [meterScanResult, setMeterScanResult] = useState<MeterScanResult | null>(null);

  // Meter replacement state
  const [isMeterReplaced, setIsMeterReplaced] = useState<boolean>(false);
  const [oldMeterFinal, setOldMeterFinal] = useState<number>(10350);
  const [newMeterInitial, setNewMeterInitial] = useState<number>(0);

  // Status & results
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLowerError, setIsLowerError] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Read URL query params & saved history on initial mount
  useEffect(() => {
    const pReading = searchParams.get('prevReading');
    const cReading = searchParams.get('reading');
    const uParam = searchParams.get('units');
    const prevBillParam = searchParams.get('prevBill');

    let initialPrev: number | null = null;
    if (pReading) {
      initialPrev = Number(pReading);
      setPrevReading(initialPrev);
    } else {
      const lastSaved = storageManager.getLastReading();
      if (lastSaved) {
        initialPrev = lastSaved.reading;
        setPrevReading(initialPrev);
      }
    }

    if (cReading) {
      setCurrentReading(cReading);
    }

    if (prevBillParam) {
      setPreviousBillAmount(Number(prevBillParam));
    } else {
      const history = storageManager.getHistory();
      if (history.length > 0 && history[0].actualBill) {
        setPreviousBillAmount(history[0].actualBill);
      }
    }

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
    } else if (initialPrev !== null && cReading) {
      runCalculation(initialPrev, cReading, 30, false);
    }
  }, [searchParams]);

  const runCalculation = (
    prev: number | null,
    currStr: string,
    days: number,
    replaced: boolean
  ) => {
    setValidationError(null);
    setIsLowerError(false);

    if (prev === null) {
      setValidationError('Please enter your previous reading from your last KSEB bill.');
      setPrediction(null);
      return;
    }

    const curr = Number(currStr);
    if (isNaN(curr) || currStr.trim() === '') {
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
    } catch (e: any) {
      setValidationError(e.message || 'Error occurred calculating prediction.');
      setPrediction(null);
    }
  };

  const handleCurrentChange = (val: string) => {
    setCurrentReading(val);
    runCalculation(prevReading, val, daysElapsed, isMeterReplaced);
  };

  const handlePrevChange = (val: number | null) => {
    setPrevReading(val);
    runCalculation(val, currentReading, daysElapsed, isMeterReplaced);
  };

  const handleDaysChange = (val: number) => {
    setDaysElapsed(val);
    runCalculation(prevReading, currentReading, val, isMeterReplaced);
  };

  const handleMeterCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningMeter(true);
    try {
      const result = await extractMeterReadingFromImage(file);
      setMeterScanResult(result);
    } catch {
      setMeterScanResult({
        detectedReading: null,
        confidence: 0,
        rawText: '',
        status: 'failed',
        message: 'Could not read meter display. Please enter digits manually.',
      });
    } finally {
      setIsScanningMeter(false);
    }
  };

  const handleApplySampleData = () => {
    setPrevReading(10055);
    setCurrentReading('10295');
    setPreviousBillAmount(1148);
    runCalculation(10055, '10295', 30, false);
  };

  const currNum = Number(currentReading) || 0;
  const consumedSoFar = prevReading !== null && currNum >= prevReading ? currNum - prevReading : 0;

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
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <label htmlFor="prev-reading-input">LAST READING (On Bill)</label>
              <Link href="/scan" className="text-[11px] text-sky-600 hover:text-sky-700 font-medium">
                Scan Bill
              </Link>
            </div>
            <input
              id="prev-reading-input"
              type="number"
              inputMode="numeric"
              value={prevReading !== null ? prevReading : ''}
              onChange={e => handlePrevChange(e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 10055"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xl font-bold text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">Previous kWh number from your KSEB bill</span>
          </div>

          {/* Current Reading */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-800">
              <label htmlFor="curr-reading-input">NOW (On Meter)</label>
              <button
                type="button"
                onClick={() => meterFileRef.current?.click()}
                className="flex items-center gap-1 rounded-md bg-sky-100/70 hover:bg-sky-200/80 px-2 py-0.5 text-[11px] font-bold text-sky-800 transition-colors"
                title="Take photo of digital meter display"
              >
                <Camera className="h-3 w-3" />
                <span>{isScanningMeter ? 'Scanning...' : 'Scan Meter'}</span>
              </button>
              <input
                ref={meterFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleMeterCameraCapture}
                className="hidden"
              />
            </div>
            <input
              id="curr-reading-input"
              type="number"
              inputMode="numeric"
              value={currentReading}
              onChange={e => handleCurrentChange(e.target.value)}
              className="w-full rounded-2xl border-2 border-sky-500 bg-white p-3.5 font-mono text-2xl font-extrabold text-slate-900 focus:outline-none"
              placeholder="e.g. 10295"
            />
            <span className="text-[10px] text-slate-400">Current kWh number on your meter display</span>
          </div>
        </div>

        {/* Meter Camera OCR Result Banner (Item 10) */}
        {meterScanResult && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-sky-950">
              <span className="flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-sky-600 shrink-0" />
                {meterScanResult.message}
              </span>
              {meterScanResult.detectedReading && (
                <span className="text-[10px] bg-sky-200/90 text-sky-900 px-2 py-0.5 rounded-full font-bold">
                  {Math.round(meterScanResult.confidence * 100)}% confidence
                </span>
              )}
            </div>
            {meterScanResult.detectedReading ? (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const r = String(meterScanResult.detectedReading);
                    setCurrentReading(r);
                    if (prevReading !== null) {
                      runCalculation(prevReading, r, daysElapsed, isMeterReplaced);
                    }
                    setMeterScanResult(null);
                  }}
                  className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
                >
                  Use {meterScanResult.detectedReading.toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setMeterScanResult(null)}
                  className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Enter manually
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMeterScanResult(null)}
                className="text-xs font-semibold text-sky-700 underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Real Math Live Indicator */}
        {prevReading !== null && currentReading && !isLowerError && (
          <div className="rounded-2xl bg-sky-50/80 border border-sky-100 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 font-medium">Electricity used so far:</span>
              <div className="font-mono text-lg font-bold text-sky-900 mt-0.5">
                {consumedSoFar} units
              </div>
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              {currNum.toLocaleString()} − {prevReading.toLocaleString()} = {consumedSoFar} units
            </div>
          </div>
        )}

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
                  if (prevReading !== null) {
                    setCurrentReading(String(prevReading + 100));
                    runCalculation(prevReading, String(prevReading + 100), daysElapsed, false);
                  }
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
        {!isLowerError && prevReading !== null && (
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

        {/* Sample / Test Data Link for First-Time Users without a bill */}
        {prevReading === null && (
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={handleApplySampleData}
              className="text-xs text-slate-500 hover:text-sky-700 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Don&apos;t have your bill with you right now?</span>
              <span className="text-sky-600 font-semibold underline">Try with 240-unit sample bill</span>
            </button>
          </div>
        )}

        {validationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            {validationError}
          </div>
        )}
      </div>

      {/* RESULT SECTION */}
      {prediction && !isLowerError && (
        <section className="space-y-6 pt-2">
          <ResultCard prediction={prediction} previousBillAmount={previousBillAmount} />
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
