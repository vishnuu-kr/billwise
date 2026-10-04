import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCanonicalUrl } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'KSEB Bill Explained — Where Does Your Electricity Money Go?',
  description: 'Understand the exact line items on your KSEB bill: Energy charges, Fixed charges, 10% Electricity Duty, Meter rent, Fuel adjustment, and Subsidies.',
  alternates: {
    canonical: getCanonicalUrl('/kseb-bill-explained'),
  },
};

export default function KsebBillExplainedPage() {
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
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Bill Breakdown</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Where Does Your KSEB Electricity Money Go?
        </h1>
        <p className="text-sm text-[var(--secondary)] leading-relaxed">
          Demystifying the six component charges on every Kerala domestic electricity bill.
        </p>
      </header>

      <section className="glass-card p-5 sm:p-6 rounded-2xl space-y-4 text-xs sm:text-sm text-[var(--secondary)] leading-relaxed">
        <h2 className="text-lg sm:text-xl font-extrabold text-[var(--foreground)]">
          The 6 Line Items on Your Bill
        </h2>
        <div className="space-y-3.5 pt-2">
          <div className="border-l-2 border-[var(--accent)] pl-3.5 py-0.5">
            <h3 className="font-bold text-[var(--foreground)] text-sm">1. Electricity Energy Charge</h3>
            <p className="text-xs text-[var(--secondary)] mt-0.5 leading-relaxed">The units consumed multiplied by the applicable telescopic slab rates.</p>
          </div>

          <div className="border-l-2 border-indigo-500 pl-3.5 py-0.5">
            <h3 className="font-bold text-[var(--foreground)] text-sm">2. Fixed Charge</h3>
            <p className="text-xs text-[var(--secondary)] mt-0.5 leading-relaxed">Standing bi-monthly fee based on your connected load bracket to maintain the grid connection.</p>
          </div>

          <div className="border-l-2 border-amber-500 pl-3.5 py-0.5">
            <h3 className="font-bold text-[var(--foreground)] text-sm">3. Kerala Electricity Duty (10%)</h3>
            <p className="text-xs text-[var(--secondary)] mt-0.5 leading-relaxed">State tax under Section 3 of the Kerala Electricity Duty Act, levied at 10% on energy charges.</p>
          </div>

          <div className="border-l-2 border-[var(--tertiary)] pl-3.5 py-0.5">
            <h3 className="font-bold text-[var(--foreground)] text-sm">4. Fuel Adjustment Surcharge (FAC)</h3>
            <p className="text-xs text-[var(--secondary)] mt-0.5 leading-relaxed">Variable fuel cost recovery fee, usually 1 to 2 paise per unit.</p>
          </div>

          <div className="border-l-2 border-[var(--tertiary)] pl-3.5 py-0.5">
            <h3 className="font-bold text-[var(--foreground)] text-sm">5. Meter Rent</h3>
            <p className="text-xs text-[var(--secondary)] mt-0.5 leading-relaxed">₹12 bi-monthly fee for single-phase digital meters.</p>
          </div>

          <div className="border-l-2 border-emerald-500 pl-3.5 py-0.5">
            <h3 className="font-bold text-[var(--foreground)] text-sm">6. Government Subsidy</h3>
            <p className="text-xs text-[var(--secondary)] mt-0.5 leading-relaxed">State Government assistance of up to ₹148 for domestic households using 240 units or less.</p>
          </div>
        </div>
      </section>

      <div className="text-center pt-2 pb-6">
        <Link
          href="/explain?units=240"
          className="ios-btn-primary inline-flex items-center gap-2"
        >
          <span>See interactive breakdown for 240 units</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
