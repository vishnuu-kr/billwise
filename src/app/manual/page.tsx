'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { calculateBill } from '@/lib/calculation/engine';
import { Phase, BillingCycle } from '@/types';
import {
  Calculator,
  Gauge,
  ArrowRight,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function ManualPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  // Mode: units vs meter readings
  const [mode, setMode] = useState<'units' | 'readings'>('units');

  // Fields
  const [units, setUnits] = useState<number>(240);
  const [previousReading, setPreviousReading] = useState<number>(10055);
  const [presentReading, setPresentReading] = useState<number>(10295);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('bi-monthly');
  
  // Progressive disclosure technical fields
  const [showTechnical, setShowTechnical] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('single');
  const [connectedLoadWatts, setConnectedLoadWatts] = useState<number>(982);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculatedUnits = mode === 'units'
    ? units
    : Math.max(0, presentReading - previousReading);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'readings' && presentReading < previousReading) {
      setErrorMessage('Current reading cannot be lower than previous reading.');
      return;
    }

    if (calculatedUnits < 0) {
      setErrorMessage('Units cannot be negative.');
      return;
    }

    // Redirect to result page
    router.push(
      `/result?units=${calculatedUnits}&cycle=${billingCycle}&phase=${phase}&load=${connectedLoadWatts}`
    );
  };

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'മാനുവൽ കാൽക്കുലേറ്റർ' : 'Manual Entry'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {lang === 'ml' ? 'ഏതാണ് എളുപ്പം?' : 'What do you know?'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Start with what you have. No need to look up complex utility codes.
        </p>
      </div>

      {/* Mode Selector Toggle */}
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
          /* Units Input */
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              How many units (kWh) did you use?
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="2000"
              value={units}
              onChange={e => setUnits(Number(e.target.value))}
              className="w-full rounded-2xl border-2 border-sky-500 bg-white p-4 font-mono text-3xl font-extrabold text-slate-900 focus:outline-none"
              placeholder="e.g. 240"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[80, 150, 200, 240, 300, 450].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnits(u)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-700 hover:bg-slate-200"
                >
                  {u} units
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Meter Readings Input */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t.previousReading}
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
                  {t.currentReading}
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

            <div className="rounded-xl bg-sky-50/70 p-3 flex items-center justify-between text-xs">
              <span className="text-sky-950 font-medium">Derived consumption:</span>
              <span className="font-mono text-base font-extrabold text-sky-800 num-tabular">
                {calculatedUnits} {t.units}
              </span>
            </div>
          </div>
        )}

        {/* Billing Cycle Option */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700">
            {t.billingCycle}
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
              {t.biMonthly}
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
              {t.monthly}
            </button>
          </div>
        </div>

        {/* Progressive Disclosure: Technical details */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
          >
            <span>{showTechnical ? '− Hide connection technical options' : '+ Advanced: Phase & connected load'}</span>
            {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showTechnical && (
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
              <div>
                <label className="font-medium text-slate-600">{t.phase}</label>
                <select
                  value={phase}
                  onChange={e => setPhase(e.target.value as Phase)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-medium text-slate-800"
                >
                  <option value="single">Single phase (Common)</option>
                  <option value="three">Three phase</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-600">{t.connectedLoad}</label>
                <input
                  type="number"
                  value={connectedLoadWatts}
                  onChange={e => setConnectedLoadWatts(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-800"
                  placeholder="Watts (e.g. 982)"
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

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
        >
          <span>Calculate Bill</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
