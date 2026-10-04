'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ArrowRight, ChevronRight, ScanLine, Gauge, TrendingUp, Lightbulb } from 'lucide-react';

export default function HowItWorksPage() {
  const { lang } = useLanguage();

  const steps = [
    {
      num: '01',
      title: 'Scan',
      titleMl: 'സ്കാൻ',
      desc: 'Take a quick photo of your last printed KSEB bill. We read your previous reading, tariff category, and billing cycle dates.',
      descMl: 'കഴിഞ്ഞ ബില്ലിന്റെ ഫോട്ടോ എടുക്കൂ. പഴയ റീഡിംഗും തീയതിയും ഫോൺ തന്നെ തിരിച്ചറിയും.',
      action: '/scan',
      actionLabel: 'Scan Bill',
      actionLabelMl: 'ബിൽ സ്കാൻ ചെയ്യുക',
      icon: ScanLine,
    },
    {
      num: '02',
      title: 'Check',
      titleMl: 'പരിശോധിക്കുക',
      desc: 'Look at the digital display on your electricity meter and check the cumulative kWh digits.',
      descMl: 'ഇലക്ട്രിക് മീറ്ററിലെ kWh നമ്പർ നോക്കുക (ക്യാമറ സ്കാനർ ഉപയോഗിക്കാം).',
      action: '/predict',
      actionLabel: 'Check Meter',
      actionLabelMl: 'മീറ്റർ പരിശോധിക്കുക',
      icon: Gauge,
    },
    {
      num: '03',
      title: 'Predict',
      titleMl: 'പ്രവചിക്കുക',
      desc: 'We subtract the readings to determine your daily burn rate and project your 60-day consumption using official KSERC tariff slabs.',
      descMl: 'ദൈനംദിന വേഗത അടിസ്ഥാനമാക്കി ഔദ്യോഗിക സ്ലാബ് നിരക്കനുസരിച്ച് തുക കണക്കാക്കുന്നു.',
      action: '/predict',
      actionLabel: 'Predict Bill',
      actionLabelMl: 'ബിൽ പ്രവചിക്കുക',
      icon: TrendingUp,
    },
    {
      num: '04',
      title: 'Understand',
      titleMl: 'മനസ്സിലാക്കുക',
      desc: 'See which tariff slab you are in, view threshold alerts, and discover how cutting 0.5 units/day saves real rupees.',
      descMl: 'ഏതൊക്കെ സ്ലാബ് ബാധകം, 0.5 യൂണിറ്റ് കുറച്ചാൽ എത്ര ലാഭം — എല്ലാം കൃത്യമായി അറിയാം.',
      action: '/what-if',
      actionLabel: 'Try Simulator',
      actionLabelMl: 'സിമുലേറ്റർ നോക്കൂ',
      icon: Lightbulb,
    },
  ];

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--secondary)] hover:text-[var(--foreground)] active:opacity-60 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <span className="text-[12px] font-medium text-[var(--tertiary)] block">
          {lang === 'ml' ? 'പ്രവർത്തന രീതി' : 'How it works'}
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-[var(--foreground)]">
          {lang === 'ml' ? 'നാല് ലളിതമായ ഘട്ടങ്ങൾ' : 'Four clear steps'}
        </h1>
        <p className="text-[14px] text-[var(--secondary)] leading-relaxed pt-1">
          {lang === 'ml'
            ? 'മീറ്റർ റീഡിംഗിൽ നിന്ന് കൃത്യമായ ബിൽ പ്രവചനത്തിലേക്ക്.'
            : 'From your physical meter to an accurate expected bill.'}
        </p>
      </div>

      {/* Interactive Step Cards */}
      <div className="space-y-3">
        {steps.map(s => {
          const Icon = s.icon;
          return (
            <Link
              key={s.num}
              href={s.action}
              className="glass-card p-4 rounded-2xl block text-inherit no-underline hover:border-[var(--accent)]/40 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-sunken)] border border-[var(--separator)] flex items-center justify-center shrink-0 relative">
                  <Icon className="w-5 h-5 text-[var(--accent)]" />
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold num-tabular bg-[var(--foreground)] text-white px-1.5 py-0.5 rounded-full leading-none">
                    {s.num}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[var(--foreground)] tracking-tight">
                      {lang === 'ml' ? s.titleMl : s.title}
                    </h2>
                    <span className="text-[12px] font-medium text-[var(--accent)] inline-flex items-center gap-0.5">
                      <span>{lang === 'ml' ? s.actionLabelMl : s.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--secondary)] leading-relaxed mt-1">
                    {lang === 'ml' ? s.descMl : s.desc}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <Link
          href="/scan"
          className="ios-btn-primary w-full"
        >
          <span>{lang === 'ml' ? 'ആരംഭിക്കൂ' : 'Start with your bill'}</span>
          <ArrowRight style={{ width: '16px', height: '16px' }} />
        </Link>
      </div>
    </div>
  );
}
