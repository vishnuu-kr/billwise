'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sun, Zap, Scale } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SolarBalanceScaleProps {
  gridImportKwh: number;
  solarExportKwh: number;
  className?: string;
}

export function SolarBalanceScale({
  gridImportKwh,
  solarExportKwh,
  className,
}: SolarBalanceScaleProps) {
  // Max tilt angle ±18 degrees
  const diff = solarExportKwh - gridImportKwh;
  const maxSpan = Math.max(100, gridImportKwh + solarExportKwh);
  const ratio = Math.max(-1, Math.min(1, diff / (maxSpan * 0.5)));
  const tiltAngle = ratio * -18; // Positive export tilts right pan down

  const isNetSurplus = solarExportKwh >= gridImportKwh;
  const netUnits = Math.abs(diff);

  return (
    <div
      className={cn(
        'rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 shadow-sm select-none',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[#17171C]">
          <Scale className="size-4 text-amber-500" />
          <span>Solar Net-Metering Balance</span>
        </div>
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
            isNetSurplus
              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
          )}
        >
          {isNetSurplus ? `Net Export (+${netUnits.toFixed(0)}u)` : `Net Grid Draw (-${netUnits.toFixed(0)}u)`}
        </span>
      </div>

      {/* Interactive Scale Rig */}
      <div className="relative h-36 w-full flex flex-col items-center justify-center">
        {/* Scale Fulcrum & Post */}
        <div className="absolute bottom-2 w-4 h-20 bg-zinc-300 rounded-t-sm" />
        <div className="absolute bottom-0 w-16 h-3 bg-zinc-400 rounded-full" />
        <div className="absolute top-8 size-4 rounded-full bg-zinc-600 border-2 border-white z-20" />

        {/* Tilting Beam */}
        <motion.div
          animate={{ rotate: tiltAngle }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          className="relative w-64 h-2 bg-zinc-600 rounded-full origin-center flex justify-between items-center px-1 z-10"
        >
          {/* Left Pan (Grid Import) */}
          <div className="relative flex flex-col items-center -ml-3">
            <div className="w-0.5 h-12 bg-zinc-400" />
            <div className="size-16 rounded-xl bg-zinc-50 border border-zinc-200 shadow-xs flex flex-col items-center justify-center p-1 text-center">
              <Zap className="size-3.5 text-amber-500 mb-0.5" />
              <span className="text-[10px] text-zinc-500 font-sans">Grid Import</span>
              <span className="text-xs font-mono font-bold text-[#17171C]">
                {gridImportKwh}u
              </span>
            </div>
          </div>

          {/* Right Pan (Solar Export) */}
          <div className="relative flex flex-col items-center -mr-3">
            <div className="w-0.5 h-12 bg-zinc-400" />
            <div className="size-16 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-xs flex flex-col items-center justify-center p-1 text-center">
              <Sun className="size-3.5 text-amber-500 mb-0.5" />
              <span className="text-[10px] text-amber-800 font-sans">Solar Gen</span>
              <span className="text-xs font-mono font-bold text-amber-700">
                {solarExportKwh}u
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <p className="text-[11px] text-center text-zinc-500 mt-2">
        {isNetSurplus
          ? `You have a surplus of ${netUnits.toFixed(0)} units banked with KSEB to offset future bimonthly bills.`
          : `Grid import exceeds solar generation by ${netUnits.toFixed(0)} units, billed under domestic LT-1A.`}
      </p>
    </div>
  );
}
