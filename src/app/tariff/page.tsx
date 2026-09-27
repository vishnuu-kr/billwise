'use client';

import React from 'react';
import { CURRENT_KSEB_TARIFF_VERSION } from '@/lib/tariffs/ksebTariff2024';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  FileText,
  Calendar,
  Layers,
  Building,
  Scale,
  Gift,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function TariffPage() {
  const { lang } = useLanguage();
  const tariff = CURRENT_KSEB_TARIFF_VERSION;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <Calendar className="h-3.5 w-3.5 text-sky-600" />
          <span>Effective from: {tariff.effectiveFrom} (Active Schedule)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
          {lang === 'ml' ? 'KSEB വൈദ്യുതി നിരക്കുകൾ എങ്ങനെ പ്രവർത്തിക്കുന്നു?' : 'How KSEB electricity pricing works'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Kerala State Electricity Regulatory Commission (KSERC) domestic LT-1A tariff rules explained in plain language without utility jargon.
        </p>
      </div>

      {/* Visual Explanation Concept 1: Telescopic vs Non-Telescopic */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Layers className="h-4 w-4 text-sky-600" />
          <span>Core Concept</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Telescopic Slabs vs The 500-Unit Cliff
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          For most households, KSEB bills bi-monthly (every two months). If your total consumption is <strong>500 units or less</strong>, you enjoy <strong>telescopic billing</strong> — your first 80 units are billed at the cheapest rate (₹3.25), the next 80 at ₹4.05, and so on.
        </p>

        <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>The 500-unit cliff:</strong> If your bi-monthly usage reaches 501 units, you lose all telescopic benefits. Every single unit from unit 1 is billed at a flat rate of ₹6.60 or more.
          </p>
        </div>
      </div>

      {/* Bi-monthly Telescopic Slabs Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">
            Bi-Monthly Energy Slabs (Up to 500 units)
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">LT-1A Domestic</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="pb-2">Bi-Monthly Slab</th>
                <th className="pb-2">Monthly Equivalent</th>
                <th className="pb-2 text-right">Energy Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {tariff.telescopicSlabsBiMonthly.map(slab => (
                <tr key={slab.minUnits} className="hover:bg-slate-50/60">
                  <td className="py-2.5 font-sans text-slate-800 font-medium">
                    {slab.minUnits} – {slab.maxUnits} units
                  </td>
                  <td className="py-2.5 text-slate-500 font-sans">
                    {Math.round(slab.minUnits / 2)} – {Math.round((slab.maxUnits ?? 0) / 2)} units/mo
                  </td>
                  <td className="py-2.5 text-right font-bold text-sky-800">
                    ₹{slab.ratePerUnit.toFixed(2)} / unit
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Government Subsidies Explained */}
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <Gift className="h-4 w-4 text-emerald-700" />
          <span>Kerala Government Domestic Subsidy</span>
        </div>
        <h3 className="text-lg font-bold text-emerald-950">
          Subsidies up to 240 units
        </h3>
        <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
          Eligible domestic consumers using up to 240 units bi-monthly receive:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-950">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span><strong>₹40 Fixed Charge Subsidy</strong> (reduces standard ₹210 fixed charge to ₹170).</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span><strong>Up to ₹108 Energy Rebate</strong> (subsidised at ₹0.45/unit).</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span><strong>Total benefit: ₹148</strong> directly deducted on your bill.</span>
          </li>
        </ul>
      </div>

      {/* Statutory Charges: Duty, Meter Rent, Fixed Charges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5">
          <Scale className="h-5 w-5 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-xs">Electricity Duty</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Statutory 10% levied on electricity consumed (Kerala Electricity Duty Act).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5">
          <Building className="h-5 w-5 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-xs">Fixed Charge</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Bi-monthly charge ranging from ₹70 to ₹380 depending on consumption tier.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5">
          <FileText className="h-5 w-5 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-xs">Fuel Surcharge (FAC)</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Periodic fuel cost variance (1 to 2 paise per unit) approved by KSERC.
          </p>
        </div>
      </div>

      {/* Link to Simulator */}
      <div className="text-center pt-2 pb-6">
        <Link
          href="/what-if"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
        >
          <span>Test these slabs on the What-If Simulator</span>
        </Link>
      </div>
    </div>
  );
}
