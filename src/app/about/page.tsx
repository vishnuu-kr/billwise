'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Zap, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <Zap className="h-3.5 w-3.5 text-sky-600 fill-current" />
          <span>About BILLWISE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
          {lang === 'ml' ? 'വൈദ്യുതി ബിൽ എളുപ്പത്തിൽ മനസ്സിലാക്കാം' : 'Know your KSEB bill before it arrives'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          BILLWISE is an independent consumer electricity intelligence application built to make Kerala utility bills transparent, predictable, and manageable.
        </p>
      </div>

      {/* Purpose */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h3 className="font-bold text-slate-900 text-base">
          Why we built BILLWISE
        </h3>
        <p>
          In Kerala, electricity bills arrive once every two months. Many households experience sticker shock when sudden seasonal AC usage or minor increases cross crucial thresholds — such as the <strong>240-unit subsidy cutoff</strong> or the <strong>500-unit non-telescopic cliff</strong>.
        </p>
        <p>
          Official utility portals require consumer logins, OTPs, or understanding complex tariff codes (LT-1A, telescopic slabs, fuel surcharges, Section 3 duty).
        </p>
        <p>
          BILLWISE removes all friction: <strong>Check your meter, see your bill, understand why, and know what to do.</strong>
        </p>
      </div>

      {/* Official Disclaimer Banner */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          <span>Disclaimer & Independence</span>
        </div>
        <p className="leading-relaxed">
          BILLWISE is an independent, non-governmental software tool. It is not owned, operated, or endorsed by the Kerala State Electricity Board (KSEBL) or the Kerala State Electricity Regulatory Commission (KSERC).
        </p>
        <p className="leading-relaxed">
          All calculations are independent estimates derived from public tariff schedules published by KSERC.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center pt-2 pb-6">
        <Link
          href="/predict"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
        >
          <span>{t.predictMyBill}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
