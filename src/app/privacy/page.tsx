'use client';

import React, { useState } from 'react';
import { storageManager } from '@/lib/storage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ShieldCheck, Lock, Trash2, CheckCircle2, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const [deleted, setDeleted] = useState(false);

  const handleDeleteData = () => {
    if (confirm('This will wipe all locally stored readings and budgets from your browser. Continue?')) {
      storageManager.clearAllData();
      setDeleted(true);
      setTimeout(() => setDeleted(false), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Zero-Knowledge Privacy Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
          {lang === 'ml' ? 'നിങ്ങളുടെ സ്വകാര്യത, ഞങ്ങളുടെ ബാധ്യത' : 'Privacy by Design'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          BILLWISE is designed specifically so you never have to trust us with personal data. We do not require signups, phone numbers, or account details.
        </p>
      </div>

      {/* Core Privacy Commitments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <EyeOff className="h-5 w-5 text-sky-600" />
          <h3 className="font-bold text-slate-900 text-sm">No PII Required</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We never ask for your 13-digit consumer number, phone number, name, email, or physical home address.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <Lock className="h-5 w-5 text-sky-600" />
          <h3 className="font-bold text-slate-900 text-sm">On-Device Storage</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All your readings and budget targets remain on your own device&apos;s localStorage. We have no remote user database.
          </p>
        </div>
      </div>

      {/* Detailed Disclosure */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h3 className="font-bold text-slate-900 text-base">
          What happens when you scan a bill?
        </h3>
        <p>
          When you take a photo or upload a bill image, the image is parsed in-memory on your device. Only technical metering numbers (previous reading, present reading, tariff code) are extracted.
        </p>
        <p>
          Images are never retained on our servers after extraction. You can inspect and edit every extracted field before using it.
        </p>
      </div>

      {/* Delete My Data Action Card */}
      <div className="rounded-3xl border border-red-100 bg-red-50/60 p-6 space-y-3">
        <h3 className="font-bold text-red-950 text-base">
          Wipe Local Device Data
        </h3>
        <p className="text-xs sm:text-sm text-red-900 leading-relaxed">
          Clear all locally saved readings, history records, and custom budget limits immediately.
        </p>

        <button
          onClick={handleDeleteData}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 active:scale-[0.98] transition-all touch-target"
        >
          <Trash2 className="h-4 w-4" />
          <span>{deleted ? 'All local data wiped!' : 'Delete my data'}</span>
        </button>
      </div>
    </div>
  );
}
