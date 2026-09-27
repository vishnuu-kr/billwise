'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import CardSkeleton from '@/components/CardSkeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function WhatIfContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const unitsParam = searchParams.get('units');
  const initialUnits = unitsParam ? Number(unitsParam) : 240;

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      <div>
        <Link
          href={`/result?units=${initialUnits}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'റിസൾട്ടിലേക്ക് മടങ്ങാം' : 'Back to Bill Result'}</span>
        </Link>
      </div>

      <WhatIfSimulator initialUnits={initialUnits} />
    </div>
  );
}

export default function WhatIfPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10">
          <CardSkeleton title="Preparing what-if simulator..." />
        </div>
      }
    >
      <WhatIfContent />
    </Suspense>
  );
}
