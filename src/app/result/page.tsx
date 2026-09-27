'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { predictUsage } from '@/lib/prediction/engine';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import ResultCard from '@/components/ResultCard';
import CardSkeleton from '@/components/CardSkeleton';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

function ResultContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const unitsParam = searchParams.get('units');
  const units = unitsParam ? Math.max(0, Number(unitsParam)) : 240;
  const cycle = (searchParams.get('cycle') as any) || 'bi-monthly';
  const phase = (searchParams.get('phase') as any) || 'single';
  const load = searchParams.get('load') ? Number(searchParams.get('load')) : 982;

  const prevBillParam = searchParams.get('prevBill');
  let previousBillAmount: number | undefined = prevBillParam ? Number(prevBillParam) : undefined;
  if (previousBillAmount === undefined) {
    const history = storageManager.getHistory();
    if (history.length > 0 && typeof history[0].actualBill === 'number') {
      previousBillAmount = history[0].actualBill;
    }
  }

  // Run prediction projection
  const prediction = predictUsage({
    currentCycleUnits: units,
    daysElapsed: cycle === 'bi-monthly' ? 60 : 30,
    totalCycleDays: cycle === 'bi-monthly' ? 60 : 30,
    billingCycle: cycle,
    phase,
    connectedLoadWatts: load,
  });

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/predict"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'റീഡിംഗ് മാറ്റുക' : 'Change reading or cycle'}</span>
        </Link>
      </div>

      {/* Main Result Card */}
      <ResultCard prediction={prediction} previousBillAmount={previousBillAmount} />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10">
          <CardSkeleton title="Calculating projected bill..." />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
