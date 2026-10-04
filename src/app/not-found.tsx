import React from 'react';
import Link from 'next/link';
import { ArrowRight, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-[430px] mx-auto px-4 pt-16 sm:pt-24 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-sunken)] border border-[var(--separator)] text-[var(--accent)]">
        <HelpCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--tertiary)]">
          404 — Page Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          That page isn&apos;t here.
        </h1>
        <p className="text-xs sm:text-sm text-[var(--secondary)] max-w-xs mx-auto leading-relaxed">
          The link you followed may be broken or the route might have been moved.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/predict"
          className="ios-btn-primary inline-flex"
        >
          <span>Go calculate my bill</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
