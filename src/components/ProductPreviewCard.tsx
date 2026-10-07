'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { calculateBill } from '@/lib/calculation/engine';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TickGauge } from '@/components/ui/TickGauge';
import { haptics } from '@/lib/haptics';

interface ProductPreviewProps {
  interactive?: boolean;
}

export default function ProductPreviewCard({ interactive = true }: ProductPreviewProps) {
  const { lang } = useLanguage();
  const [units, setUnits] = useState(240);

  // Bill calculation for current preview units
  const billCalc = calculateBill({
    units,
    billingCycle: 'bi-monthly',
    phase: 'single',
  });

  const estimatedTotal = billCalc.total;
  const rangeMin = Math.round(estimatedTotal * 0.94);
  const rangeMax = Math.round(estimatedTotal * 1.06);
  const dailyPace = (units / 60).toFixed(1);
  const unitsToNextBand = Math.max(0, 240 - units);
  const isNearThreshold = units >= 210 && units <= 240;

  const presets = [120, 180, 240, 300, 400];

  return (
    <div className="space-y-4 sm:space-y-5 transition-all">
      {/* Top Header Row with Live Beacon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006FEE] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006FEE]" />
          </span>
          <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-[0.08em]">
            {lang === 'ml' ? 'തത്സമയ പ്രവചനം' : 'Live Estimate Engine'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#71717A] px-2 py-0.5 rounded-full bg-black/[0.04] border border-black/[0.04]">
          <Sparkles className="w-2.5 h-2.5 text-[#006FEE]" />
          <span>{lang === 'ml' ? 'മാതൃക' : 'Interactive'}</span>
        </span>
      </div>

      {/* High-Precision Instrument Tick Gauge */}
      <div className="rounded-[24px] bg-gradient-to-b from-[#FFFFFF] via-[#FAFBFD] to-[#F1F4F9] p-5 border border-black/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_12px_-2px_rgba(0,0,0,0.04)] flex flex-col items-center">
        <TickGauge
          value={(units / 500) * 100}
          threshold={48}
          displayValue={estimatedTotal}
          prefix="₹"
          label={lang === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന ബിൽ' : 'Estimated Bi-Monthly Bill'}
          sublabel={`${units} ${lang === 'ml' ? 'യൂണിറ്റ്' : 'units'} · ~${dailyPace} u/day`}
        />

        {/* Dynamic Range Spectrum Bar */}
        <div className="w-full space-y-2 px-1 pt-3.5 border-t border-black/[0.06] mt-3">
          <div className="flex justify-between items-center text-[12px] text-[#71717A] num-tabular">
            <span className="font-medium">
              ₹{rangeMin.toLocaleString('en-IN')}{' '}
              <span className="text-[10px] text-[#A1A1AA]">{lang === 'ml' ? 'കുറഞ്ഞത്' : 'min'}</span>
            </span>
            <span className="text-[#006FEE] font-semibold bg-[#006FEE]/10 px-2.5 py-0.5 rounded-full text-[11px] border border-[#006FEE]/20 shadow-2xs">
              ₹{estimatedTotal.toLocaleString('en-IN')} {lang === 'ml' ? 'സാധ്യത' : 'likely'}
            </span>
            <span className="font-medium">
              ₹{rangeMax.toLocaleString('en-IN')}{' '}
              <span className="text-[10px] text-[#A1A1AA]">{lang === 'ml' ? 'കൂടിയത്' : 'max'}</span>
            </span>
          </div>

          {/* Visual Gradient Spectrum Track */}
          <div className="relative w-full h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[#17C964] via-[#006FEE] to-[#F5A524] transition-all duration-300"
              style={{
                left: `${Math.max(0, Math.min(75, ((rangeMin - 200) / 2800) * 100))}%`,
                width: `${Math.min(100, Math.max(22, ((rangeMax - rangeMin) / 2800) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      {interactive && (
        <div className="space-y-3 pt-1 border-t border-black/[0.05]">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium text-[#71717A]">
              {lang === 'ml' ? 'ഉപയോഗം ക്രമീകരിക്കാം' : 'Scrub usage'}
            </span>
            <span className="font-semibold text-[#17171C] num-tabular">
              {units} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'} / 60d
            </span>
          </div>

          <input
            type="range"
            min={40}
            max={500}
            step={10}
            value={units}
            onChange={(e) => {
              const val = Number(e.target.value);
              setUnits(val);
              if (val % 50 === 0) haptics.selection();
            }}
            className="w-full"
            aria-label="Adjust units for bill preview"
          />

          {/* Preset Chips — Pill shaped with hairline border */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {presets.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  haptics.selection();
                  setUnits(p);
                }}
                className={`py-1.5 text-center rounded-xl text-[12px] font-semibold num-tabular transition-all cursor-pointer active:scale-95 border ${
                  units === p
                    ? 'bg-[#17171C] text-white border-[#17171C] shadow-xs'
                    : 'bg-white border-black/[0.06] text-[#71717A] hover:text-[#17171C] hover:border-black/[0.12]'
                }`}
              >
                {p}u{p === 240 ? '⚡' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Threshold Warning Callout */}
      {isNearThreshold && (
        <div className="rounded-2xl bg-[#F5A524]/10 border border-[#F5A524]/25 p-3.5 text-[12px] flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#F5A524] mt-1 shrink-0 animate-pulse" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#935303] block">
              {lang === 'ml' ? '240 യൂണിറ്റ് സബ്‌സിഡി പരിധി അടുക്കുന്നു' : 'Approaching Subsidy Ceiling (240u)'}
            </span>
            <span className="text-[#935303]/90 mt-0.5 block leading-relaxed">
              {unitsToNextBand > 0
                ? (lang === 'ml'
                    ? `ഇനിയും ${unitsToNextBand} യൂണിറ്റുകൾ ബാക്കി. 240 യൂണിറ്റ് കഴിഞ്ഞാൽ സർക്കാർ സബ്‌സിഡി ലഭിക്കില്ല.`
                    : `${unitsToNextBand} units remaining. Government tariff subsidy discontinues above 240 units.`)
                : (lang === 'ml'
                    ? '240 യൂണിറ്റ് പരിധിയിലെത്തി. ഇതിൽ കൂടുതൽ ഉപയോഗിച്ചാൽ സർക്കാർ സബ്‌സിഡി നഷ്ടപ്പെടും.'
                    : 'Reached 240 units ceiling. Crossing 240 units ends government energy subsidy.')}
            </span>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-black/[0.05]">
        <Link
          href={`/predict?units=${units}`}
          className="flex items-center justify-between text-[13px] font-semibold text-[#006FEE] hover:text-[#005BC4] active:opacity-70 transition-colors py-1 group"
        >
          <span>{lang === 'ml' ? 'മീറ്റർ റീഡിംഗുമായി താരതമ്യം ചെയ്യൂ' : 'Check with your actual meter'}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
