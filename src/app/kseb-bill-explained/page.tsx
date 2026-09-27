import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'KSEB Bill Explained — Where Does Your Electricity Money Go?',
  description: 'Understand the exact line items on your KSEB bill: Energy charges, Fixed charges, 10% Electricity Duty, Meter rent, Fuel adjustment, and Subsidies.',
  alternates: {
    canonical: 'https://billwise.app/kseb-bill-explained',
  },
};

export default function KsebBillExplainedPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <HelpCircle className="h-3.5 w-3.5 text-sky-600" />
          <span>Bill Breakdown</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Where Does Your KSEB Electricity Money Go?
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Demystifying the six component charges on every Kerala electricity bill.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">
          The 6 Line Items on Your Bill
        </h2>
        <div className="space-y-3 pt-2">
          <div className="border-l-2 border-sky-600 pl-3">
            <h3 className="font-bold text-slate-900">1. Electricity Energy Charge</h3>
            <p className="text-xs text-slate-600 mt-0.5">The units consumed multiplied by the applicable telescopic slab rates.</p>
          </div>

          <div className="border-l-2 border-indigo-500 pl-3">
            <h3 className="font-bold text-slate-900">2. Fixed Charge</h3>
            <p className="text-xs text-slate-600 mt-0.5">Standing bi-monthly fee based on your connected load bracket to maintain the grid connection.</p>
          </div>

          <div className="border-l-2 border-amber-500 pl-3">
            <h3 className="font-bold text-slate-900">3. Kerala Electricity Duty (10%)</h3>
            <p className="text-xs text-slate-600 mt-0.5">State tax under Section 3 of the Kerala Electricity Duty Act, levied at 10% on energy charges.</p>
          </div>

          <div className="border-l-2 border-slate-400 pl-3">
            <h3 className="font-bold text-slate-900">4. Fuel Adjustment Surcharge (FAC)</h3>
            <p className="text-xs text-slate-600 mt-0.5">Variable fuel cost recovery fee, usually 1 to 2 paise per unit.</p>
          </div>

          <div className="border-l-2 border-slate-400 pl-3">
            <h3 className="font-bold text-slate-900">5. Meter Rent</h3>
            <p className="text-xs text-slate-600 mt-0.5">₹12 bi-monthly fee for single-phase digital meters.</p>
          </div>

          <div className="border-l-2 border-emerald-500 pl-3">
            <h3 className="font-bold text-slate-900">6. Government Subsidy</h3>
            <p className="text-xs text-slate-600 mt-0.5">State Government assistance of up to ₹148 for domestic households using 240 units or less.</p>
          </div>
        </div>
      </section>

      <div className="text-center pt-2 pb-6">
        <Link
          href="/explain?units=240"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
        >
          <span>See interactive breakdown for 240 units</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
