'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { calculateBill } from '@/lib/calculation/engine';
import { calculateUniversalBill } from '@/lib/electricity/engine/universalEngine';
import { ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { TickGauge } from '@/components/ui/TickGauge';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/cn';

export interface FeaturedProvider {
  id: string;
  label: string;
  state: string;
  short: string;
  cycle: 'bi-monthly' | 'monthly';
  maxUnits: number;
  defaultUnits: number;
  presets: number[];
}

export const FEATURED_PROVIDERS: FeaturedProvider[] = [
  {
    id: 'kseb',
    label: 'Kerala (KSEB)',
    state: 'Kerala',
    short: 'KSEB',
    cycle: 'bi-monthly',
    maxUnits: 500,
    defaultUnits: 240,
    presets: [120, 180, 240, 300, 400],
  },
  {
    id: 'bescom',
    label: 'Bangalore (BESCOM)',
    state: 'Karnataka',
    short: 'BESCOM',
    cycle: 'monthly',
    maxUnits: 400,
    defaultUnits: 150,
    presets: [60, 100, 150, 200, 300],
  },
  {
    id: 'msedcl',
    label: 'Maharashtra (MSEDCL)',
    state: 'Maharashtra',
    short: 'MSEDCL',
    cycle: 'monthly',
    maxUnits: 400,
    defaultUnits: 180,
    presets: [60, 100, 180, 250, 350],
  },
  {
    id: 'tpddl',
    label: 'Delhi (TPDDL)',
    state: 'Delhi',
    short: 'Delhi',
    cycle: 'monthly',
    maxUnits: 400,
    defaultUnits: 180,
    presets: [100, 180, 200, 300, 400],
  },
  {
    id: 'tangedco',
    label: 'Tamil Nadu (TNEB)',
    state: 'Tamil Nadu',
    short: 'TNEB',
    cycle: 'bi-monthly',
    maxUnits: 500,
    defaultUnits: 200,
    presets: [100, 150, 200, 300, 400],
  },
];

interface ProductPreviewProps {
  interactive?: boolean;
  selectedProviderId?: string;
  onSelectProviderId?: (id: string) => void;
  onOpenProviderModal?: () => void;
}

export default function ProductPreviewCard({
  interactive = true,
  selectedProviderId,
  onSelectProviderId,
  onOpenProviderModal,
}: ProductPreviewProps) {
  const { lang } = useLanguage();
  const [internalProviderId, setInternalProviderId] = useState('kseb');
  const activeProviderId = selectedProviderId || internalProviderId;

  const activeProvider = useMemo(() => {
    return (
      FEATURED_PROVIDERS.find((p) => p.id === activeProviderId) || {
        id: activeProviderId,
        label: activeProviderId.toUpperCase(),
        state: 'India',
        short: activeProviderId.toUpperCase(),
        cycle: 'monthly' as const,
        maxUnits: 400,
        defaultUnits: 150,
        presets: [60, 100, 150, 200, 300],
      }
    );
  }, [activeProviderId]);

  const [units, setUnits] = useState(activeProvider.defaultUnits);

  const handleProviderSelect = (newId: string) => {
    const prov = FEATURED_PROVIDERS.find((p) => p.id === newId);
    if (onSelectProviderId) {
      onSelectProviderId(newId);
    } else {
      setInternalProviderId(newId);
    }
    if (prov) {
      setUnits(prov.defaultUnits);
    }
  };

  // Bill calculation for current preview units
  const billCalc = useMemo(() => {
    try {
      const cycle = activeProvider.cycle === 'bi-monthly' ? 'BIMONTHLY' : 'MONTHLY';
      return calculateUniversalBill({
        providerId: activeProvider.id,
        units,
        billingCycle: cycle,
        phase: 'single',
        connectedLoadKw: 1,
      });
    } catch {
      const fallback = calculateBill({
        units,
        billingCycle: 'bi-monthly',
        phase: 'single',
      });
      return {
        total: fallback.total,
      };
    }
  }, [activeProvider.id, activeProvider.cycle, units]);

  const estimatedTotal = billCalc.total;
  const rangeMin = Math.round(estimatedTotal * 0.94);
  const rangeMax = Math.round(estimatedTotal * 1.06);
  const cycleDays = activeProvider.cycle === 'bi-monthly' ? 60 : 30;
  const dailyPace = (units / cycleDays).toFixed(1);

  // Dynamic state/tariff insight
  const tariffInsight = useMemo(() => {
    if (activeProvider.id === 'kseb') {
      if (units <= 200) {
        return {
          dotClass: 'bg-[#17C964]',
          containerClass: 'bg-[#17C964]/8 border-[#17C964]/20 text-[#12793B]',
          titleClass: 'text-[#12793B]',
          title: lang === 'ml' ? 'സബ്‌സിഡി പരിധിയിൽ സുരക്ഷിതം' : 'Subsidized Tariff Band',
          desc:
            lang === 'ml'
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
          desc:
            units === 240
              ? lang === 'ml'
                ? '240 യൂണിറ്റ് പരിധിയിലെത്തി. ഇതിൽ കൂടുതൽ ഉപയോഗിച്ചാൽ സർക്കാർ സബ്‌സിഡി നഷ്ടപ്പെടും.'
                : 'Reached 240 units ceiling. Crossing 240 units ends government energy subsidy.'
              : lang === 'ml'
              ? `ഇനിയും ${240 - units} യൂണിറ്റുകൾ ബാക്കി. 240 യൂണിറ്റ് കഴിഞ്ഞാൽ സർക്കാർ സബ്‌സിഡി ലഭിക്കില്ല.`
              : `${240 - units} units remaining. Government tariff subsidy discontinues above 240 units.`,
        };
      }
      if (units <= 500) {
        return {
          dotClass: 'bg-[#006FEE]',
          containerClass: 'bg-[#006FEE]/8 border-[#006FEE]/20 text-[#005BC4]',
          titleClass: 'text-[#005BC4]',
          title: lang === 'ml' ? 'ടെലിസ്കോപ്പിക് സ്ലാബ് നിരക്ക്' : 'Standard Telescopic Tariff',
          desc:
            lang === 'ml'
              ? '240 യൂണിറ്റിന് മുകളിലുള്ള സാധാരണ നിരക്ക് ബാധകം. 500 യൂണിറ്റ് കടന്നാൽ നോൺ-ടെലിസ്കോപ്പിക് ഉയർന്ന നിരക്ക് വരും.'
              : 'Standard bi-monthly tiered billing applies. Staying under 500 units prevents non-telescopic penalty rates.',
        };
      }
      return {
        dotClass: 'bg-[#F31260] animate-pulse',
        containerClass: 'bg-[#F31260]/10 border-[#F31260]/25 text-[#A30C3E]',
        titleClass: 'text-[#A30C3E]',
        title: lang === 'ml' ? 'നോൺ-ടെലിസ്കോപ്പിക് ഉയർന്ന നിരക്ക്' : 'Non-Telescopic Penalty Slab',
        desc:
          lang === 'ml'
            ? '500 യൂണിറ്റ് കവിഞ്ഞതിനാൽ എല്ലാ യൂണിറ്റുകൾക്കും ഉയർന്ന ഫ്ലാറ്റ് നിരക്ക് ബാധകമാകുന്നു.'
            : 'Exceeded 500 units bi-monthly. All units are now billed at flat peak rate without telescopic tiering.',
      };
    }

    if (activeProvider.id === 'bescom') {
      if (units <= 200) {
        return {
          dotClass: 'bg-[#17C964]',
          containerClass: 'bg-[#17C964]/8 border-[#17C964]/20 text-[#12793B]',
          titleClass: 'text-[#12793B]',
          title: 'Gruha Jyothi Eligible (Karnataka)',
          desc: 'Karnataka Gruha Jyothi scheme provides zero-cost power up to consumer entitlement (max 200 units/month).',
        };
      }
      return {
        dotClass: 'bg-[#F5A524] animate-pulse',
        containerClass: 'bg-[#F5A524]/10 border-[#F5A524]/25 text-[#935303]',
        titleClass: 'text-[#935303]',
        title: 'Full LT-2(a) Tariff Applies',
        desc: 'Above 200 units monthly, full standard KERC energy slabs and fixed demand charges apply without Gruha Jyothi subsidy.',
      };
    }

    if (activeProvider.id === 'msedcl') {
      if (units <= 100) {
        return {
          dotClass: 'bg-[#17C964]',
          containerClass: 'bg-[#17C964]/8 border-[#17C964]/20 text-[#12793B]',
          titleClass: 'text-[#12793B]',
          title: 'MSEDCL Base Tier (0–100u)',
          desc: 'Billed at lowest Mahavitaran slab (₹3.44/unit + wheeling & FAC charges). 16% state electricity duty applies.',
        };
      }
      return {
        dotClass: 'bg-[#006FEE]',
        containerClass: 'bg-[#006FEE]/8 border-[#006FEE]/20 text-[#005BC4]',
        titleClass: 'text-[#005BC4]',
        title: 'MSEDCL Tier 2 (101–300u)',
        desc: 'Units above 100 billed at higher consumption tier (₹7.34/unit + wheeling). Keep under 100u to minimize bills.',
      };
    }

    if (activeProvider.id === 'tpddl' || activeProvider.id === 'brpl') {
      if (units <= 200) {
        return {
          dotClass: 'bg-[#17C964]',
          containerClass: 'bg-[#17C964]/8 border-[#17C964]/20 text-[#12793B]',
          titleClass: 'text-[#12793B]',
          title: 'Delhi 100% Free Power Band',
          desc: 'Households consuming ≤ 200 units monthly receive 100% domestic tariff subsidy from Delhi Government.',
        };
      }
      return {
        dotClass: 'bg-[#F5A524]',
        containerClass: 'bg-[#F5A524]/10 border-[#F5A524]/25 text-[#935303]',
        titleClass: 'text-[#935303]',
        title: 'Delhi Partial Subsidy Band (201–400u)',
        desc: 'Consumers using 201–400 units monthly get up to ₹800 subsidy. Above 400u, full commercial tariff applies.',
      };
    }

    if (activeProvider.id === 'tangedco') {
      if (units <= 100) {
        return {
          dotClass: 'bg-[#17C964]',
          containerClass: 'bg-[#17C964]/8 border-[#17C964]/20 text-[#12793B]',
          titleClass: 'text-[#12793B]',
          title: 'Tamil Nadu 100 Units Free Quota',
          desc: 'First 100 units bi-monthly are 100% free for all domestic consumers under Tamil Nadu state policy.',
        };
      }
      return {
        dotClass: 'bg-[#006FEE]',
        containerClass: 'bg-[#006FEE]/8 border-[#006FEE]/20 text-[#005BC4]',
        titleClass: 'text-[#005BC4]',
        title: 'TANGEDCO Tiered Tariff',
        desc: 'Units above 100 billed under TNERC telescopic slabs with the 100 free unit discount applied.',
      };
    }

    return {
      dotClass: 'bg-[#006FEE]',
      containerClass: 'bg-[#006FEE]/8 border-[#006FEE]/20 text-[#005BC4]',
      titleClass: 'text-[#005BC4]',
      title: `${activeProvider.short} Domestic Schedule`,
      desc: 'Billed according to official State Electricity Regulatory Commission gazetted tariffs.',
    };
  }, [activeProvider.id, activeProvider.short, units, lang]);

  const thresholdBadgeText = useMemo(() => {
    if (activeProvider.id === 'kseb') {
      return units > 500
        ? lang === 'ml'
          ? 'നോൺ-ടെലിസ്കോപ്പിക്'
          : 'Non-Telescopic'
        : lang === 'ml'
        ? 'സബ്‌സിഡി പരിധി'
        : 'Subsidy Cliff';
    }
    if (activeProvider.id === 'bescom') {
      return units > 200 ? 'Full Tariff' : 'Gruha Jyothi';
    }
    if (activeProvider.id === 'tpddl' || activeProvider.id === 'brpl') {
      return units <= 200 ? '100% Free' : 'Partial Subsidy';
    }
    if (activeProvider.id === 'msedcl') {
      return units <= 100 ? 'Base Slab' : 'Tier 2';
    }
    if (activeProvider.id === 'tangedco') {
      return units <= 100 ? '100u Free' : 'Tiered Slab';
    }
    return activeProvider.short;
  }, [activeProvider.id, activeProvider.short, units, lang]);

  return (
    <div className="space-y-4 sm:space-y-5 transition-all">
      {/* Quick State/Board Switcher Carousel */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#71717A]">
          <span className="uppercase tracking-[0.06em] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#006FEE]" />
            {lang === 'ml' ? 'വൈദ്യുതി ബോർഡ് തിരഞ്ഞെടുക്കുക' : 'Select Electricity Board'}
          </span>
          <span className="text-[#006FEE] font-medium text-[10.5px]">25+ Boards in India</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {FEATURED_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                haptics.selection();
                handleProviderSelect(p.id);
              }}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer border',
                activeProvider.id === p.id
                  ? 'bg-[#17171C] text-white border-[#17171C] shadow-xs'
                  : 'bg-black/[0.03] text-[#71717A] border-black/[0.05] hover:text-[#17171C] hover:bg-black/[0.06]'
              )}
            >
              {p.label}
            </button>
          ))}
          {onOpenProviderModal && (
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                onOpenProviderModal();
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap text-[#006FEE] bg-[#006FEE]/10 border border-[#006FEE]/20 hover:bg-[#006FEE]/15 cursor-pointer transition-all"
            >
              + All Boards...
            </button>
          )}
        </div>
      </div>

      {/* Top Header Row with Live Beacon */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006FEE] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006FEE]" />
          </span>
          <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-[0.08em]">
            {activeProvider.short} {lang === 'ml' ? 'തത്സമയ ബിൽ കണക്ക്' : 'Tariff Estimate'}
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
          value={(units / activeProvider.maxUnits) * 100}
          threshold={48}
          thresholdBadge={thresholdBadgeText}
          displayValue={estimatedTotal}
          prefix="₹"
          label={
            lang === 'ml'
              ? 'പ്രതീക്ഷിക്കുന്ന ബിൽ'
              : `Estimated ${activeProvider.cycle === 'bi-monthly' ? 'Bi-Monthly' : 'Monthly'} Bill`
          }
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
              {units} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'} / {cycleDays}d
            </span>
          </div>

          <input
            type="range"
            min={20}
            max={activeProvider.maxUnits}
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
            {activeProvider.presets.map((p) => (
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
                {p}u{p === activeProvider.defaultUnits ? '⚡' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Tariff Insight Callout — Persistent container eliminates Cumulative Layout Shift */}
      <div
        className={cn(
          'rounded-2xl border p-3.5 text-[12px] flex items-start gap-2.5 transition-colors duration-200 min-h-[72px]',
          tariffInsight.containerClass
        )}
      >
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
          href={`/predict?provider=${activeProvider.id}&units=${units}`}
          className="flex items-center justify-between text-[13px] font-semibold text-[#006FEE] hover:text-[#005BC4] active:opacity-70 transition-colors py-1 group"
        >
          <span>
            {lang === 'ml'
              ? `${activeProvider.short} മീറ്റർ റീഡിംഗ് നൽകി കണക്കാക്കാം`
              : `Calculate for my exact ${activeProvider.short} meter`}
          </span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
