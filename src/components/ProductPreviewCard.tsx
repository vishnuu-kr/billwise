'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { calculateBill } from '@/lib/calculation/engine';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TickGauge } from '@/components/ui/TickGauge';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/cn';

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

  const tariffInsight = useMemo(() => {
    if (units <= 200) {
      return {
        dotClass: 'bg-[#17C964]',
        containerClass: 'bg-[#17C964]/8 border-[#17C964]/20 text-[#12793B]',
        titleClass: 'text-[#12793B]',
        title: lang === 'ml' ? 'സബ്‌സിഡി പരിധിയിൽ സുരക്ഷിതം' : 'Subsidized Tariff Band',
        desc: lang === 'ml'
          ? `240 യൂണിറ്റ് സബ്‌സിഡി പരിധിയിലേക്ക് ഇനിയും ${240 - units} യൂണിറ്റ് സുരക്ഷിത മാർജിൻ ഉണ്ട്.`
          : `Enjoying lowest subsidized telescopic slabs. ${240 - units} units buffer until subsidy ceiling.`,
      };
    }
    if (units <= 240) {
      return {
        dotClass: 'bg-[#F5A524] animate-pulse',
        containerClass: 'bg-[#F5A524]/10 border-[#F5A524]/25 text-[#935303]',
        titleClass: 'text-[#935303]',
        title: lang === 'ml' ? '240 യൂണിറ്റ് സബ്‌സിഡി പരിധി അടുക്കുന്നു' : 'Approaching Subsidy Ceiling (240u)',
        desc: units === 240
          ? (lang === 'ml'
              ? '240 യൂണിറ്റ് പരിധിയിലെത്തി. ഇതിൽ കൂടുതൽ ഉപയോഗിച്ചാൽ സർക്കാർ സബ്‌സിഡി നഷ്ടപ്പെടും.'
              : 'Reached 240 units ceiling. Crossing 240 units ends government energy subsidy.')
          : (lang === 'ml'
              ? `ഇനിയും ${240 - units} യൂണിറ്റുകൾ ബാക്കി. 240 യൂണിറ്റ് കഴിഞ്ഞാൽ സർക്കാർ സബ്‌സിഡി ലഭിക്കില്ല.`
              : `${240 - units} units remaining. Government tariff subsidy discontinues above 240 units.`),
      };
    }
    if (units <= 500) {
      return {
        dotClass: 'bg-[#006FEE]',
        containerClass: 'bg-[#006FEE]/8 border-[#006FEE]/20 text-[#005BC4]',
        titleClass: 'text-[#005BC4]',
        title: lang === 'ml' ? 'ടെലിസ്കോപ്പിക് സ്ലാബ് നിരക്ക്' : 'Standard Telescopic Tariff',
        desc: lang === 'ml'
          ? `240 യൂണിറ്റിന് മുകളിലുള്ള സാധാരണ നിരക്ക് ബാധകം. 500 യൂണിറ്റ് കടന്നാൽ നോൺ-ടെലിസ്കോപ്പിക് ഉയർന്ന നിരക്ക് വരും.`
          : `Standard bi-monthly tiered billing applies. Staying under 500 units prevents non-telescopic penalty rates.`,
      };
    }
    return {
      dotClass: 'bg-[#F31260] animate-pulse',
      containerClass: 'bg-[#F31260]/10 border-[#F31260]/25 text-[#A30C3E]',
      titleClass: 'text-[#A30C3E]',
      title: lang === 'ml' ? 'നോൺ-ടെലിസ്കോപ്പിക് ഉയർന്ന നിരക്ക്' : 'Non-Telescopic Penalty Slab',
      desc: lang === 'ml'
        ? `500 യൂണിറ്റ് കവിഞ്ഞതിനാൽ എല്ലാ യൂണിറ്റുകൾക്കും ഉയർന്ന ഫ്ലാറ്റ് നിരക്ക് ബാധകമാകുന്നു.`
        : `Exceeded 500 units bi-monthly. All units are now billed at flat peak rate without telescopic tiering.`,
    };
  }, [units, lang]);

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
            {lang === 'ml' ? 'തത്സമയ ബിൽ കണക്ക്' : 'KSEB Tariff Estimate'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#71717A] px-2 py-0.5 rounded-full bg-black/[0.04] border border-black/[0.04]">
          <Sparkles className="w-2.5 h-2.5 text-[#006FEE]" />
          <span>{lang === 'ml' ? 'മാതൃക' : 'Live Preview'}</span>
        </span>
      </div>

      {/* High-Precision Instrument Tick Gauge */}
      <div className="rounded-[24px] bg-gradient-to-b from-[#FFFFFF] via-[#FAFBFD] to-[#F1F4F9] p-5 border border-black/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_12px_-2px_rgba(0,0,0,0.04)] flex flex-col items-center">
        <TickGauge
          value={(units / 500) * 100}
          threshold={48}
          thresholdBadge={units > 500 ? (lang === 'ml' ? 'നോൺ-ടെലിസ്കോപ്പിക്' : 'Non-Telescopic') : (lang === 'ml' ? 'സബ്‌സിഡി പരിധി' : 'Subsidy Cliff')}
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
              {lang === 'ml' ? 'ഉപയോഗം മാറ്റാം' : 'Adjust usage'}
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

      {/* Dynamic Tariff Insight Callout — Persistent container eliminates Cumulative Layout Shift */}
      <div className={cn('rounded-2xl border p-3.5 text-[12px] flex items-start gap-2.5 transition-colors duration-200 min-h-[72px]', tariffInsight.containerClass)}>
        <div className={cn('w-2 h-2 rounded-full mt-1 shrink-0', tariffInsight.dotClass)} />
        <div className="space-y-0.5 min-w-0">
          <span className={cn('font-semibold block text-[12px]', tariffInsight.titleClass)}>
            {tariffInsight.title}
          </span>
          <span className="opacity-90 block leading-relaxed text-[11.5px]">
            {tariffInsight.desc}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-black/[0.05]">
        <Link
          href={`/predict?units=${units}`}
          className="flex items-center justify-between text-[13px] font-semibold text-[#006FEE] hover:text-[#005BC4] active:opacity-70 transition-colors py-1 group"
        >
          <span>{lang === 'ml' ? 'കൃത്യമായ മീറ്റർ റീഡിംഗ് നൽകി കണക്കാക്കാം' : 'Calculate for my exact meter'}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
