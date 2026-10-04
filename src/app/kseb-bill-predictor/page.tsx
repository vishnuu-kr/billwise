import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react';
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
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Predictive Electricity Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          KSEB Electricity Bill Predictor
        </h1>
        <p className="text-sm text-[var(--secondary)] leading-relaxed">
          How to estimate your upcoming KSEB bill midway through your billing cycle and avoid crossing expensive tariff thresholds.
        </p>
      </header>

      <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">
            Check your current meter reading now
          </h2>
          <p className="text-xs text-[var(--secondary)] mt-1">
            See your projected units, estimated bill range, and slab headroom.
          </p>
        </div>
        <Link
          href="/predict"
          className="ios-btn-primary text-xs whitespace-nowrap shrink-0"
        >
          <span>Predict My Bill</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="glass-card p-5 sm:p-6 rounded-2xl space-y-4 text-xs sm:text-sm text-[var(--secondary)] leading-relaxed">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
          Why Predict Your Bill?
        </h2>
        <p>
          Unlike postpaid mobile plans with fixed monthly caps, Kerala electricity costs accelerate non-linearly. If your pace jumps from 3.5 units/day to 4.2 units/day during summer:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--foreground)]">
          <li>You cross the <strong className="text-[var(--foreground)]">240-unit subsidy limit</strong>, immediately losing ₹148 in state rebates.</li>
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
