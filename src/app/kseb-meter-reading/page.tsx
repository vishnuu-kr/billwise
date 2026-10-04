import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Gauge, ArrowRight, ArrowLeft } from 'lucide-react';
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
    <article className="max-w-2xl mx-auto px-4 pt-3 pb-4 space-y-6">
      {/* Navigation breadcrumb */}
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
          <Gauge className="h-3.5 w-3.5" />
          <span>Meter Reading Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          How to Read Your KSEB Meter & Calculate Units
        </h1>
        <p className="text-sm text-[var(--secondary)] leading-relaxed">
          Learn what the numbers beside &apos;kWh&apos; mean, how to subtract your previous bill reading, and avoid common calculation mistakes.
        </p>
      </header>

      {/* Visual Example Card */}
      <section className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-[var(--foreground)]">
          Cumulative Reading vs Consumed Units
        </h2>
        <p className="text-xs sm:text-sm text-[var(--secondary)] leading-relaxed">
          A common point of confusion for households is mistaking the total meter number for current cycle usage. Your electricity meter records cumulative energy since installation:
        </p>

        <div className="rounded-xl bg-[var(--surface-sunken)] p-4 border border-[var(--separator)] font-mono text-[var(--foreground)] space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center py-1 border-b border-[var(--separator)]">
            <span className="text-[var(--secondary)] font-sans text-xs">Previous Reading (from last bill):</span>
            <span className="font-bold num-tabular">10,055 kWh</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-[var(--separator)]">
            <span className="text-[var(--secondary)] font-sans text-xs">Today&apos;s Reading (on meter LCD):</span>
            <span className="font-bold num-tabular">10,295 kWh</span>
          </div>
          <div className="flex justify-between items-center py-1 text-[var(--accent)] font-extrabold text-sm sm:text-base">
            <span className="font-sans text-xs font-bold text-[var(--foreground)]">Units Consumed:</span>
            <span className="num-tabular">10,295 − 10,055 = 240 units</span>
          </div>
        </div>

        <p className="text-xs text-[var(--secondary)]">
          Never enter 10,295 as your consumed units in a tariff calculator — that would calculate your bill as if you used ten thousand units in a single month!
        </p>
      </section>

      {/* 3 Steps */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-[var(--foreground)]">
          3 Steps to Check Your Meter
        </h2>

        <div className="grid gap-3">
          <div className="glass-card p-4 sm:p-5 rounded-2xl flex gap-4 items-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 font-mono text-xs font-bold text-[var(--accent)]">
              01
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Wait for the &apos;kWh&apos; Screen</h3>
              <p className="text-xs text-[var(--secondary)] leading-relaxed">
                Most KSEB digital meters cycle automatically through Voltage (V), Current (A), Maximum Demand (MD / kW), and Active Energy (kWh). Wait until the screen displays <strong className="text-[var(--foreground)]">kWh</strong>.
              </p>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl flex gap-4 items-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 font-mono text-xs font-bold text-[var(--accent)]">
              02
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Record the Whole Digits</h3>
              <p className="text-xs text-[var(--secondary)] leading-relaxed">
                Write down the main 5 or 6 digits. If your meter has a decimal point or a digit in a red border on the far right, ignore it — KSEB bills only whole units.
              </p>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl flex gap-4 items-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 font-mono text-xs font-bold text-[var(--accent)]">
              03
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Check Your Days Elapsed</h3>
              <p className="text-xs text-[var(--secondary)] leading-relaxed">
                Check the date on your last bill. If it was 30 days ago, you are halfway through your 60-day bi-monthly billing cycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Card */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-[var(--foreground)] text-base">
            Ready to predict your bill?
          </h3>
          <p className="text-xs text-[var(--secondary)] mt-1">
            Input your readings in our meter predictor for an instant expected bill range.
          </p>
        </div>
        <Link
          href="/predict"
          className="ios-btn-primary text-xs whitespace-nowrap shrink-0"
        >
          <span>Open Meter Predictor</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
