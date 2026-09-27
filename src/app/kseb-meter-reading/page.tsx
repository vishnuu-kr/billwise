import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Gauge, CheckCircle2, ArrowRight } from 'lucide-react';
import { getCanonicalUrl } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'How to Calculate KSEB Bill from Current Meter Reading',
  description: 'Step-by-step guide to reading your digital KSEB static electricity meter. Find your cumulative kWh, calculate units consumed, and estimate your bill.',
  alternates: {
    canonical: getCanonicalUrl('/kseb-meter-reading'),
  },
};

export default function KsebMeterReadingPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <Gauge className="h-3.5 w-3.5 text-sky-600" />
          <span>Meter Reading Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          How to Read Your KSEB Meter & Calculate Units
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Learn what the numbers beside &apos;kWh&apos; mean, how to subtract your previous bill reading, and how to verify your meter.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">
          Cumulative Reading vs Consumed Units
        </h2>
        <p>
          A common point of confusion for households is mistaking the total meter reading for current cycle usage:
        </p>
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 font-mono text-slate-800 space-y-1">
          <div>Previous Reading (on last bill): 10,055</div>
          <div>Today&apos;s Reading (on meter): 10,295</div>
          <div className="font-bold text-sky-700">Units Consumed = 10,295 − 10,055 = 240 units</div>
        </div>
        <p>
          Your electricity meter records cumulative energy since installation. Never enter 10,295 as your consumed units.
        </p>
      </section>

      <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sky-950 text-base">
            Ready to calculate your bill?
          </h3>
          <p className="text-xs text-sky-800 mt-1">
            Input your readings in our meter calculator for instant results.
          </p>
        </div>
        <Link
          href="/predict"
          className="rounded-xl bg-sky-600 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 whitespace-nowrap"
        >
          Check My Meter
        </Link>
      </div>
    </article>
  );
}
