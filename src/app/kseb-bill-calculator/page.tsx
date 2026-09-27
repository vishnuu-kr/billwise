import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { getCanonicalUrl } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'KSEB Bill Calculator 2026 — Kerala Electricity Tariff LT-1A',
  description: 'Calculate your bi-monthly KSEB electricity bill using latest KSERC tariff slabs. Accurate domestic LT-1A telescopic calculation with duty and subsidies.',
  alternates: {
    canonical: getCanonicalUrl('/kseb-bill-calculator'),
  },
};

export default function KsebBillCalculatorPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'How is a KSEB bi-monthly domestic bill calculated?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'KSEB domestic LT-1A billing uses telescopic slabs for bi-monthly usage up to 500 units. Slabs include 0-80 units at ₹3.25, 81-160 at ₹4.05, 161-200 at ₹4.90, and 201-250 at ₹4.845. 10% statutory electricity duty, fixed charges, meter rent, and government subsidies are applied.',
        },
      },
      {
        '@type': 'Question',
        'name': 'What is the government subsidy limit for KSEB domestic bills?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Domestic consumers using up to 240 units in a bi-monthly billing period receive up to ₹148 in state subsidies (₹40 fixed charge rebate + up to ₹108 energy charge rebate).',
        },
      },
    ],
  };

  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <Zap className="h-3.5 w-3.5 text-sky-600 fill-current" />
          <span>Independent Consumer Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          KSEB Electricity Bill Calculator (LT-1A Domestic)
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Comprehensive guide and instant calculation tool for Kerala domestic electricity bills under the latest KSERC tariff schedule.
        </p>
      </header>

      {/* Instant Action CTA Card */}
      <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-sky-950">
            Know your next KSEB bill in under 30 seconds
          </h2>
          <p className="text-xs text-sky-800 mt-1">
            Check your meter reading or enter your units for instant prediction.
          </p>
        </div>
        <Link
          href="/predict"
          className="rounded-xl bg-sky-600 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 whitespace-nowrap"
        >
          Open Bill Calculator
        </Link>
      </div>

      {/* Guide Content */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">
          How KSEB Domestic Billing Works
        </h2>
        <p>
          In Kerala, normal household connections fall under the <strong>LT-1A (Domestic)</strong> tariff category and are billed every two months (bi-monthly).
        </p>
        <p>
          Unlike a flat rate, KSEB calculates charges across progressive telescopic tiers. For example, for a household consuming 240 units:
        </p>
        <ul className="list-disc pl-5 space-y-1 font-mono text-slate-700">
          <li>First 80 units: ₹3.25/unit = ₹260.00</li>
          <li>Next 80 units (81–160): ₹4.05/unit = ₹324.00</li>
          <li>Next 40 units (161–200): ₹4.90/unit = ₹196.00</li>
          <li>Next 40 units (201–240): ₹4.845/unit = ₹193.80</li>
        </ul>
        <p>
          Gross energy charges equal ₹973.80. Then fixed charge (₹210), electricity duty (10% = ₹97.40), meter rent (₹12), and fuel adjustment (₹2.40) are added, minus ₹148 in state subsidies, yielding a final bill of ₹1,148.
        </p>
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">What is the 500-unit non-telescopic cliff?</h3>
            <p className="mt-1 text-slate-600 leading-relaxed">
              If your bi-monthly consumption crosses 500 units (250 units/month), you lose all tiered discounts. All consumed units are charged at a higher flat rate (₹6.60+ per unit), leading to a steep increase in your bill.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Why does my estimate differ slightly from my bill?</h3>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Issued bills can show minor differences of ₹2 to ₹5 due to fuel surcharge rate fluctuations gazetted each month, exact billing cycle calendar days (58 vs 62 days), and meter rent GST fractions.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
