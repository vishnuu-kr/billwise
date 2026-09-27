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
  Sparkles,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const { lang, t } = useLanguage();

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 pt-6 sm:pt-12 max-w-5xl mx-auto space-y-10 sm:space-y-14">
      {/* HERO SECTION */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        {/* Subtle Pill Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 shadow-xs">
          <Zap className="h-3.5 w-3.5 text-sky-600 fill-current" />
          <span>{lang === 'ml' ? 'കേരള ഗാർഹിക ഉപഭോക്താക്കൾക്കായി' : 'For Kerala Domestic Connections (LT-1A)'}</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          {t.tagline}
        </h1>

        {/* Supporting Copy */}
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>

        {/* Primary and Secondary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href="/scan"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
          >
            <Camera className="h-4 w-4" />
            <span>{t.scanMyBill}</span>
          </Link>

          <Link
            href="/manual"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all touch-target"
          >
            <Calculator className="h-4 w-4 text-slate-500" />
            <span>{t.calculateManually}</span>
          </Link>
        </div>

        {/* Small Trust Reassurance */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {t.noAccount}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {t.freeToUse}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {t.secureLocal}
          </span>
        </div>
      </section>

      {/* REALISTIC LIVE PRODUCT PREVIEW CARD */}
      <section className="w-full max-w-xl mx-auto">
        <ProductPreviewCard interactive={true} />
      </section>

      {/* MANGLISH CONVERSATIONAL QUICK QUERY */}
      <section className="w-full max-w-xl mx-auto">
        <ManglishQueryBar />
      </section>

      {/* THREE SIMPLE STEPS */}
      <section className="w-full max-w-3xl mx-auto pt-4 border-t border-slate-200/80">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {lang === 'ml' ? 'പ്രവർത്തന രീതി' : 'How it works'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {lang === 'ml' ? 'ലളിതമായ 3 ഘട്ടങ്ങൾ' : 'Know your bill in three simple steps'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-mono font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {t.step1Title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.step1Desc}
              </p>
            </div>
            <div className="pt-4">
              <Link href="/scan" className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                <span>{t.scanMyBill}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-mono font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {t.step2Title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.step2Desc}
              </p>
            </div>
            <div className="pt-4">
              <Link href="/predict" className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                <span>{lang === 'ml' ? 'റീഡിംഗ് പരിശോധിക്കാം' : 'Check Reading'}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-mono font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {t.step3Title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.step3Desc}
              </p>
            </div>
            <div className="pt-4">
              <Link href="/predict" className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                <span>{t.predictMyBill}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK FEATURE LAUNCHPAD */}
      <section className="w-full max-w-xl mx-auto rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'കൂടുതൽ സഹായങ്ങൾ' : 'Electricity Intelligence Tools'}
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
          <Link
            href="/what-if"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {lang === 'ml' ? 'ഉപയോഗ സിമുലേറ്റർ' : 'What-If Simulator'}
          </Link>
          <Link
            href="/budget"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {lang === 'ml' ? 'ബജറ്റ് കൺട്രോൾ' : 'Budget Mode'}
          </Link>
          <Link
            href="/appliances"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {lang === 'ml' ? 'ഉപകരണ എസ്റ്റിമേറ്റർ' : 'Appliance Estimator'}
          </Link>
          <Link
            href="/tariff"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {lang === 'ml' ? 'KSEB താരിഫ് ഗൈഡ്' : 'Tariff Slabs Guide'}
          </Link>
        </div>
      </section>
    </div>
  );
}
