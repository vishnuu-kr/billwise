'use client';

import React, { useState, useEffect } from 'react';
import { storageManager } from '@/lib/storage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Sparkles, X, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingBanner() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if not previously dismissed
    if (!storageManager.isOnboardingCompleted()) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    storageManager.setOnboardingCompleted(true);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full max-w-2xl mx-auto glass-card p-5 relative overflow-hidden transition-all animate-fadeIn">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 rounded-full p-1.5 text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-black/5 transition-colors"
        aria-label="Dismiss onboarding guide"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-xs">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
              {lang === 'ml' ? 'ആദ്യമായി ഉപയോഗിക്കുകയാണോ?' : 'First time using BillWise?'}
            </span>
          </div>

          <h3 className="text-sm font-bold text-[var(--foreground)]">
            {lang === 'ml'
              ? '30 സെക്കൻഡിൽ കേരള വൈദ്യുതി ബില്ലിംഗ് മനസ്സിലാക്കാം'
              : 'Understand Kerala KSEB billing in 30 seconds'}
          </h3>

          <ul className="text-xs text-[var(--secondary)] space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--accent)]">1.</span>
              <span>
                {lang === 'ml'
                  ? 'KSEB ബില്ലിംഗ് 2 മാസത്തിലൊരിക്കലാണ് (Bi-monthly 60 ദിവസം).'
                  : 'KSEB calculates bills every 2 months (Bi-monthly 60-day cycle).'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--accent)]">2.</span>
              <span>
                {lang === 'ml'
                  ? '250 യൂണിറ്റ്/മാസം (500 യൂണിറ്റ് വരെ) ടെലിസ്‌കോപ്പിക് നിരക്കുകളാണ് — ഉപയോഗം കുറഞ്ഞാൽ നിരക്ക് കുറയും.'
                  : 'Under 250 units/month (500 bi-monthly), telescopic slabs apply — lower units are billed at cheaper rates.'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--accent)]">3.</span>
              <span>
                {lang === 'ml'
                  ? 'മീറ്ററിലെ റീഡിംഗിൽ നിന്ന് കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ് കുറച്ചാൽ നിങ്ങൾ ഉപയോഗിച്ച യൂണിറ്റ് അറിയാം.'
                  : 'Subtract your last bill reading from your current meter reading to know your units so far.'}
              </span>
            </li>
          </ul>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDismiss}
              className="ios-btn-primary px-3.5 py-1.5 text-xs inline-flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{lang === 'ml' ? 'ശരി, മനസ്സിലായി' : 'Got it'}</span>
            </button>

            <Link
              href="/kseb-meter-reading"
              className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
            >
              <span>{lang === 'ml' ? 'മീറ്റർ റീഡിംഗ് ഗൈഡ്' : 'Visual Meter Guide'}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
