'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config/site';

export default function AboutPage() {
  const { lang } = useLanguage();

  const principles = [
    {
      title: 'On-device document reader',
      titleMl: 'ഡിവൈസിൽ മാത്രം റീഡർ',
      desc: 'Bill and meter photos are analyzed directly in your browser sandbox. No photo is ever transmitted to a server.',
      descMl: 'ഫോട്ടോകൾ നിങ്ങളുടെ ഫോണിൽ മാത്രം പ്രോസസ് ചെയ്യുന്നു.',
    },
    {
      title: 'Deterministic KSERC math',
      titleMl: 'ഔദ്യോഗിക KSERC ഗണിതം',
      desc: 'Calculations use pure functions derived directly from official KSERC tariff orders — no AI guessing.',
      descMl: 'ഔദ്യോഗിക KSERC താരിഫ് ഓർഡറുകൾ അടിസ്ഥാനമാക്കിയ ശുദ്ധ ഗണിതം.',
    },
    {
      title: 'No account needed',
      titleMl: 'ലോഗിൻ ആവശ്യമില്ല',
      desc: 'BILLWISE never asks for your consumer number, phone number, or email.',
      descMl: 'കൺസ്യൂമർ നമ്പറോ ഫോൺ നമ്പറോ ആവശ്യമില്ല.',
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

      {/* Hero Typography — Section 40 */}
      <div className="space-y-1 pt-1">
        <h1 className="text-[32px] sm:text-[36px] font-semibold tracking-tight text-[var(--foreground)]">
          BILLWISE
        </h1>
        <p className="text-[17px] font-medium text-[var(--secondary)]">
          {lang === 'ml' ? 'നിങ്ങളുടെ വൈദ്യുതി മനസ്സിലാക്കൂ.' : 'Know your electricity.'}
        </p>
        <p className="text-[13px] text-[var(--tertiary)] pt-1">
          {lang === 'ml'
            ? 'സ്വതന്ത്ര ഉപഭോക്തൃ ഉപകരണം · KSEB/KSEBL-മായി ഔദ്യോഗിക ബന്ധമില്ല.'
            : 'Independent tool · Not affiliated with KSEB / KSEBL.'}
        </p>
      </div>

      {/* Section 40 Links */}
      <div className="ios-grouped-list">
        <Link href="/how-it-works" className="ios-row text-inherit no-underline">
          <span className="text-[14px] font-medium text-[var(--foreground)]">
            {lang === 'ml' ? 'കണക്കുകൂട്ടലുകൾ പ്രവർത്തിക്കുന്ന വിധം' : 'How calculations work'}
          </span>
          <ChevronRight className="w-4 h-4 text-[var(--quaternary)]" />
        </Link>
        <Link href="/privacy" className="ios-row text-inherit no-underline">
          <span className="text-[14px] font-medium text-[var(--foreground)]">
            {lang === 'ml' ? 'സ്വകാര്യതാ നയം' : 'Privacy guarantee'}
          </span>
          <ChevronRight className="w-4 h-4 text-[var(--quaternary)]" />
        </Link>
        <div className="ios-row">
          <span className="text-[14px] text-[var(--secondary)]">Version</span>
          <span className="text-[14px] font-medium text-[var(--foreground)] num-tabular">v{SITE_CONFIG.appVersion} ({SITE_CONFIG.activeTariffLabel})</span>
        </div>
      </div>

      {/* Guiding Principles */}
      <div className="space-y-2 pt-2">
        <span className="text-[12px] font-medium text-[var(--secondary)] block px-1">
          {lang === 'ml' ? 'അടിസ്ഥാന തത്വങ്ങൾ' : 'Guiding principles'}
        </span>
        <div className="ios-grouped-list">
          {principles.map((p, idx) => (
            <div key={idx} className="p-4 border-b border-[var(--separator)] last:border-none space-y-1">
              <h3 className="text-[14px] font-semibold text-[var(--foreground)]">
                {lang === 'ml' ? p.titleMl : p.title}
              </h3>
              <p className="text-[13px] text-[var(--secondary)] leading-relaxed">
                {lang === 'ml' ? p.descMl : p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
