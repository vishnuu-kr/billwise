'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Camera,
  Search,
  Gauge,
  Calculator,
  TrendingUp,
  HelpCircle,
  ShieldCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function HowItWorksPage() {
  const { lang } = useLanguage();

  const steps = [
    {
      step: '1',
      title: 'Scan your bill',
      titleMl: 'ബിൽ സ്കാൻ ചെയ്യുക',
      icon: Camera,
      desc: 'Take a quick photo of your last printed KSEB bill. We read your past reading and billing cycle dates.',
      descMl: 'നിങ്ങളുടെ ഏറ്റവും പുതിയ KSEB ബില്ലിന്റെ ഫോട്ടോ എടുക്കുക. പഴയ റീഡിംഗും തീയതിയും ഫോൺ തന്നെ തിരിച്ചറിയും.',
    },
    {
      step: '2',
      title: 'We identify your billing setup',
      titleMl: 'കണക്ഷൻ വിവരങ്ങൾ തിരിച്ചറിയുന്നു',
      icon: Search,
      desc: 'We verify your tariff category (Domestic LT-1A), phase (Single or Three), and connected load in watts.',
      descMl: 'താരിഫ് (LT-1A ഗാർഹികം), ഫേസ് (സിംഗിൾ അല്ലെങ്കിൽ ത്രീ ഫേസ്), കണക്റ്റഡ് ലോഡ് എന്നിവ കണ്ടെത്തുന്നു.',
    },
    {
      step: '3',
      title: 'Check your meter',
      titleMl: 'മീറ്റർ റീഡിംഗ് പരിശോധിക്കുക',
      icon: Gauge,
      desc: 'Read the cumulative numbers displayed beside "kWh" on your electric meter and enter them.',
      descMl: 'ഇലക്ട്രിസിറ്റി മീറ്ററിൽ "kWh" ന് നേരെയുള്ള അക്കങ്ങൾ നോക്കി നൽകുക (അല്ലെങ്കിൽ ക്യാമറ ഉപയോഗിക്കുക).',
    },
    {
      step: '4',
      title: 'We calculate your usage',
      titleMl: 'ഉപയോഗം കണക്കുകൂട്ടുന്നു',
      icon: Calculator,
      desc: 'We subtract your past reading from your current reading to find consumed units and your daily burn rate.',
      descMl: 'ഇപ്പോഴത്തെ റീഡിംഗിൽ നിന്ന് പഴയ റീഡിംഗ് കുറച്ച് ഇതുവരെ ഉപയോഗിച്ച യൂണിറ്റും ദിവസേനയുള്ള വേഗതയും കണ്ടെത്തുന്നു.',
    },
    {
      step: '5',
      title: 'We estimate your next bill',
      titleMl: 'അടുത്ത ബിൽ പ്രവചിക്കുന്നു',
      icon: TrendingUp,
      desc: 'We project your 60-day bi-monthly consumption and calculate the expected bill using official telescopic slabs.',
      descMl: 'ബാക്കിയുള്ള ദിവസങ്ങളിലെ ഉപയോഗം കണക്കാക്കി 60 ദിവസത്തെ ആകെ തുക മുൻകൂട്ടി കണക്കാക്കുന്നു.',
    },
    {
      step: '6',
      title: 'We explain the result',
      titleMl: 'വ്യക്തമായ വിവരണം നൽകുന്നു',
      icon: HelpCircle,
      desc: 'See exactly which slabs you hit, where your rupees go, and how much you save by cutting 0.5 units/day.',
      descMl: 'സ്ലാബ് നിരക്കുകൾ, ഫിക്സഡ് ചാർജ്ജ്, ഡ്യൂട്ടി, 0.5 യൂണിറ്റ് കുറച്ചാൽ എത്ര ലാഭിക്കാം എന്നിവ വിശദീകരിക്കുന്നു.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {lang === 'ml' ? 'ബിൽവൈസ് എങ്ങനെ പ്രവർത്തിക്കുന്നു?' : 'How BILLWISE Works'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {lang === 'ml'
            ? 'ആറ് ലളിതമായ ഘട്ടങ്ങളിൽ നിങ്ങളുടെ വൈദ്യുതി ബിൽ സുതാര്യമായി അറിയാം.'
            : 'Six simple steps to understand, predict, and control your KSEB electricity bill.'}
        </p>
      </div>

      {/* 6 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map(s => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 font-bold text-sm">
                  {s.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'ml' ? s.titleMl : s.title}
                  </h3>
                </div>
                <Icon className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'ml' ? s.descMl : s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Section 34: Is this official? Plain English QA */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {lang === 'ml' ? 'സുതാര്യത' : 'Trust & Questions'}
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {lang === 'ml' ? 'പതിവുചോദ്യങ്ങൾ' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-4 divide-y divide-slate-100 text-xs sm:text-sm">
          {/* Question 1 */}
          <div className="pt-3 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              {lang === 'ml' ? 'ഇത് KSEB-യുടെ ഔദ്യോഗിക ആപ്പാണോ?' : 'Is BILLWISE KSEB?'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              <strong>No.</strong> BILLWISE is an independent tool that uses published KSERC tariff information to estimate domestic electricity bills. We are not run by, endorsed by, or affiliated with the Kerala State Electricity Board (KSEBL).
            </p>
          </div>

          {/* Question 2 */}
          <div className="pt-4 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              {lang === 'ml' ? 'എന്റെ വിവരങ്ങൾ സുരക്ഷിതമാണോ?' : 'What happens to my data?'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Your data stays entirely on your phone or computer. When you scan a bill or meter, all reading happens in your device browser. We do not store your name, phone number, consumer number, or bill photos on any cloud server. There are no accounts and no passwords.
            </p>
          </div>

          {/* Question 3 */}
          <div className="pt-4 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              {lang === 'ml' ? 'എനിക്ക് എന്ത് ബില്ലുകളാണ് പരിശോധിക്കാൻ കഴിയുക?' : 'Which bills can I calculate?'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              BILLWISE is built specifically for Kerala domestic households (LT-1A tariff, single-phase or three-phase, bi-monthly cycle). Commercial shops, solar net-metering, and high-tension connections have different complex rules and are not supported yet.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Bottom */}
      <div className="text-center pt-2 pb-8">
        <Link
          href="/predict"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
        >
          <span>{lang === 'ml' ? 'ഇപ്പോൾ തന്നെ ബിൽ പ്രവചിക്കാം' : 'Predict My Bill Now'}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
