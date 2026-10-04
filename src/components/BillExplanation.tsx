'use client';

import React, { useState } from 'react';
import { BillCalculationResult } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Building,
  Scale,
  Fuel,
  Gauge,
  Gift,
} from 'lucide-react';
import { KsebOdometer } from '@/components/ui/KsebOdometer';
import { KsebSlabStorageMeter } from '@/components/ui/KsebSlabStorageMeter';
import { RubberStamp } from '@/components/ui/RubberStamp';
import { DonutChart, type DonutSlice } from '@/components/ui/DonutChart';

interface BillExplanationProps {
  calculation: BillCalculationResult;
}

export default function BillExplanation({ calculation }: BillExplanationProps) {
  const { lang, t } = useLanguage();
  const [showTechnical, setShowTechnical] = useState(false);

  const grossTotal =
    calculation.grossEnergyCharge +
    calculation.grossFixedCharge +
    calculation.electricityDuty +
    calculation.fuelAdjustment +
    calculation.meterRent || 1;
  const items = [
    {
      label: t.energyCharges,
      technicalLabel: 'Energy Charge (LT-1A Slabs)',
      amount: calculation.grossEnergyCharge,
      color: 'bg-[var(--accent)]',
      icon: Zap,
      note: calculation.isTelescopicApplied
        ? (lang === 'ml'
            ? 'ടെലിസ്കോപ്പിക് സ്ലാബ് നിരക്കുകൾ (0-80, 81-160, 161-200, 201-250).'
            : 'Telescopic tiers (0-80, 81-160, 161-200, 201-250 units)')
        : (lang === 'ml'
            ? 'നോൺ-ടെലിസ്കോപ്പിക് ഫ്ലാറ്റ് നിരക്ക് (500 യൂണിറ്റിൽ കൂടുതൽ).'
            : 'Non-telescopic flat rate (> 500 units bi-monthly)'),
    },
    {
      label: t.fixedCharges,
      technicalLabel: 'Fixed Charge',
      amount: calculation.grossFixedCharge,
      color: 'bg-[var(--foreground)]',
      icon: Building,
      note: lang === 'ml'
        ? 'കണക്ഷൻ ശേഷി നിലനിർത്താനുള്ള ചാർജ്.'
        : 'Bi-monthly service connection base charge',
    },
    {
      label: t.dutyCharges,
      technicalLabel: 'Kerala Electricity Duty',
      amount: calculation.electricityDuty,
      color: 'bg-[var(--amber)]',
      icon: Scale,
      note: lang === 'ml'
        ? 'വൈദ്യുതി ഉപയോഗത്തിന്മേൽ 10% സംസ്ഥാന നികുതി.'
        : '10% statutory state duty on energy charges',
    },
    {
      label: t.fuelAdjustmentCharges,
      technicalLabel: 'Fuel Adjustment (FAC)',
      amount: calculation.fuelAdjustment,
      color: 'bg-[var(--tertiary)]',
      icon: Fuel,
      note: lang === 'ml'
        ? 'ഇന്ധന സർചാർജ് (KSERC).'
        : 'Fuel cost variance adjustment',
    },
    {
      label: t.meterRentCharges,
      technicalLabel: 'Meter Rent & GST',
      amount: calculation.meterRent,
      color: 'bg-[var(--tertiary)]',
      icon: Gauge,
      note: lang === 'ml'
        ? 'മീറ്റർ വാടകയും നികുതിയും.'
        : 'Bi-monthly meter lease and tax',
    },
  ];

  const donutSlices: DonutSlice[] = [
    {
      label: lang === 'ml' ? 'ഊർജ്ജ ചാർജ്' : 'Energy Charge',
      value: calculation.grossEnergyCharge,
      color: '#006FEE',
    },
    {
      label: lang === 'ml' ? 'ഫിക്സഡ് ചാർജ്' : 'Fixed Charge',
      value: calculation.grossFixedCharge,
      color: '#17171C',
    },
    {
      label: lang === 'ml' ? 'ഡ്യൂട്ടി (10%)' : 'Duty (10%)',
      value: calculation.electricityDuty,
      color: '#F5A524',
    },
    ...(calculation.fuelAdjustment > 0
      ? [
          {
            label: lang === 'ml' ? 'ഇന്ധന സർചാർജ്' : 'Fuel Surcharge',
            value: calculation.fuelAdjustment,
            color: '#8B5CF6',
          },
        ]
      : []),
    ...(calculation.meterRent > 0
      ? [
          {
            label: lang === 'ml' ? 'മീറ്റർ വാടക' : 'Meter Rent',
            value: calculation.meterRent,
            color: '#71717A',
          },
        ]
      : []),
  ].filter((s) => s.value > 0);

  return (
    <div className="w-full space-y-4">
      {/* Title with RubberStamp */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[22px] font-semibold text-[var(--foreground)] tracking-tight">
            {t.whereMoneyGoes}
          </h2>
          <p className="text-[13px] text-[var(--secondary)] mt-1">
            {calculation.explanation.summary}
          </p>
        </div>
        <RubberStamp text="KSERC 24-25" subtext="VERIFIED" color="emerald" />
      </div>

      {/* Telescopic Slab Storage Meter */}
      <KsebSlabStorageMeter units={calculation.units} maxScale={500} />

      {/* Interactive Proportional Cost Donut Chart */}
      <div className="bg-[var(--surface)] border border-[var(--separator)] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--secondary)] block">
              {lang === 'ml' ? 'ചിലവ് വിഭജനം' : 'Cost Breakdown'}
            </span>
            <span className="text-[12px] text-[var(--secondary)]">
              {lang === 'ml' ? 'വിഭാഗങ്ങൾ പരിശോധിക്കാൻ ടാപ്പ് ചെയ്യുക' : 'Tap any segment to inspect individual share'}
            </span>
          </div>
          <span className="text-[11px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full">
            {lang === 'ml' ? 'ഇന്ററാക്ടീവ്' : 'Interactive'}
          </span>
        </div>

        <div className="py-2 flex justify-center">
          <DonutChart
            data={donutSlices}
            label={lang === 'ml' ? 'ബിൽ ചിലവ് വിതരണം' : 'Bill Cost Breakdown'}
            totalLabel={calculation.totalSubsidies > 0 ? (lang === 'ml' ? 'ആകെ ചാർജ്ജ്' : 'Gross Charges') : (lang === 'ml' ? 'ആകെ ബിൽ' : 'Total Bill')}
            valuePrefix="₹"
            className="w-full justify-around"
          />
        </div>
      </div>

      {/* Grouped Table */}
      <div className="bg-[var(--surface)] border border-[var(--separator)] rounded-2xl divide-y divide-[var(--separator)] overflow-hidden">
        {items.map(item => {
          const Icon = item.icon;
          const share = Math.round((item.amount / grossTotal) * 100);
          return (
            <div key={item.label} className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--secondary)] shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-[var(--foreground)] truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[var(--secondary)] truncate">
                    {item.note}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-semibold text-[var(--foreground)] num-tabular">
                  ₹{item.amount.toFixed(2)}
                </div>
                <div className="text-[11px] text-[var(--tertiary)]">
                  {lang === 'ml' ? `${share}%` : `${share}%`}
                </div>
              </div>
            </div>
          );
        })}

        {/* Subsidy Row */}
        {calculation.totalSubsidies > 0 && (
          <div className="p-3.5 flex items-center justify-between gap-3 bg-[var(--surface-muted)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[var(--positive)] shrink-0">
                <Gift className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-[var(--positive)] truncate">
                  {t.subsidiesLabel}
                </div>
                <div className="text-[11px] text-[var(--positive)]/80 truncate">
                  {calculation.explanation.subsidyBenefitText}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[14px] font-semibold text-[var(--positive)] num-tabular">
                −₹{calculation.totalSubsidies.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Total row */}
        <div className="p-4 flex items-baseline justify-between bg-[var(--surface)]">
          <div className="text-[15px] font-semibold text-[var(--foreground)]">
            {t.totalBillLabel}
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end">
              <KsebOdometer value={calculation.total} size="xl" />
            </div>
            {calculation.roundOff !== 0 && (
              <div className="text-[11px] text-[var(--tertiary)]">
                {calculation.roundOff > 0 ? `+₹${calculation.roundOff.toFixed(2)}` : `−₹${Math.abs(calculation.roundOff).toFixed(2)}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Technical Calculation */}
      <div className="bg-[var(--surface)] border border-[var(--separator)] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between p-3.5 text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors touch-target"
        >
          <span>{showTechnical ? t.hideTechnicalCalculation : t.viewTechnicalCalculation}</span>
          {showTechnical ? <ChevronUp className="h-4 w-4 text-[var(--tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--tertiary)]" />}
        </button>

        {showTechnical && (
          <div className="p-4 pt-1 space-y-3 border-t border-[var(--separator)]">
            <div className="text-[11px] font-medium text-[var(--secondary)]">
              {lang === 'ml'
                ? `സ്ലാബ് തിരിച്ചുള്ള കണക്കുകൂട്ടൽ (${calculation.effectiveTariffVersion})`
                : `Slab-by-slab telescopic computation (${calculation.effectiveTariffVersion})`}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--separator)] text-[var(--secondary)]">
                    <th className="pb-2 font-medium">{lang === 'ml' ? 'സ്ലാബ് പരിധി' : 'Slab range'}</th>
                    <th className="pb-2 font-medium text-center">{lang === 'ml' ? 'യൂണിറ്റ്' : 'Units'}</th>
                    <th className="pb-2 font-medium text-right">{lang === 'ml' ? 'നിരക്ക്' : 'Rate'}</th>
                    <th className="pb-2 font-medium text-right">{lang === 'ml' ? 'തുക' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--separator)]">
                  {calculation.slabBreakdown.map(slab => (
                    <tr key={slab.slabIndex}>
                      <td className="py-2 text-[var(--secondary)]">{slab.label}</td>
                      <td className="py-2 text-center text-[var(--foreground)] num-tabular">{slab.unitsBilled}</td>
                      <td className="py-2 text-right text-[var(--secondary)] num-tabular">₹{slab.ratePerUnit.toFixed(2)}</td>
                      <td className="py-2 text-right font-medium text-[var(--foreground)] num-tabular">₹{slab.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-[var(--separator)] font-medium">
                    <td className="pt-2 text-[var(--foreground)]">{lang === 'ml' ? 'ആകെ ഉപയോഗം' : 'Gross energy total'}</td>
                    <td className="pt-2 text-center num-tabular text-[var(--foreground)]">{calculation.units}</td>
                    <td></td>
                    <td className="pt-2 text-right text-[var(--accent)] num-tabular font-semibold">₹{calculation.grossEnergyCharge.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-[var(--secondary)] leading-relaxed border-t border-[var(--separator)] pt-2.5">
              {lang === 'ml' ? 'സൂത്രവാക്യം:' : 'Formula:'} {calculation.explanation.formulaSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
