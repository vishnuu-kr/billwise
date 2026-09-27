'use client';

import React from 'react';
import BillScanner from '@/components/BillScanner';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Camera, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lang === 'ml' ? 'ഹോം പേജിലേക്ക്' : 'Back to Home'}</span>
        </Link>
      </div>

      {/* Bill Scanner Component */}
      <BillScanner />

      {/* Reassurance text */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Your bill is analyzed locally. No images are stored on our servers.</span>
      </div>
    </div>
  );
}
