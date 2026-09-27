'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  TrendingUp,
  ArrowUpRight,
  Wind,
  Droplets,
  Flame,
  Refrigerator,
  SunMedium,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function UsagePage() {
  const { lang } = useLanguage();

  const currentUnits = 286;
  const previousUnits = 240;
  const unitDiff = currentUnits - previousUnits;
  const pctChange = Math.round((unitDiff / previousUnits) * 100);

  const contributors = [
    {
      name: 'Air Conditioner (AC)',
      nameMl: 'എയർ കണ്ടീഷണർ (AC)',
      icon: Wind,
      description: 'Extended summer night cooling or setting temperature below 24°C significantly escalates compressor run hours.',
      impact: 'High potential contributor',
    },
    {
      name: 'Water Heater / Geyser',
      nameMl: 'വാട്ടർ ഹീറ്റർ (Geyser)',
      icon: Flame,
      description: 'High wattage (2000W–3000W). Even 30 additional minutes per day can add 30–45 units to a bi-monthly cycle.',
      impact: 'Moderate contributor',
    },
    {
      name: 'Water Pump',
      nameMl: 'മോട്ടോർ പമ്പ്',
      icon: Droplets,
      description: 'Running pump during dry spells or unexpected pipe leaks.',
      impact: 'Low to moderate contributor',
    },
    {
      name: 'Seasonal Weather Factor',
      nameMl: 'കാലാവസ്ഥാ വ്യതിയാനം (ചൂട്/മഴ)',
      icon: SunMedium,
      description: 'Elevated ambient temperature causes refrigerators and inverter cooling appliances to work harder to maintain internal temperatures.',
      impact: 'Ambient impact',
    },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'ഉപയോഗ മാറ്റം' : 'Usage Analysis'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
          {lang === 'ml' ? 'ഉപയോഗത്തിൽ വന്ന മാറ്റങ്ങൾ' : 'What changed this cycle?'}
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          {lang === 'ml'
            ? 'കഴിഞ്ഞ ബില്ലിംഗ് കാലയളവുമായി ഇപ്പോഴത്തെ ഉപയോഗം താരതമ്യം ചെയ്യാം.'
            : 'Compare your current billing cycle against the previous period.'}
        </p>
      </div>

      {/* Cycle Comparison Hero Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {lang === 'ml' ? 'രണ്ട് മാസ താരതമ്യം' : 'Bi-Monthly Comparison'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
            <ArrowUpRight className="h-3.5 w-3.5" /> +{pctChange}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-sky-50/70 p-4 border border-sky-100">
            <div className="text-xs font-medium text-sky-800">
              {lang === 'ml' ? 'ഈ തവണ' : 'This Cycle'}
            </div>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 num-tabular">
              {currentUnits} <span className="text-xs font-medium text-slate-500">{lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'ml' ? 'പ്രതീക്ഷിക്കുന്നത്' : 'Estimated'}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              {lang === 'ml' ? 'കഴിഞ്ഞ തവണ' : 'Previous Cycle'}
            </div>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-extrabold text-slate-700 num-tabular">
              {previousUnits} <span className="text-xs font-medium text-slate-500">{lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'ml' ? 'മുൻ ബിൽ' : 'Reference bill'}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900">
          {lang === 'ml' ? (
            <>
              <p className="font-semibold text-amber-950">
                ഉപയോഗം {unitDiff} യൂണിറ്റുകൾ (+{pctChange}%) വർദ്ധിച്ചു.
              </p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                240 യൂണിറ്റ് കഴിഞ്ഞതിനാൽ സർക്കാർ സബ്സിഡി ഇളവ് നഷ്ടപ്പെടുകയും ബിൽ തുകയിൽ ഏകദേശം ₹298 വർദ്ധനവ് വരികയും ചെയ്തു.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-950">
                Consumption increased by {unitDiff} units (+{pctChange}%).
              </p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Crossing 240 units also transitioned your account above the government subsidy threshold, increasing your payable bill amount by approximately ₹298.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Likely Contributors Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">
          {lang === 'ml' ? 'ഉപയോഗം കൂടാൻ സാധ്യതയുള്ള കാരണങ്ങൾ' : 'Possible contributors to your increase'}
        </h3>
        <p className="text-xs text-slate-500">
          {lang === 'ml'
            ? 'കേരളത്തിലെ സാധാരണ വീടുകളിലെ വൈദ്യുതി ഉപയോഗ രീതികളെ അടിസ്ഥാനമാക്കിയുള്ളത്:'
            : 'Statistical likelihood based on typical Kerala residential consumption patterns:'}
        </p>

        <div className="space-y-2.5">
          {contributors.map(c => {
            const Icon = c.icon;
            return (
              <div
                key={c.name}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-slate-900 text-sm">
                      {lang === 'ml' ? c.nameMl : c.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {c.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-9">
                  {c.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action to Appliance Estimator */}
      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900 text-xs">
            {lang === 'ml' ? 'ഉപകരണങ്ങളുടെ കണക്ക് കൃത്യമായി അറിയണോ?' : 'Want exact appliance breakdown?'}
          </h4>
          <p className="text-[11px] text-slate-600">
            {lang === 'ml'
              ? 'നിങ്ങളുടെ വീട്ടുപകരണങ്ങളുടെ ഉപയോഗ സമയം നൽകി പരിശോധിക്കാം.'
              : 'Enter your household appliance hours in the estimator.'}
          </p>
        </div>
        <Link
          href="/appliances"
          className="rounded-xl bg-sky-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shrink-0 touch-target flex items-center justify-center"
        >
          {lang === 'ml' ? 'എസ്റ്റിമേറ്റർ തുറക്കാം' : 'Open Estimator'}
        </Link>
      </div>
    </div>
  );
}
