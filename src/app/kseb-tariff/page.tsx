import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';
import { CURRENT_KSEB_TARIFF_VERSION } from '@/lib/tariffs/ksebTariff2024';
import { getCanonicalUrl } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'KSEB Tariff Rates & Slabs 2026 — Kerala Electricity Board Schedule',
  description: 'Complete breakdown of KSEB domestic LT-1A tariff slabs, fixed charges, 10% duty, fuel adjustments, and subsidies effective from the latest KSERC tariff order.',
  alternates: {
    canonical: getCanonicalUrl('/kseb-tariff'),
  },
};

export default function KsebTariffSeoPage() {
  const tariff = CURRENT_KSEB_TARIFF_VERSION;

  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <Layers className="h-3.5 w-3.5 text-sky-600" />
          <span>KSERC Tariff Schedule</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          KSEB Electricity Tariff & Slab Rates
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Official rate structure for Kerala domestic electricity consumers (LT-1A category).
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600">
        <h2 className="text-lg font-bold text-slate-900">
          Bi-Monthly Slabs (Effective: {tariff.effectiveFrom})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-sans">
                <th className="pb-2">Slab Range</th>
                <th className="pb-2 text-right">Rate / Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tariff.telescopicSlabsBiMonthly.map(s => (
                <tr key={s.minUnits}>
                  <td className="py-2 text-slate-800">{s.minUnits} to {s.maxUnits} units</td>
                  <td className="py-2 text-right font-bold text-sky-800">₹{s.ratePerUnit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-center pt-2 pb-6">
        <Link
          href="/tariff"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
        >
          <span>View complete interactive tariff guide</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
