'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { logger } from '@/lib/observability/logger';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled route error caught by boundary', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 pt-16 sm:pt-24 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-100 text-amber-600 shadow-2xs">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
          Temporary Glitch
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Something went wrong.
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
          Your saved readings, history, and budget are completely safe on this device.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors touch-target"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs touch-target"
        >
          <Home className="h-3.5 w-3.5 text-slate-500" />
          <span>Return home</span>
        </Link>
      </div>
    </div>
  );
}
