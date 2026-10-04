'use client';

import React from 'react';
import { PulseDots, IndeterminateBar } from '@/components/ui/LoaderSet';

export default function CardSkeleton({ title = 'Calculating...' }: { title?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-sm space-y-5"
    >
      <span className="sr-only">{title}</span>
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-black/[0.06] rounded-md animate-pulse" />
        <PulseDots />
      </div>

      <div className="space-y-2">
        <div className="h-10 w-44 bg-black/[0.06] rounded-lg animate-pulse" />
        <div className="h-3.5 w-32 bg-black/[0.06] rounded-md animate-pulse" />
      </div>

      <IndeterminateBar className="w-full" />

      <div className="text-center text-[12px] text-[#71717A] pt-1 font-medium">
        {title}
      </div>
    </div>
  );
}
