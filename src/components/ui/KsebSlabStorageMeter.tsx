'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import { ShieldAlert, Zap, Info } from 'lucide-react';

export interface SlabTier {
  id: string;
  label: string;
  min: number;
  max: number;
  rate: number;
  color: string;
  description: string;
}

export const KSEB_DEFAULT_SLABS: SlabTier[] = [
  { id: 's1', label: '0–100u', min: 0, max: 100, rate: 3.40, color: '#10b981', description: 'Lifeline Tier @ ₹3.40/u' },
  { id: 's2', label: '101–150u', min: 100, max: 150, rate: 4.10, color: '#06b6d4', description: 'Tier 2 @ ₹4.10/u' },
  { id: 's3', label: '151–200u', min: 150, max: 200, rate: 4.80, color: '#6366f1', description: 'Tier 3 @ ₹4.80/u' },
  { id: 's4', label: '201–250u', min: 200, max: 250, rate: 6.10, color: '#f59e0b', description: 'Tier 4 (240u Subsidy Cliff) @ ₹6.10/u' },
  { id: 's5', label: '251–500u', min: 250, max: 500, rate: 7.90, color: '#ea580c', description: 'Higher Consumption Tiers' },
  { id: 's6', label: '>500u', min: 500, max: 800, rate: 9.30, color: '#e11d48', description: 'Non-Telescopic Punitive Flat Rate' },
];

export interface KsebSlabStorageMeterProps {
  units: number;
  maxScale?: number;
  slabs?: SlabTier[];
  className?: string;
  showBreakdown?: boolean;
}

export interface AllocatedSlabTier extends SlabTier {
  allocatedUnits: number;
  cost: number;
}

export function KsebSlabStorageMeter({
  units,
  maxScale = 500,
  slabs = KSEB_DEFAULT_SLABS,
  className,
  showBreakdown = true,
}: KsebSlabStorageMeterProps) {
  const [hoveredSlab, setHoveredSlab] = useState<AllocatedSlabTier | null>(null);

  const safeUnits = Math.max(0, units || 0);
  const isSubsidyCliffAtRisk = safeUnits >= 210 && safeUnits <= 240;
  const isSubsidyForfeited = safeUnits > 240;
  const isNonTelescopic = safeUnits > 500;

  // Calculate allocated units per slab
  const allocations = slabs.map((slab) => {
    if (safeUnits <= slab.min) {
      return { ...slab, allocatedUnits: 0, cost: 0 };
    }
    const slabSpan = slab.max - slab.min;
    const allocated = Math.min(slabSpan, safeUnits - slab.min);
    return {
      ...slab,
      allocatedUnits: allocated,
      cost: allocated * slab.rate,
    };
  });

  const cliffPercent = (240 / maxScale) * 100;

  return (
    <div
      className={cn(
        'glass-card p-4 sm:p-5 rounded-2xl transition-all',
        className
      )}
    >
      {/* Header with Title and Current Fill */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="size-4 text-amber-500 fill-amber-500/20" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--secondary)]">
            Telescopic Slab Allocation
          </span>
        </div>
        <div className="flex items-baseline gap-1 text-xs">
          <span className="font-mono font-bold text-[var(--foreground)] text-sm num-tabular">
            {safeUnits}
          </span>
          <span className="text-[var(--secondary)] text-[11px] num-tabular">/ {maxScale} kWh</span>
        </div>
      </div>

      {/* Subsidy Cliff Top Marker (cleanly above the track, no collision) */}
      <div className="relative h-5 w-full mb-1">
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all"
          style={{ left: `${cliffPercent}%` }}
        >
          <span className="text-[9px] font-semibold text-rose-600 bg-rose-50/90 border border-rose-200 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap shadow-2xs">
            240u Subsidy Limit
          </span>
          <div className="w-1.5 h-1 border-l-2 border-r-2 border-t-2 border-transparent border-t-rose-400 mt-0.5" />
        </div>
      </div>

      {/* Segmented Meter Track */}
      <div className="relative">
        <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-black/[0.04] p-0.5 flex gap-1 border border-black/[0.06]">
          {allocations.map((slab) => {
            const slabCapacity = slab.max - slab.min;
            const widthPct = (slabCapacity / maxScale) * 100;
            const fillRatio = Math.min(1, Math.max(0, slab.allocatedUnits / slabCapacity));

            return (
              <div
                key={slab.id}
                style={{ width: `${widthPct}%` }}
                className="relative h-full overflow-hidden rounded-full bg-black/[0.06] cursor-pointer transition-transform hover:scale-y-110"
                onMouseEnter={() => setHoveredSlab(slab)}
                onMouseLeave={() => setHoveredSlab(null)}
              >
                {/* Active fill with spring motion */}
                <motion.div
                  initial={false}
                  animate={{ width: `${fillRatio * 100}%` }}
                  transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                  style={{ backgroundColor: slab.color }}
                  className="h-full rounded-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Subsidy Status Alert Strip */}
      <AnimatePresence mode="wait">
        {isNonTelescopic ? (
          <motion.div
            key="non-telescopic"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs text-rose-900 font-medium"
          >
            <ShieldAlert className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Above 500 kWh: Non-telescopic Billing</span>
              <p className="text-[11px] text-rose-700 font-normal leading-relaxed">
                Telescopic discounts are forfeited. All consumed units are charged at a single flat high rate.
              </p>
            </div>
          </motion.div>
        ) : isSubsidyForfeited ? (
          <motion.div
            key="subsidy-lost"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-900 font-medium"
          >
            <ShieldAlert className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Kerala Govt Subsidy Discontinued</span>
              <p className="text-[11px] text-amber-800 font-normal leading-relaxed">
                Usage crossed 240 units. State electricity subsidy of up to ₹148 is no longer applied.
              </p>
            </div>
          </motion.div>
        ) : isSubsidyCliffAtRisk ? (
          <motion.div
            key="subsidy-warning"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-900 font-medium"
          >
            <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Subsidy Cliff Approaching</span>
              <p className="text-[11px] text-amber-800 font-normal leading-relaxed">
                {safeUnits === 240
                  ? 'Reached 240 units ceiling. Exceeding 240 units will forfeit your ₹148 state subsidy.'
                  : `Only ${240 - safeUnits} units remaining before crossing 240 units and losing the ₹148 subsidy.`}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Slabs Legend and Hover Details */}
      {showBreakdown && (
        <div className="mt-3 pt-3 border-t border-[var(--separator)]">
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {allocations.map((slab) => {
              const isActive = slab.allocatedUnits > 0;
              return (
                <div
                  key={slab.id}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors',
                    isActive
                      ? 'bg-black/[0.04] text-[var(--foreground)] font-medium'
                      : 'opacity-50 text-[var(--secondary)]'
                  )}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: slab.color }}
                  />
                  <span>{slab.label}</span>
                  {isActive && (
                    <span className="font-mono text-[10px] text-[var(--secondary)] num-tabular">
                      ({slab.allocatedUnits}u)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {hoveredSlab && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-[11px] text-[var(--secondary)] font-mono"
            >
              {hoveredSlab.description} — {hoveredSlab.allocatedUnits} units billed = ₹{hoveredSlab.cost.toFixed(2)}
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
}
