'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Phase, BillingCycle, ExtractedBillData } from '@/types';
import { storageManager } from '@/lib/storage';
import {
  Calculator,
  Gauge,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Info,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ManualPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  // Mode: units vs meter readings vs quick mode
  const [mode, setMode] = useState<'units' | 'readings'>('units');

  // Core values (no arbitrary hardcoded mock values)
  const [units, setUnits] = useState<string>('240');
  const [previousReading, setPreviousReading] = useState<string>('');
  const [presentReading, setPresentReading] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('bi-monthly');
  
  // Advanced technical parameters (hidden by default)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('single');
  const [connectedLoadWatts, setConnectedLoadWatts] = useState<number>(1000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper tooltip state
  const [showPhaseHelper, setShowPhaseHelper] = useState<boolean>(false);
  const [showLoadHelper, setShowLoadHelper] = useState<boolean>(false);

  // Auto-populate from any previously scanned bill in session or storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('billwise_scanned_bill');
      if (stored) {
        const parsed: ExtractedBillData = JSON.parse(stored);
        if (parsed.consumedUnits) setUnits(String(parsed.consumedUnits));
        if (parsed.previousReading) setPreviousReading(String(parsed.previousReading));
        if (parsed.presentReading) setPresentReading(String(parsed.presentReading));
        if (parsed.billingCycle) setBillingCycle(parsed.billingCycle);
        if (parsed.phase) setPhase(parsed.phase);
        if (parsed.connectedLoadWatts) setConnectedLoadWatts(parsed.connectedLoadWatts);
      } else {
        const lastReading = storageManager.getLastReading();
        if (lastReading) {
          setPreviousReading(String(lastReading.reading));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const numUnits = parseFloat(units);
  const numPrev = parseFloat(previousReading);
  const numPres = parseFloat(presentReading);

  const calculatedUnits = mode === 'units'
    ? (isNaN(numUnits) ? 0 : numUnits)
    : (!isNaN(numPres) && !isNaN(numPrev) ? Math.max(0, numPres - numPrev) : 0);

  const handleQuickCalculate = (presetUnits: number) => {
    router.push(
      `/result?units=${presetUnits}&cycle=bi-monthly&phase=single&load=1000`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'readings') {
      if (!previousReading || !presentReading || isNaN(numPrev) || isNaN(numPres)) {
        setErrorMessage('Please enter both previous and current meter readings.');
        return;
      }
      if (numPres < numPrev) {
        setErrorMessage('Current reading cannot be lower than previous reading. Please check the digits.');
        return;
      }
    } else {
      if (!units || isNaN(numUnits) || numUnits < 0) {
        setErrorMessage('Please enter a valid positive number of units.');
        return;
      }
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
          {lang === 'ml' ? 'നിങ്ങൾക്ക് എന്തറിയാം?' : 'Calculate your bill'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {lang === 'ml'
            ? 'യൂണിറ്റോ മീറ്റർ റീഡിംഗോ നൽകി നിമിഷങ്ങൾക്കകം കണക്കാക്കാം.'
            : 'No need to know tariff codes or complex utility rules.'}
        </p>
      </div>

      {/* Quick Mode 1-Tap Card */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
            <Zap className="h-4 w-4 text-sky-600 fill-current" />
            <span>{lang === 'ml' ? 'പെട്ടെന്ന് കണക്കാക്കാം (1-Tap)' : 'Quick 1-Tap Calculation'}</span>
          </div>
          <span className="text-[10px] text-sky-700 font-medium">Standard 2-month LT-1A</span>
        </div>
        <p className="text-[11px] text-slate-600">
          {lang === 'ml'
            ? 'സാധാരണ ഉപയോഗ യൂണിറ്റ് തിരഞ്ഞെടുത്ത് ഒറ്റ ടാപ്പിൽ ബിൽ കാണാം:'
            : 'Select typical consumption units to view bill breakdown instantly:'}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {[100, 150, 200, 240, 300].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleQuickCalculate(val)}
              className="rounded-xl border border-sky-200 bg-white py-2 text-xs font-mono font-bold text-sky-800 hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all shadow-2xs touch-target"
            >
              {val} {lang === 'ml' ? 'യൂണിറ്റ്' : 'u'}
            </button>
          ))}
        </div>
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
          <span>{lang === 'ml' ? 'യൂണിറ്റ് അറിയാം' : 'I know my units'}</span>
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
          <span>{lang === 'ml' ? 'റീഡിംഗ് അറിയാം' : 'I know meter readings'}</span>
        </button>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
        {mode === 'units' ? (
          /* Simple Units Input */
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              {lang === 'ml' ? 'ഉപയോഗിച്ച യൂണിറ്റുകൾ (kWh)' : 'How many units (kWh) did you use?'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="3000"
              value={units}
              onChange={e => setUnits(e.target.value)}
              className="w-full rounded-2xl border-2 border-sky-500 bg-white p-4 font-mono text-3xl font-extrabold text-slate-900 focus:outline-none"
              placeholder="e.g. 240"
            />
            {/* Quick unit pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[80, 150, 200, 240, 300, 400, 500].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnits(String(u))}
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                    units === String(u)
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {u} {t.units}
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
                  {lang === 'ml' ? 'കഴിഞ്ഞ റീഡിംഗ്' : 'Previous reading'}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 10055"
                  value={previousReading}
                  onChange={e => setPreviousReading(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sky-800">
                  {lang === 'ml' ? 'ഇപ്പോഴത്തെ റീഡിംഗ്' : 'Current reading'}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 10295"
                  value={presentReading}
                  onChange={e => setPresentReading(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-sky-500 p-3 font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {calculatedUnits > 0 && (
              <div className="rounded-xl bg-sky-50/70 p-3.5 flex items-center justify-between text-xs">
                <span className="text-sky-950 font-medium">
                  {lang === 'ml' ? 'ഉപയോഗിച്ച വൈദ്യുതി:' : 'Electricity used this cycle:'}
                </span>
                <span className="font-mono text-base font-extrabold text-sky-800 num-tabular">
                  {calculatedUnits} {t.units}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Billing Period Choice */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700">
            {lang === 'ml' ? 'ബില്ലിംഗ് കാലയളവ്' : 'Billing Period'}
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
              {lang === 'ml' ? 'രണ്ട് മാസം (സാധാരണ 60 ദിവസം)' : 'Bi-monthly (Standard 60 days)'}
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
              {lang === 'ml' ? 'ഒരു മാസം (30 ദിവസം)' : 'Monthly (30 days)'}
            </button>
          </div>
        </div>

        {/* Progressive Disclosure: Technical details with "I don't know" helpers */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-sky-700 transition-colors"
          >
            <span>{showAdvanced ? '− Hide connection options' : '+ Advanced: Phase & connected load'}</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
              {/* Phase Selection */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700">Connection Phase</label>
                  <button
                    type="button"
                    onClick={() => setShowPhaseHelper(!showPhaseHelper)}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:underline"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span>I don&apos;t know</span>
                  </button>
                </div>

                <select
                  value={phase}
                  onChange={e => setPhase(e.target.value as Phase)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-medium text-slate-800"
                >
                  <option value="single">Single phase (Most Kerala homes)</option>
                  <option value="three">Three phase</option>
                </select>

                {showPhaseHelper && (
                  <div className="mt-1.5 rounded-lg bg-sky-50 border border-sky-200 p-2.5 text-[11px] text-sky-900 leading-relaxed">
                    💡 Over 90% of Kerala residential consumers have <strong>Single Phase</strong>. Select Three Phase only if your home has multi-ton central air conditioners, industrial machinery, or a 3-phase meter with 4 wires.
                  </div>
                )}
              </div>

              {/* Connected Load */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700">Connected Load (Watts)</label>
                  <button
                    type="button"
                    onClick={() => setShowLoadHelper(!showLoadHelper)}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:underline"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span>I don&apos;t know</span>
                  </button>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={connectedLoadWatts}
                    onChange={e => setConnectedLoadWatts(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-800"
                    placeholder="e.g. 1000"
                  />
                  <button
                    type="button"
                    onClick={() => setConnectedLoadWatts(1000)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Default 1kW
                  </button>
                </div>

                {showLoadHelper && (
                  <div className="mt-1.5 rounded-lg bg-sky-50 border border-sky-200 p-2.5 text-[11px] text-sky-900 leading-relaxed">
                    💡 Standard domestic connected load in Kerala is typically <strong>1,000 W (1 kW)</strong>. In LT-1A single phase, fixed charges remain flat per billing cycle up to 10 kW.
                  </div>
                )}
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
          <span>{lang === 'ml' ? 'ബിൽ കണക്കാക്കുക' : 'Calculate Bill'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
