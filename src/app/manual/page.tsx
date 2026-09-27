'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Phase, BillingCycle, ExtractedBillData } from '@/types';
import {
  Calculator,
  Gauge,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import Link from 'next/link';

export default function ManualPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  // Mode: units vs meter readings
  const [mode, setMode] = useState<'units' | 'readings'>('units');

  // Core values
  const [units, setUnits] = useState<number>(240);
  const [previousReading, setPreviousReading] = useState<number>(10055);
  const [presentReading, setPresentReading] = useState<number>(10295);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('bi-monthly');
  
  // Advanced technical parameters (hidden by default)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('single');
  const [connectedLoadWatts, setConnectedLoadWatts] = useState<number>(982);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-populate from any previously scanned bill in session if available
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('billwise_scanned_bill');
      if (stored) {
        const parsed: ExtractedBillData = JSON.parse(stored);
        if (parsed.consumedUnits) setUnits(parsed.consumedUnits);
        if (parsed.previousReading) setPreviousReading(parsed.previousReading);
        if (parsed.presentReading) setPresentReading(parsed.presentReading);
        if (parsed.billingCycle) setBillingCycle(parsed.billingCycle);
        if (parsed.phase) setPhase(parsed.phase);
        if (parsed.connectedLoadWatts) setConnectedLoadWatts(parsed.connectedLoadWatts);
      }
    } catch {
      // ignore
    }
  }, []);

  const calculatedUnits = mode === 'units'
    ? units
    : Math.max(0, presentReading - previousReading);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'readings' && presentReading < previousReading) {
      setErrorMessage('Current reading cannot be lower than previous reading. Please check the digits.');
      return;
    }

    if (calculatedUnits < 0 || isNaN(calculatedUnits)) {
      setErrorMessage('Please enter a valid positive number of units.');
      return;
    }

    router.push(
      `/result?units=${calculatedUnits}&cycle=${billingCycle}&phase=${phase}&load=${connectedLoadWatts}`
    );
  };

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'മാനുവൽ കണക്കുകൂട്ടൽ' : 'Manual Calculator'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {lang === 'ml' ? 'നിങ്ങൾക്ക് എന്തറിയാം?' : 'What do you know?'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          No need to look up tariff codes or connected load terminology.
        </p>
      </div>

      {/* Two Clear Choices */}
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setMode('units')}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all touch-target ${
            mode === 'units'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>I know my units</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('readings')}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all touch-target ${
            mode === 'readings'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gauge className="h-4 w-4" />
          <span>I know meter readings</span>
        </button>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
        {mode === 'units' ? (
          /* Simple Units Input */
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              How many units (kWh) did you use?
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="2500"
              value={units}
              onChange={e => setUnits(Number(e.target.value))}
              className="w-full rounded-2xl border-2 border-sky-500 bg-white p-4 font-mono text-3xl font-extrabold text-slate-900 focus:outline-none"
              placeholder="e.g. 240"
            />
            {/* Quick unit pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[80, 150, 200, 240, 300, 400, 500].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnits(u)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                    units === u ? 'bg-sky-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {u} units
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Simple Meter Readings Input */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Previous reading
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={previousReading}
                  onChange={e => setPreviousReading(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sky-800">
                  Current reading
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={presentReading}
                  onChange={e => setPresentReading(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border-2 border-sky-500 p-3 font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl bg-sky-50/70 p-3.5 flex items-center justify-between text-xs">
              <span className="text-sky-950 font-medium">Electricity used this cycle:</span>
              <span className="font-mono text-base font-extrabold text-sky-800 num-tabular">
                {calculatedUnits} {t.units}
              </span>
            </div>
          </div>
        )}

        {/* Billing Period Choice */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700">
            Billing Period
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBillingCycle('bi-monthly')}
              className={`rounded-xl border p-3 text-xs font-medium transition-all ${
                billingCycle === 'bi-monthly'
                  ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Bi-monthly (Standard 60 days)
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-xl border p-3 text-xs font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Monthly (30 days)
            </button>
          </div>
        </div>

        {/* Progressive Disclosure: Technical details (collapsed by default) */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-sky-700 transition-colors"
          >
            <span>{showAdvanced ? '− Hide connection options' : '+ Advanced: Phase & connected load'}</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
              <div>
                <label className="font-medium text-slate-600">Connection Phase</label>
                <select
                  value={phase}
                  onChange={e => setPhase(e.target.value as Phase)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-medium text-slate-800"
                >
                  <option value="single">Single phase (Most homes)</option>
                  <option value="three">Three phase</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-600">Connected Load (Watts)</label>
                <input
                  type="number"
                  value={connectedLoadWatts}
                  onChange={e => setConnectedLoadWatts(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-800"
                  placeholder="e.g. 982"
                />
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Calculate Action */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-sky-600 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
        >
          <span>Calculate Bill</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
