'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import ProductPreviewCard from '@/components/ProductPreviewCard';
import ManglishQueryBar from '@/components/ManglishQueryBar';
import {
  Camera,
  Calculator,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const { lang, t } = useLanguage();

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-14 max-w-5xl mx-auto space-y-10 sm:space-y-14">
      {/* HERO SECTION */}
      <section className="text-center max-w-2xl mx-auto space-y-5">
        {/* Subtle Energy Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800 shadow-2xs">
          <Zap className="h-3.5 w-3.5 text-sky-600 fill-current" />
          <span>{lang === 'ml' ? 'കേരള ഗാർഹിക കണക്ഷനുകൾക്കായി (LT-1A)' : 'Kerala Domestic Connections (LT-1A)'}</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          Know your KSEB bill<br className="hidden sm:inline" /> before it arrives.
        </h1>

        {/* Supporting Copy (Exact Prompt 3 requirement) */}
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Upload your last bill, enter your latest meter reading, and see what your next bill could look like.
        </p>

        {/* Primary and Secondary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/scan"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
          >
            <Camera className="h-4 w-4" />
            <span>SCAN MY BILL</span>
          </Link>

          <Link
            href="/manual"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all touch-target"
          >
            <Calculator className="h-4 w-4 text-slate-500" />
            <span>CALCULATE MANUALLY</span>
          </Link>
        </div>

        {/* Small Honest Reassurance */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            No account required
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Free to use
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Your bill is processed securely on your device
          </span>
        </div>
      </section>

      {/* ONE BEAUTIFUL PRODUCT PREVIEW (Labeled as Example Preview) */}
      <section className="w-full max-w-xl mx-auto">
        <ProductPreviewCard interactive={true} />
      </section>

      {/* NATURAL LANGUAGE MANGLISH QUERY INPUT */}
      <section className="w-full max-w-xl mx-auto">
        <ManglishQueryBar />
      </section>

      {/* THREE SIMPLE STEPS */}
      <section className="w-full max-w-3xl mx-auto pt-4 border-t border-slate-200/80">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Three steps.
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Scan your bill. Check your meter. See your estimate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-mono font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Scan your bill
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a photo of your last KSEB bill. We find your past reading, tariff, and phase automatically.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/scan" className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                <span>Scan bill</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-mono font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Check your meter
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Look at the cumulative numbers beside &apos;kWh&apos; on your electricity meter and enter them.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/predict" className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                <span>Check meter</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-mono font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                See your estimate
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get a clear estimate of what you&apos;ll pay, your daily pace, and warnings before higher tariff slabs.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/predict" className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                <span>See estimate</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
