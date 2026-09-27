'use client';

import React from 'react';
import ApplianceCalculator from '@/components/ApplianceCalculator';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AppliancesPage() {
  const { lang } = useLanguage();

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'ഹോം പേജിലേക്ക്' : 'Back to Home'}</span>
        </Link>
      </div>

      <ApplianceCalculator />
    </div>
  );
}
