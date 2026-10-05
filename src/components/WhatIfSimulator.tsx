'use client';

import React, { useState, useMemo, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ArrowRight, SlidersHorizontal, AlertTriangle, CheckCircle2, Sun, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { KsebOdometer } from '@/components/ui/KsebOdometer';
import { ElasticSlider } from '@/components/ui/ElasticSlider';
import { DynamicIslandBanner } from '@/components/ui/DynamicIslandBanner';
import { KsebSlabStorageMeter } from '@/components/ui/KsebSlabStorageMeter';
import { ScribbleCheckbox } from '@/components/ui/ScribbleCheckbox';
import { PullCordSwitch } from '@/components/ui/PullCordSwitch';

const SolarBalanceScale = dynamic(
  () => import('@/components/ui/SolarBalanceScale').then((m) => m.SolarBalanceScale),
  { ssr: false }
);
const SundialPicker = dynamic(
  () => import('@/components/ui/SundialPicker').then((m) => m.SundialPicker),
  { ssr: false }
);

interface WhatIfSimulatorProps {
  initialUnits?: number;
  isFromSavedHome?: boolean;
}

export default function WhatIfSimulator({ initialUnits = 240, isFromSavedHome = false }: WhatIfSimulatorProps) {
  const { lang } = useLanguage();
  const [units, setUnits] = useState<number>(initialUnits);
  const deferredUnits = useDeferredValue(units);

  // Checkbox states for energy-saving actions
  const [tip1, setTip1] = useState(false);
  const [tip2, setTip2] = useState(false);
  const [tip3, setTip3] = useState(false);

  // Solar simulation toggle
  const [showSolar, setShowSolar] = useState(false);
  const [solarUnits, setSolarUnits] = useState(180);
  const [solarHour, setSolarHour] = useState(12);

  // Skeuomorphic eco cord switch state
  const [ecoShift, setEcoShift] = useState(false);
  const handleEcoShiftToggle = (state: boolean) => {
    setEcoShift(state);
    setUnits((prev) => Math.max(40, state ? prev - 30 : prev + 30));
  };

  // Reference base calculation
  const baseCalc = useMemo(() => {
    return calculateBill({
      units: initialUnits,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });
  }, [initialUnits]);

  // Dynamic simulation calculation using deferred value for 60fps interaction
  const simCalc = useMemo(() => {
    return calculateBill({
      units: deferredUnits,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });
  }, [deferredUnits]);

  const diffRupees = simCalc.total - baseCalc.total;
  const isMore = diffRupees > 0;
  const dailyPace = (units / 60).toFixed(1);

  const presets = [120, 180, 240, 300, 360, 480];

  return (
    <div className="w-full space-y-5">
      {/* -- Dynamic Island Slab Warning ------------------------ */}
      <DynamicIslandBanner units={units} />

      {/* -- Title & Mechanical Odometer Display ---------------- */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#006FEE]" />
            <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider">
              {lang === 'ml' ? 'ഉപയോഗ മാറ്റങ്ങൾ' : 'What happens if I use...'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSolar(!showSolar)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
              showSolar
                ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                : 'bg-black/[0.04] text-zinc-600 border-transparent hover:border-black/[0.08]'
            }`}
          >
            <Sun className="size-3 text-amber-500" />
            <span>{showSolar ? 'Solar Active' : '+ Solar Prosumer'}</span>
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <KsebOdometer value={units} size="2xl" prefix="" suffix="" />
            <span className="text-xl font-medium text-[#71717A]">
              {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}
            </span>
          </div>
          <span className="text-[13px] text-[#71717A] block">
            ~{dailyPace} {lang === 'ml' ? 'യൂണിറ്റ് / ദിവസം (60-ദിവസം)' : 'units / day (60-day cycle)'}
          </span>
        </div>

        {isFromSavedHome && (
          <div className="p-3 bg-[#006FEE]/5 border border-[#006FEE]/15 rounded-xl text-[12px] flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#17171C] block">
                {lang === 'ml' ? 'നിങ്ങളുടെ നിലവിലെ ഉപയോഗം:' : 'Your current usage:'} {initialUnits} kWh
              </span>
              <span className="text-[#71717A]">
                {lang === 'ml' ? 'കഴിഞ്ഞ ബില്ലിൽ നിന്നുള്ള അടിസ്ഥാനം' : 'Anchored to your saved home'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUnits(Math.max(20, initialUnits - 20))}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 cursor-pointer active:scale-95 transition-all"
              >
                −20 kWh
              </button>
              <button
                type="button"
                onClick={() => setUnits(initialUnits + 20)}
                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] border border-amber-200 cursor-pointer active:scale-95 transition-all"
              >
                +20 kWh
              </button>
            </div>
          </div>
        )}

        {/* -- Elastic Slider with Magnetic Snap Points --------- */}
        <div className="pt-2">
          <ElasticSlider
            value={units}
            min={40}
            max={650}
            step={1}
            onChange={(val) => setUnits(val)}
            milestones={[
              { value: 100, label: '100u' },
              { value: 240, label: '240u Subsidy', isDanger: true },
              { value: 500, label: '500u Cliff', isDanger: true },
            ]}
          />

          <div className="grid grid-cols-6 gap-1.5 pt-3">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setUnits(p)}
                className={`py-1.5 text-center rounded-full text-[12px] font-semibold num-tabular transition-all cursor-pointer active:scale-95 border ${
                  units === p
                    ? 'bg-[#17171C] text-white border-[#17171C] shadow-xs'
                    : 'bg-white border-black/[0.06] text-[#71717A] hover:text-[#17171C] hover:border-black/[0.12]'
                }`}
              >
                {p}u
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -- Telescopic Slab Storage Meter Allocation ----------- */}
      <KsebSlabStorageMeter units={deferredUnits} maxScale={500} />

      {/* -- Solar Net-Metering Balance Scale & Sundial Picker ----- */}
      {showSolar && (
        <div className="space-y-4">
          <SolarBalanceScale
            gridImportKwh={units}
            solarExportKwh={solarUnits}
          />
          <SundialPicker
            selectedHour={solarHour}
            onChange={(h) => {
              setSolarHour(h);
              // Simulate daytime solar generation curve: peak at noon (12:00)
              const daylightGen = h >= 6 && h <= 18 ? Math.round(Math.sin(((h - 6) / 12) * Math.PI) * 220) : 20;
              setSolarUnits(daylightGen);
            }}
          />
        </div>
      )}

      {/* -- Result Projection Card with Odometer --------------- */}
      <div className="glass-card p-5 space-y-3">
        <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider block">
          {lang === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന ബിൽ തുക' : 'Estimated bill total'}
        </span>

        <div className="flex items-baseline">
          <KsebOdometer value={simCalc.total} size="2xl" />
        </div>

        {/* Comparison Statement */}
        {diffRupees !== 0 ? (
          <div className="flex items-center gap-2 pt-1 text-[14px]">
            {isMore ? (
              <div className="flex items-center gap-1.5 text-[#B45309] font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>+₹{Math.abs(diffRupees).toLocaleString('en-IN')}</strong>{' '}
                  {lang === 'ml'
                    ? `കൂടുതൽ (${initialUnits} യൂണിറ്റിനേക്കാൾ)`
                    : `more than baseline (${initialUnits} units)`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[#0E7036] font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  <strong>−₹{Math.abs(diffRupees).toLocaleString('en-IN')}</strong>{' '}
                  {lang === 'ml'
                    ? `ലാഭം (${initialUnits} യൂണിറ്റിനേക്കാൾ)`
                    : `saved vs baseline (${initialUnits} units)`}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-[#71717A]">
            {lang === 'ml' ? 'നിലവിലെ കണക്കിന് തുല്യം.' : 'Matches your baseline estimate.'}
          </p>
        )}
      </div>

      {/* -- Tactile Pull Cord: Instant Eco Shift ---------------- */}
      <div className="glass-card p-5 flex items-center justify-between overflow-hidden relative">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[#17171C]">
              {lang === 'ml' ? 'ഇക്കോ സ്വിച്ച്' : 'Tactile Eco Pull Cord'}
            </span>
            {ecoShift && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#17C964]/10 text-[#0E7036] border border-[#17C964]/20">
                ACTIVE −30u
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#71717A] leading-relaxed">
            {lang === 'ml'
              ? 'സ്ട്രിംഗ് താഴേക്ക് വലിച്ചു 30 യൂണിറ്റ് ലാഭിക്കുക.'
              : 'Pull cord down to instantly simulate whole-house eco shift (-30 units).'}
          </p>
        </div>
        <div className="shrink-0 -mt-2">
          <PullCordSwitch
            isOn={ecoShift}
            onToggle={handleEcoShiftToggle}
            label={ecoShift ? 'ECO ON' : 'PULL'}
            cordLength={55}
          />
        </div>
      </div>

      {/* -- Actionable Energy Saving Audit Checklist ----------- */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
          <Sparkles className="size-3.5 text-amber-500" />
          <span>Quick Energy Saving Actions</span>
        </div>

        <div className="space-y-2">
          <ScribbleCheckbox
            checked={tip1}
            onChange={(checked) => {
              setTip1(checked);
              setUnits((prev) => Math.max(40, checked ? prev - 45 : prev + 45));
            }}
            label="Shift 1 hour of AC use to ceiling fan daily"
            sublabel="Reduces ~45 units bimonthly — potential savings of ₹290+"
          />

          <ScribbleCheckbox
            checked={tip2}
            onChange={(checked) => {
              setTip2(checked);
              setUnits((prev) => Math.max(40, checked ? prev - 25 : prev + 25));
            }}
            label="Turn off electric geyser 10 minutes early"
            sublabel="Reduces ~25 units bimonthly — prevents water heating waste"
          />

          <ScribbleCheckbox
            checked={tip3}
            onChange={(checked) => {
              setTip3(checked);
              setUnits((prev) => Math.max(40, checked ? prev - 15 : prev + 15));
            }}
            label="Run motor pump outside peak hours (18:00 - 22:00)"
            sublabel="Avoids 20% peak surcharge and protects against slab jumps"
          />
        </div>
      </div>

      {/* -- Native Actions ------------------------------------- */}
      <div className="space-y-2.5 pt-1">
        <Link
          href={`/budget?target=${simCalc.total}`}
          className="ios-btn-primary w-full"
        >
          <span>{lang === 'ml' ? 'ഇതൊരു ബജറ്റ് ലക്ഷ്യമാക്കുക' : 'Set a budget for this amount'}</span>
          <ArrowRight style={{ width: '15px', height: '15px', marginLeft: 'auto' }} />
        </Link>

        <Link
          href={`/result?units=${units}`}
          className="ios-btn-secondary w-full"
        >
          <span>{lang === 'ml' ? 'പൂർണ്ണ ബിൽ വിശകലനം കാണുക' : 'View full bill breakdown'}</span>
        </Link>
      </div>
    </div>
  );
}
