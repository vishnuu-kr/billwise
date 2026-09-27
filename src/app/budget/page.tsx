'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BudgetController from '@/components/BudgetController';
import CardSkeleton from '@/components/CardSkeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function BudgetContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const currentUnits = searchParams.get('currentUnits') ? Number(searchParams.get('currentUnits')) : 240;
  const rate = searchParams.get('rate') ? Number(searchParams.get('rate')) : 3.8;

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      <div>
        <Link
          href={`/result?units=${currentUnits}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'റിസൾട്ടിലേക്ക് മടങ്ങാം' : 'Back to Bill Result'}</span>
        </Link>
      </div>

      <BudgetController
        currentProjectedUnits={currentUnits}
        currentPaceUnitsPerDay={rate}
      />
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10">
          <CardSkeleton title="Preparing budget controller..." />
        </div>
      }
    >
      <BudgetContent />
    </Suspense>
  );
}
