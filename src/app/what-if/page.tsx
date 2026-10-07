'use client';

import React, { useState, useEffect } from 'react';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ChevronLeft } from 'lucide-react';

import { storageManager } from '@/lib/storage';

export default function WhatIfPage() {
  const { lang } = useLanguage();
  const [initialUnits, setInitialUnits] = useState(240);
  const [isFromSavedHome, setIsFromSavedHome] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('units');
      if (p && !isNaN(Number(p))) {
        setInitialUnits(Number(p));
      } else {
        const home = storageManager.getSavedHome();
        if (home?.lastBillUnits) {
          setInitialUnits(home.lastBillUnits);
          setIsFromSavedHome(true);
        } else if (home?.currentReading && home.lastReading && home.currentReading >= home.lastReading) {
          setInitialUnits(home.currentReading - home.lastReading);
          setIsFromSavedHome(true);
        }
      }
    }
  }, []);

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-4">
      {/* Desktop Back */}
      <Link
        href={isFromSavedHome ? "/" : `/result?units=${initialUnits}`}
        className="hidden md:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#71717A] hover:text-[#17171C] active:opacity-60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{lang === 'ml' ? (isFromSavedHome ? 'ഹോം' : 'ബിൽ ഫലം') : (isFromSavedHome ? 'Home' : 'Back to result')}</span>
      </Link>

      <WhatIfSimulator initialUnits={initialUnits} isFromSavedHome={isFromSavedHome} />
    </div>
  );
}
