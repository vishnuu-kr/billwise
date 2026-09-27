'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Zap,
  ShieldCheck,
  Lock,
  Cpu,
  EyeOff,
  Database,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const { lang, t } = useLanguage();

  const principles = [
    {
      step: '1',
      title: 'No Login or Personal ID Required',
      titleMl: 'ലോഗിൻ ആവശ്യമില്ല; വിവരങ്ങൾ ശേഖരിക്കുന്നില്ല',
      icon: EyeOff,
      description:
        'BILLWISE never asks for your 13-digit consumer number, phone number, email address, or billing password. Anyone can calculate or predict immediately without creating an account.',
      descriptionMl:
        'നിങ്ങളുടെ 13 അക്ക കൺസ്യൂമർ നമ്പറോ ഫോൺ നമ്പറോ ഇമെയിലോ ഞങ്ങൾ ചോദിക്കുന്നില്ല. അക്കൗണ്ട് ഇല്ലാതെ തന്നെ ആർക്കും ഉപയോഗിക്കാം.',
    },
    {
      step: '2',
      title: 'Pure Deterministic Client-Side Math',
      titleMl: 'സുതാര്യമായ ഗണിത നിയമങ്ങൾ',
      icon: Cpu,
      description:
        'Calculations use pure functions based directly on official KSERC tariff schedules. Every rupee in energy charges, fixed charges, fuel adjustment, and statutory electricity duty is verified without approximations or opaque AI guessing.',
      descriptionMl:
        'ഔദ്യോഗിക KSERC താരിഫ് ഓർഡറുകൾ അടിസ്ഥാനമാക്കിയുള്ള ശുദ്ധമായ ഗണിത കണക്കുകൂട്ടൽ രീതി. കൃത്യമായ സ്ലാബുകളും സബ്സിഡികളും നേരിട്ട് പരിശോധിക്കാം.',
    },
    {
      step: '3',
      title: '100% On-Device Meter & Bill Scanning',
      titleMl: 'ഫോണിൽ മാത്രം പ്രവർത്തിക്കുന്ന സ്കാനിംഗ്',
      icon: Lock,
      description:
        'When you photograph your physical bill or digital meter, OCR text recognition executes entirely inside your device’s browser sandbox. No photo, image byte, or reading is ever transmitted to an external server.',
      descriptionMl:
        'നിങ്ങൾ മീറ്ററിന്റെയോ ബില്ലിന്റെയോ ഫോട്ടോ എടുക്കുമ്പോൾ അത് നിങ്ങളുടെ ബ്രൗസറിനുള്ളിൽ വെച്ച് മാത്രമാണ് പരിശോധിക്കുന്നത്. ചിത്രങ്ങൾ സെർവറുകളിലേക്ക് അയക്കുന്നില്ല.',
    },
    {
      step: '4',
      title: 'Device-Local Storage Only',
      titleMl: 'നിങ്ങളുടെ ഫോണിൽ മാത്രം സൂക്ഷിക്കുന്ന ചരിത്രം',
      icon: Database,
      description:
        'Your past readings, prediction history, and budget ceilings remain solely inside your browser’s private localStorage. You can export your data as JSON, import it, or erase everything in 1 tap at any time.',
      descriptionMl:
        'നിങ്ങളുടെ റീഡിംഗുകളും ബജറ്റും നിങ്ങളുടെ ഫോണിന്റെ ബ്രൗസറിൽ മാത്രമാണ് സൂക്ഷിക്കുന്നത്. ഏത് സമയത്തും ഡൗൺലോഡ് ചെയ്യുകയോ പൂർണ്ണമായി ഒഴിവാക്കുകയോ ചെയ്യാം.',
    },
    {
      step: '5',
      title: 'Open, Unbiased Methodology',
      titleMl: 'സ്വതന്ത്രവും സുതാര്യവുമായ സമീപനം',
      icon: BookOpen,
      description:
        'We do not sell electricity products or represent any utility. Our sole purpose is making Kerala electricity billing crystal-clear, helping households prevent bill shock and understand actionable efficiency.',
      descriptionMl:
        'ഞങ്ങൾ വാണിജ്യ ആവശ്യങ്ങൾക്കോ പരസ്യങ്ങൾക്കോ വേണ്ടിയല്ല പ്രവർത്തിക്കുന്നത്. വൈദ്യുതി ബില്ലുകൾ സാധാരണക്കാർക്ക് എളുപ്പത്തിൽ മനസ്സിലാക്കാൻ സഹായിക്കുക മാത്രമാണ് ലക്ഷ്യം.',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-800">
          <Zap className="h-3.5 w-3.5 text-sky-600 fill-current" />
          <span>{lang === 'ml' ? 'ബിൽവൈസ് ട്രസ്റ്റ് സെന്റർ' : 'Trust Center & Architecture'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
          {lang === 'ml' ? 'വൈദ്യുതി ബിൽ എളുപ്പത്തിൽ മനസ്സിലാക്കാം' : 'Know your KSEB bill before it arrives'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {lang === 'ml'
            ? 'കേരളത്തിലെ ഗാർഹിക വൈദ്യുതി ഉപഭോക്താക്കൾക്കായി നിർമ്മിച്ച സുതാര്യവും സ്വതന്ത്രവുമായ കണക്കുകൂട്ടൽ സഹായി.'
            : 'BILLWISE is an independent consumer electricity intelligence application built to make Kerala utility bills transparent, predictable, and manageable.'}
        </p>
      </div>

      {/* Purpose */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h3 className="font-bold text-slate-900 text-base">
          {lang === 'ml' ? 'എന്തുകൊണ്ട് ബിൽവൈസ്?' : 'Why we built BILLWISE'}
        </h3>
        <p>
          In Kerala, electricity bills arrive once every two months. Many households experience sticker shock when sudden seasonal AC cooling or minor increases cross crucial thresholds — such as the <strong>240-unit subsidy cutoff</strong> or the <strong>500-unit non-telescopic cliff</strong>.
        </p>
        <p>
          Official utility portals often require consumer logins, OTPs, or understanding complex tariff codes (LT-1A, telescopic slabs, fuel surcharges, Section 3 duty).
        </p>
        <p className="text-slate-900 font-semibold">
          BILLWISE removes all friction: Check your meter, see your bill, understand why, and know what to do.
        </p>
      </div>

      {/* 5-Step Transparency Principles */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {lang === 'ml' ? 'പ്രവർത്തന തത്വങ്ങൾ' : '5-Step Transparency Framework'}
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {lang === 'ml' ? 'ബിൽവൈസ് എങ്ങനെ പ്രവർത്തിക്കുന്നു?' : 'How BILLWISE protects you'}
          </h2>
        </div>

        <div className="space-y-3">
          {principles.map(p => {
            const Icon = p.icon;
            return (
              <div
                key={p.step}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-bold text-sm shrink-0 border border-sky-100">
                    <Icon className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                      Step {p.step}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {lang === 'ml' ? p.titleMl : p.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-12">
                  {lang === 'ml' ? p.descriptionMl : p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Disclaimer Banner */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          <span>Disclaimer & Regulatory Independence</span>
        </div>
        <p className="leading-relaxed">
          BILLWISE is an independent consumer software utility. It is not owned, operated, affiliated with, or endorsed by the <strong>Kerala State Electricity Board Limited (KSEBL)</strong> or the <strong>Kerala State Electricity Regulatory Commission (KSERC)</strong>.
        </p>
        <p className="leading-relaxed">
          All calculation logic is derived directly from publicly gazetted KSERC tariff orders and the Kerala Electricity Duty Act.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center pt-2 pb-6">
        <Link
          href="/predict"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors touch-target"
        >
          <span>{t.predictMyBill}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
