import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, ArrowRight, TrendingUp } from 'lucide-react';
import { getCanonicalUrl } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'KSEB Bill Predictor — Know Your Next Bill Before It Arrives',
  description: 'Predict your next KSEB electricity bill from your current meter reading and daily consumption rate. Avoid high tariff slabs and budget effectively.',
  alternates: {
    canonical: getCanonicalUrl('/kseb-bill-predictor'),
  },
};

export default function KsebBillPredictorPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <TrendingUp className="h-3.5 w-3.5 text-sky-600" />
          <span>Predictive Electricity Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          KSEB Electricity Bill Predictor
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          How to estimate your upcoming KSEB bill midway through your billing cycle and avoid crossing expensive tariff thresholds.
        </p>
      </header>

      <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-sky-950">
            Check your current meter reading now
          </h2>
          <p className="text-xs text-sky-800 mt-1">
            See your projected units, estimated bill range, and slab headroom.
          </p>
        </div>
        <Link
          href="/predict"
          className="rounded-xl bg-sky-600 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 whitespace-nowrap"
        >
          Predict My Bill
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">
          Why Predict Your Bill?
        </h2>
        <p>
          Unlike postpaid mobile plans with fixed monthly caps, Kerala electricity costs accelerate non-linearly. If your pace jumps from 3.5 units/day to 4.2 units/day during summer:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You cross the <strong>240-unit subsidy limit</strong>, immediately losing ₹148 in state rebates.</li>
          <li>Subsequent units are billed in higher tariff bands (₹5.90 to ₹7.60/unit).</li>
          <li>Your bill can jump by ₹400–₹800 for what seemed like a minor change in AC usage.</li>
        </ul>
        <p>
          BILLWISE calculates your daily run-rate and alerts you before you cross into higher pricing tiers.
        </p>
      </section>
    </article>
  );
}
