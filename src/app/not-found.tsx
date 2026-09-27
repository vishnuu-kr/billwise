import React from 'react';
import Link from 'next/link';
import { ArrowRight, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pt-16 sm:pt-24 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 border border-sky-100 text-sky-600 shadow-2xs">
        <HelpCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          404 — Page Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          That page isn&apos;t here.
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
          The link you followed may be broken or the route might have been moved.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/predict"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors touch-target"
        >
          <span>Go calculate my bill</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
