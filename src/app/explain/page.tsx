'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { calculateBill } from '@/lib/calculation/engine';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import BillExplanation from '@/components/BillExplanation';
import CardSkeleton from '@/components/CardSkeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function ExplainContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const unitsParam = searchParams.get('units');
  const units = unitsParam ? Math.max(0, Number(unitsParam)) : 240;
  const cycle = (searchParams.get('cycle') as any) || 'bi-monthly';
  const phase = (searchParams.get('phase') as any) || 'single';

  const calculation = calculateBill({
    units,
    billingCycle: cycle,
    phase,
  });

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      <div>
        <Link
          href={`/result?units=${units}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'റിസൾട്ടിലേക്ക് മടങ്ങാം' : 'Back to Bill Result'}</span>
        </Link>
      </div>

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
