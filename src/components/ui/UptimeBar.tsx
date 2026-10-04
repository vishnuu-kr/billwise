'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DayUptime {
  day: number;
  date: string;
  status: 'normal' | 'outage' | 'fluctuation';
  durationMins?: number;
  note?: string;
}

export interface UptimeBarProps {
  days?: DayUptime[];
  uptimePercentage?: number;
  className?: string;
}

export function UptimeBar({
  days,
  uptimePercentage = 99.4,
  className,
}: UptimeBarProps) {
  // Default 60-day bimonthly sample data if none provided
  const cycleDays: DayUptime[] = days || Array.from({ length: 60 }, (_, i) => {
    const isOutage = i === 14 || i === 42;
    const isFluctuation = i === 28;
    return {
      day: i + 1,
      date: `Day ${i + 1}`,
      status: isOutage ? 'outage' : isFluctuation ? 'fluctuation' : 'normal',
      durationMins: isOutage ? (i === 14 ? 45 : 30) : isFluctuation ? 15 : 0,
      note: isOutage ? 'Transformer maintenance' : isFluctuation ? 'Voltage dip' : 'Continuous grid supply',
    };
  });

  const [hoveredDay, setHoveredDay] = useState<DayUptime | null>(null);

  const getStatusColor = (status: DayUptime['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-emerald-500 hover:bg-emerald-400';
      case 'fluctuation':
        return 'bg-amber-500 hover:bg-amber-400';
      case 'outage':
        return 'bg-rose-500 hover:bg-rose-400';
    }
  };

  return (
    <div className={cn('rounded-3xl bg-zinc-900/90 border border-zinc-800 p-4 text-white shadow-md', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span className="font-semibold text-zinc-300">60-Day Grid Continuity</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
          <span>{uptimePercentage}%</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-sans">Uptime</span>
        </div>
      </div>

      {/* Micro-Segmented Bar (60 days) */}
      <div className="flex items-center gap-[2.5px] h-8 w-full py-1">
        {cycleDays.map((d) => (
          <motion.div
            key={d.day}
            onMouseEnter={() => setHoveredDay(d)}
            onMouseLeave={() => setHoveredDay(null)}
            whileHover={{ scaleY: 1.25, translateY: -2 }}
            className={cn(
              'flex-1 h-full rounded-sm cursor-pointer transition-colors duration-150',
              getStatusColor(d.status)
            )}
          />
        ))}
      </div>

      {/* Axis & Subtext */}
      <div className="flex justify-between items-center pt-2 text-[10px] text-zinc-500 font-mono">
        <span>Day 1 (Cycle Start)</span>
        <span>Day 60 (Billing Due)</span>
      </div>

      {/* Tooltip / Active Detail Panel */}
      <div className="mt-3 min-h-[34px] rounded-xl bg-zinc-800/80 px-3 py-1.5 flex items-center justify-between text-xs border border-zinc-700/50">
        {hoveredDay ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-zinc-200">{hoveredDay.date}:</span>
              <span className="text-zinc-400">{hoveredDay.note}</span>
            </div>
            {hoveredDay.durationMins ? (
              <span className="text-rose-400 font-mono font-medium">
                -{hoveredDay.durationMins}m
              </span>
            ) : (
              <span className="text-emerald-400 font-mono">24h 100% OK</span>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <Info className="size-3.5 text-zinc-500" />
            <span>Hover any day bar to view logged power continuity and load-shedding</span>
          </div>
        )}
      </div>
    </div>
  );
}
