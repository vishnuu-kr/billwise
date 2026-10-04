import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, ArrowRight, ArrowLeft } from 'lucide-react';
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
    <article className="max-w-2xl mx-auto px-4 pt-3 pb-4 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--secondary)] hover:text-[var(--foreground)] active:opacity-60 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
      </div>

      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
          <Layers className="h-3.5 w-3.5" />
          <span>KSERC Tariff Schedule</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          KSEB Electricity Tariff & Slab Rates
        </h1>
        <p className="text-sm text-[var(--secondary)] leading-relaxed">
          Official rate structure for Kerala domestic electricity consumers (LT-1A category).
        </p>
      </header>

      <section className="glass-card p-5 sm:p-6 rounded-2xl space-y-4 text-xs sm:text-sm text-[var(--secondary)]">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          Bi-Monthly Slabs (Effective: {tariff.effectiveFrom})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--separator)] text-[var(--secondary)] font-sans">
                <th className="pb-2 font-medium">Slab Range</th>
                <th className="pb-2 text-right font-medium">Rate / Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--separator)]">
              {tariff.telescopicSlabsBiMonthly.map(s => (
                <tr key={s.minUnits}>
                  <td className="py-2.5 text-[var(--foreground)]">{s.minUnits} to {s.maxUnits} units</td>
                  <td className="py-2.5 text-right font-bold text-[var(--accent)] num-tabular">₹{s.ratePerUnit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-center pt-2 pb-6">
        <Link
          href="/tariff"
          className="ios-btn-primary inline-flex items-center gap-2"
        >
          <span>View complete interactive tariff guide</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
