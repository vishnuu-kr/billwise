'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { predictUsage } from '@/lib/prediction/engine';
import { storageManager } from '@/lib/storage';
import ResultCard from '@/components/ResultCard';
import CardSkeleton from '@/components/CardSkeleton';
import { BillingCycle, Phase } from '@/types';

function ResultContent() {
  const searchParams = useSearchParams();

  const unitsParam = searchParams.get('units');
  const units = unitsParam ? Math.max(0, Number(unitsParam)) : 240;
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'bi-monthly';
  const phase = (searchParams.get('phase') as Phase) || 'single';
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
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4">
      <ResultCard prediction={prediction} previousBillAmount={previousBillAmount} />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[430px] mx-auto px-4 pt-6">
          <CardSkeleton title="Calculating projected bill..." />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
