'use client';

import React from 'react';
import ApplianceCalculator from '@/components/ApplianceCalculator';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ChevronLeft } from 'lucide-react';

export default function AppliancesPage() {
  const { lang } = useLanguage();

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-4">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#71717A] hover:text-[#17171C] active:opacity-60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
      </Link>

      <ApplianceCalculator />
    </div>
  );
}
