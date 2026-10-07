'use client';

import React, { useState, useEffect } from 'react';
import BudgetController from '@/components/BudgetController';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { ChevronLeft, Sparkles, ArrowRight } from 'lucide-react';

export default function BudgetPage() {
  const { lang } = useLanguage();
  const [currentUnits, setCurrentUnits] = useState(240);
  const [rate, setRate] = useState(3.8);
  const [targetRupees, setTargetRupees] = useState<number | undefined>(undefined);
  const [hasHome, setHasHome] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const u = sp.get('currentUnits');
      const r = sp.get('rate');
      const t = sp.get('target');
      if (t && !isNaN(Number(t))) {
        setTargetRupees(Number(t));
      }
      const home = storageManager.getSavedHome();
      setHasHome(!!home);

      if (u) {
        setCurrentUnits(Number(u));
      } else {
        if (home?.latestPrediction?.projectedUnits) {
          setCurrentUnits(home.latestPrediction.projectedUnits);
          if (home.latestPrediction.unitsPerDay) setRate(home.latestPrediction.unitsPerDay);
        } else {
          const hist = storageManager.getHistory();
          if (hist.length > 0 && hist[0].consumedUnits) {
            setCurrentUnits(hist[0].consumedUnits);
          }
        }
      }
      if (r) setRate(Number(r));
    }
  }, []);

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-4">
      {/* Desktop Back */}
      <Link
        href="/"
        className="hidden md:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#71717A] hover:text-[#17171C] active:opacity-60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
      </Link>

      {!hasHome && (
        <div className="p-3.5 rounded-2xl bg-[#006FEE]/5 border border-[#006FEE]/15 flex items-center justify-between text-[12px] animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#006FEE] shrink-0" />
            <span className="text-[#17171C] font-medium">
              {lang === 'ml' ? 'മാതൃകാ കണക്ക് (240 യൂണിറ്റ്)' : 'Showing Kerala sample baseline (240u)'}
            </span>
          </div>
          <Link href="/" className="text-[#006FEE] font-semibold hover:underline inline-flex items-center gap-0.5 shrink-0">
            <span>{lang === 'ml' ? 'വീട് ചേർക്കുക' : 'Set up home'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <BudgetController
        key={targetRupees ? `target-${targetRupees}` : 'default'}
        currentProjectedUnits={currentUnits}
        currentPaceUnitsPerDay={rate}
        initialTargetRupees={targetRupees}
      />
    </div>
  );
}
