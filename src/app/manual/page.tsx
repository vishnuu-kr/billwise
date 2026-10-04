'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Phase, BillingCycle, ExtractedBillData } from '@/types';
import { storageManager } from '@/lib/storage';
import { ChevronDown, AlertCircle, ArrowRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ScrubInput } from '@/components/ui/ScrubInput';

export default function ManualPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [mode, setMode] = useState<'units' | 'readings'>('units');
  const [units, setUnits] = useState<string>('240');
  const [previousReading, setPreviousReading] = useState<string>('');
  const [presentReading, setPresentReading] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('bi-monthly');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('single');
  const [connectedLoadWatts, setConnectedLoadWatts] = useState<number>(1000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const calculatedUnits =
    mode === 'units'
      ? isNaN(numUnits) ? 0 : numUnits
      : !isNaN(numPres) && !isNaN(numPrev) ? Math.max(0, numPres - numPrev) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'readings') {
      if (!previousReading || !presentReading || isNaN(numPrev) || isNaN(numPres)) {
        setErrorMessage(lang === 'ml' ? 'കഴിഞ്ഞതും ഇപ്പോഴത്തെതുമായ റീഡിംഗുകൾ നൽകുക.' : 'Please enter both previous and current meter readings.');
        return;
      }
      if (numPres < numPrev) {
        setErrorMessage(lang === 'ml' ? 'ഇപ്പോഴത്തെ റീഡിംഗ് പഴയതിനേക്കാൾ കുറവാകാൻ കഴിയില്ല.' : 'Current reading cannot be lower than previous reading.');
        return;
      }
    } else {
      if (!units || isNaN(numUnits) || numUnits < 0) {
        setErrorMessage(lang === 'ml' ? 'സാധുവായ യൂണിറ്റ് നൽകുക.' : 'Please enter a valid positive number of units.');
        return;
      }
    }

    router.push(
      `/result?units=${calculatedUnits}&cycle=${billingCycle}&phase=${phase}&load=${connectedLoadWatts}`
    );
  };

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-5">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#71717A] hover:text-[#17171C] active:opacity-60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
      </Link>

      {/* Step 1: Selection */}
      <div className="space-y-1">
        <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider block">
          {lang === 'ml' ? 'കണക്കുകൂട്ടൽ' : 'Quick entry'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17171C]">
          {lang === 'ml' ? 'യൂണിറ്റ് നൽകുക' : 'Enter units'}
        </h1>
      </div>

      {/* Mode Segmented Control */}
      <SegmentedControl
        options={[
          { value: 'units' as const, label: lang === 'ml' ? 'യൂണിറ്റ് അറിയാം' : 'Enter units' },
          { value: 'readings' as const, label: lang === 'ml' ? 'മീറ്റർ റീഡിംഗ്' : "What's on meter" },
        ]}
        value={mode}
        onChange={(v) => { setMode(v as 'units' | 'readings'); setErrorMessage(null); }}
        className="w-full"
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-5 space-y-5">
        {mode === 'units' ? (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider block">
              {lang === 'ml' ? 'ആകെ ഉപയോഗം' : 'Total Units (kWh)'}
            </span>

            <div className="flex items-baseline gap-2">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max="4000"
                value={units}
                onChange={e => setUnits(e.target.value)}
                placeholder="240"
                aria-label={lang === 'ml' ? 'ഉപയോഗിച്ച യൂണിറ്റുകൾ' : 'Total units in kWh'}
                autoFocus
                className="num-hero text-5xl sm:text-6xl font-bold tracking-tight text-[#17171C] bg-transparent border-none outline-none w-full p-0"
              />
              <span className="text-xl font-medium text-[#71717A]">
                kWh
              </span>
            </div>

            {/* Preset Chips */}
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {[100, 160, 200, 240, 300, 400].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setUnits(String(val))}
                  className={`py-1.5 text-center rounded-lg text-[12px] font-semibold num-tabular transition-all cursor-pointer active:scale-95 ${
                    units === String(val)
                      ? 'bg-[#17171C] text-white shadow-xs'
                      : 'bg-black/[0.04] text-[#71717A] hover:bg-black/[0.08] hover:text-[#17171C]'
                  }`}
                >
                  {val}u
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider block mb-1">
                {lang === 'ml' ? 'കഴിഞ്ഞ റീഡിംഗ്' : 'Previous Reading'}
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="10055"
                value={previousReading}
                onChange={e => setPreviousReading(e.target.value)}
                aria-label={lang === 'ml' ? 'കഴിഞ്ഞ റീഡിംഗ്' : 'Previous meter reading'}
                className="num-hero text-3xl sm:text-4xl font-semibold text-[#17171C] bg-transparent border-none outline-none w-full p-0"
              />
            </div>

            <div className="pt-2 border-t border-black/[0.05]">
              <span className="text-[11px] font-semibold text-[#006FEE] uppercase tracking-wider block mb-1">
                {lang === 'ml' ? 'ഇപ്പോഴത്തെ റീഡിംഗ്' : 'Current Reading'}
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="10295"
                value={presentReading}
                onChange={e => setPresentReading(e.target.value)}
                aria-label={lang === 'ml' ? 'ഇപ്പോഴത്തെ റീഡിംഗ്' : 'Current meter reading'}
                className="num-hero text-3xl sm:text-4xl font-semibold text-[#006FEE] bg-transparent border-none outline-none w-full p-0"
              />
            </div>

            {calculatedUnits > 0 && (
              <div className="flex justify-between items-center text-[13px] pt-2 border-t border-black/[0.05]">
                <span className="text-[#71717A]">{lang === 'ml' ? 'ഉപയോഗിച്ച യൂണിറ്റുകൾ:' : 'Net consumption:'}</span>
                <span className="num-tabular text-[17px] font-bold text-[#17171C]">{calculatedUnits} kWh</span>
              </div>
            )}
          </div>
        )}

        {/* Billing Cycle Selector */}
        <div className="pt-3 border-t border-black/[0.05] space-y-2">
          <span className="text-[12px] font-medium text-[#71717A] block">
            {lang === 'ml' ? 'ബില്ലിംഗ് രീതി' : 'Billing cycle'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'bi-monthly' as const, label: lang === 'ml' ? '2 മാസം (60 ദിവ)' : 'Bi-monthly (60 days)', desc: 'Standard Kerala' },
              { value: 'monthly' as const, label: lang === 'ml' ? '1 മാസം (30 ദിവ)' : 'Monthly (30 days)', desc: 'Spot billing' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBillingCycle(opt.value)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  billingCycle === opt.value
                    ? 'border-[#17171C] bg-[#17171C] text-white shadow-xs'
                    : 'border-black/[0.08] bg-white text-[#17171C]'
                }`}
              >
                <div className="text-[13px] font-semibold">{opt.label}</div>
                <div className={`text-[11px] ${billingCycle === opt.value ? 'text-white/70' : 'text-[#71717A]'}`}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Advanced Options */}
        <div className="pt-2 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={() => setShowAdvanced(prev => !prev)}
            className="flex items-center justify-between w-full text-[13px] text-[#71717A] hover:text-[#17171C] transition-colors py-1 cursor-pointer"
          >
            <span>{lang === 'ml' ? 'കൂടുതൽ വിവരങ്ങൾ (ഫേസ്, ലോഡ്)' : 'Advanced (Phase, Load)'}</span>
            <ChevronDown
              style={{
                width: '14px',
                height: '14px',
                transform: showAdvanced ? 'rotate(180deg)' : 'none',
                transition: 'transform 150ms ease',
              }}
            />
          </button>

          {showAdvanced && (
            <div className="pt-3 space-y-4">
              <div>
                <span className="text-[11px] text-[#71717A] block mb-1.5 font-medium">Connection Phase</span>
                <SegmentedControl
                  options={[
                    { value: 'single' as const, label: 'Single Phase' },
                    { value: 'three' as const, label: 'Three Phase' },
                  ]}
                  value={phase}
                  onChange={(v) => setPhase(v as Phase)}
                  size="sm"
                />
              </div>

              <div>
                <span className="text-[11px] text-[#71717A] block mb-1.5 font-medium">Connected Load</span>
                <ScrubInput
                  value={connectedLoadWatts}
                  min={500}
                  max={15000}
                  step={100}
                  unit="W"
                  onChange={(val) => setConnectedLoadWatts(val)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="border-l-2 border-[#F31260] pl-3 py-1 text-[13px] text-[#BE123C] flex items-center gap-1.5">
            <AlertCircle style={{ width: '14px', height: '14px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="ios-btn-primary w-full"
        >
          <span>{lang === 'ml' ? 'ബിൽ കണക്കാക്കൂ' : 'Calculate bill'}</span>
          <ArrowRight style={{ width: '16px', height: '16px', marginLeft: 'auto' }} />
        </button>
      </form>
    </div>
  );
}
