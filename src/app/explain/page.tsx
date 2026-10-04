'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import BillExplanation from '@/components/BillExplanation';
import CardSkeleton from '@/components/CardSkeleton';
import Link from 'next/link';
import { BillingCycle, Phase } from '@/types';

function ExplainContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const unitsParam = searchParams.get('units');
  const units = unitsParam ? Math.max(0, Number(unitsParam)) : 240;
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'bi-monthly';
  const phase = (searchParams.get('phase') as Phase) || 'single';

  const calculation = calculateBill({
    units,
    billingCycle: cycle,
    phase,
  });

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-5">
      <Link
        href={`/result?units=${units}`}
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--secondary)] hover:text-[var(--foreground)] active:opacity-60 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span>{lang === 'ml' ? 'ബിൽ ഫലത്തിലേക്ക്' : 'Back to result'}</span>
      </Link>

      <BillExplanation calculation={calculation} />
    </div>
  );
}

export default function ExplainPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10">
          <CardSkeleton title="Deconstructing bill charges..." />
        </div>
      }
    >
      <ExplainContent />
    </Suspense>
  );
}
