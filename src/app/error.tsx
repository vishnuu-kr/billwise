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
    <div className="max-w-[430px] mx-auto px-4 pt-16 sm:pt-24 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block">
          Temporary Glitch
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] mt-2">
          Something went wrong.
        </h1>
        <p className="text-xs sm:text-sm text-[var(--secondary)] max-w-xs mx-auto leading-relaxed">
          Your saved readings, history, and budget are completely safe on this device.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="ios-btn-primary w-full sm:w-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>

        <Link
          href="/"
          className="ios-btn-secondary w-full sm:w-auto"
        >
          <Home className="h-3.5 w-3.5 text-[var(--secondary)]" />
          <span>Return home</span>
        </Link>
      </div>
    </div>
  );
}
