'use client';

import React from 'react';

export default function CardSkeleton({ title = 'Calculating bill projection...' }: { title?: string }) {
  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-200 rounded-full" />
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
      </div>

      <div className="space-y-3">
        <div className="h-3 w-28 bg-slate-200 rounded" />
        <div className="h-12 w-48 bg-slate-200 rounded-xl" />
        <div className="h-3 w-36 bg-slate-100 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="h-16 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-16 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-5 w-24 bg-slate-200 rounded" />
        </div>
      </div>

      <div className="h-4 w-full bg-slate-100 rounded-full" />

      <div className="pt-2 text-center text-xs text-slate-400 font-medium">
        {title}
      </div>
    </div>
  );
}
