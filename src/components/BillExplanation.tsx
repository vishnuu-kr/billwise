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
  HelpCircle,
} from 'lucide-react';

interface BillExplanationProps {
  calculation: BillCalculationResult;
}

export default function BillExplanation({ calculation }: BillExplanationProps) {
  const { lang, t } = useLanguage();
  const [showTechnical, setShowTechnical] = useState(false);

  const total = calculation.total || 1;
  const items = [
    {
      label: t.energyCharges,
      technicalLabel: 'Energy Charge (LT-1A Slabs)',
      amount: calculation.grossEnergyCharge,
      color: 'bg-sky-600',
      icon: Zap,
      note: calculation.isTelescopicApplied
        ? (lang === 'ml'
            ? 'ടെലിസ്കോപ്പിക് സ്ലാബ് നിരക്കുകൾ പ്രകാരം (0-80, 81-160, 161-200, 201-250 യൂണിറ്റ്).'
            : 'Billed across telescopic tiers (0-80, 81-160, 161-200, 201-250 units).')
        : (lang === 'ml'
            ? 'നോൺ-ടെലിസ്കോപ്പിക് ഫ്ലാറ്റ് നിരക്ക് ബാധകം (500 യൂണിറ്റിൽ കൂടുതൽ).'
            : 'Non-telescopic flat rate applied (consumption > 500 units bi-monthly).'),
    },
    {
      label: t.fixedCharges,
      technicalLabel: 'Fixed Charge (Connected Load Base)',
      amount: calculation.grossFixedCharge,
      color: 'bg-indigo-500',
      icon: Building,
      note: lang === 'ml'
        ? 'കണക്ഷനും വൈദ്യുതി ലൈൻ ശേഷിയും നിലനിർത്താനുള്ള രണ്ട് മാസ ചാർജ്.'
        : 'Bi-monthly charge for maintaining service connection and line capacity.',
    },
    {
      label: t.dutyCharges,
      technicalLabel: 'Kerala Electricity Duty (Section 3)',
      amount: calculation.electricityDuty,
      color: 'bg-amber-500',
      icon: Scale,
      note: lang === 'ml'
        ? 'വൈദ്യുതി ഉപയോഗത്തിന്മേൽ ഈടാക്കുന്ന 10% സംസ്ഥാന നിയമാനുസൃത നികുതി.'
        : '10% statutory state duty levied on electricity consumption.',
    },
    {
      label: t.fuelAdjustmentCharges,
      technicalLabel: 'Fuel Adjustment Surcharge (FAC)',
      amount: calculation.fuelAdjustment,
      color: 'bg-slate-400',
      icon: Fuel,
      note: lang === 'ml'
        ? 'KSERC നിർദ്ദേശപ്രകാരമുള്ള ഇന്ധന സർചാർജ്.'
        : 'Fuel cost variance adjustment per KSERC directives.',
    },
    {
      label: t.meterRentCharges,
      technicalLabel: 'Meter Rent & GST',
      amount: calculation.meterRent,
      color: 'bg-slate-400',
      icon: Gauge,
      note: lang === 'ml'
        ? 'മീറ്റർ വാടകയും ജി.എസ്.ടിയും.'
        : 'Periodic lease charge for utility meter.',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'ബിൽ വിശകലനം' : 'Bill Analysis'}
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
          {t.whereMoneyGoes}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {calculation.explanation.summary}
        </p>
      </div>

      {/* Visual Stacked Proportional Bar */}
      <div className="space-y-1.5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-sky-600 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((calculation.grossEnergyCharge / (calculation.subtotal + calculation.totalSubsidies)) * 100))}%` }}
            title="Energy Charges"
          />
          <div
            className="bg-indigo-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((calculation.grossFixedCharge / (calculation.subtotal + calculation.totalSubsidies)) * 100))}%` }}
            title="Fixed Charges"
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((calculation.electricityDuty / (calculation.subtotal + calculation.totalSubsidies)) * 100))}%` }}
            title="Electricity Duty"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-600 inline-block" />
            {lang === 'ml' ? `ഉപയോഗം (${calculation.explanation.energySharePct}%)` : `Energy (${calculation.explanation.energySharePct}%)`}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
            {lang === 'ml' ? 'ഫിക്സഡ്' : 'Fixed'}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            {lang === 'ml' ? 'ഡ്യൂട്ടി (10%)' : 'Duty (10%)'}
          </span>
        </div>
      </div>

      {/* Human Breakdown Item List */}
      <div className="divide-y divide-slate-100 space-y-1">
        {items.map(item => {
          const Icon = item.icon;
          const share = Math.round((item.amount / total) * 100);
          return (
            <div key={item.label} className="pt-3 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.note}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-slate-900 num-tabular">
                  ₹{item.amount.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'ml' ? `ബില്ലിന്റെ ${share}%` : `${share}% of bill`}
                </div>
              </div>
            </div>
          );
        })}

        {/* Subsidy row if applicable */}
        {calculation.totalSubsidies > 0 && (
          <div className="pt-3 pb-2 flex items-center justify-between text-emerald-700 bg-emerald-50/60 -mx-3 px-3 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {t.subsidiesLabel}
                </div>
                <div className="text-[11px] text-emerald-600">
                  {calculation.explanation.subsidyBenefitText}
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-sm font-bold num-tabular">
              −₹{calculation.totalSubsidies.toFixed(2)}
            </div>
          </div>
        )}

        {/* Total Row */}
        <div className="pt-4 flex items-baseline justify-between">
          <div className="text-base font-bold text-slate-900">
            {t.totalBillLabel}
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-extrabold text-slate-900 num-tabular">
              ₹{calculation.total.toLocaleString('en-IN')}
            </div>
            {calculation.roundOff !== 0 && (
              <div className="text-[10px] text-slate-400">
                (Round off {calculation.roundOff > 0 ? `+₹${calculation.roundOff.toFixed(2)}` : `−₹${Math.abs(calculation.roundOff).toFixed(2)}`})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Technical Calculation */}
      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between rounded-xl bg-slate-50 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors touch-target"
        >
          <span>{showTechnical ? t.hideTechnicalCalculation : t.viewTechnicalCalculation}</span>
          {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showTechnical && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {lang === 'ml'
                ? `സ്ലാബ് തിരിച്ചുള്ള കണക്കുകൂട്ടൽ (${calculation.effectiveTariffVersion})`
                : `Slab-by-Slab Telescopic Computation (${calculation.effectiveTariffVersion})`}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-1.5 font-medium">{lang === 'ml' ? 'സ്ലാബ് പരിധി' : 'Slab Range'}</th>
                    <th className="pb-1.5 font-medium text-center">{lang === 'ml' ? 'യൂണിറ്റ്' : 'Units'}</th>
                    <th className="pb-1.5 font-medium text-right">{lang === 'ml' ? 'നിരക്ക്' : 'Rate'}</th>
                    <th className="pb-1.5 font-medium text-right">{lang === 'ml' ? 'തുക' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {calculation.slabBreakdown.map(slab => (
                    <tr key={slab.slabIndex}>
                      <td className="py-2 text-slate-700 font-sans">{slab.label}</td>
                      <td className="py-2 text-center text-slate-800">{slab.unitsBilled}</td>
                      <td className="py-2 text-right text-slate-600">₹{slab.ratePerUnit.toFixed(2)}</td>
                      <td className="py-2 text-right font-semibold text-slate-900">₹{slab.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t border-slate-200">
                    <td className="pt-2 font-sans">{lang === 'ml' ? 'ആകെ ഉപയോഗ നിരക്ക്' : 'Gross Energy Total'}</td>
                    <td className="pt-2 text-center">{calculation.units}</td>
                    <td></td>
                    <td className="pt-2 text-right text-sky-700">₹{calculation.grossEnergyCharge.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-2">
              {lang === 'ml' ? 'സൂത്രവാക്യം:' : 'Formula:'} {calculation.explanation.formulaSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
