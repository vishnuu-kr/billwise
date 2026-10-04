'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DayUsage {
  date: string; // YYYY-MM-DD
  units: number;
  season?: 'summer' | 'monsoon' | 'normal';
}

export interface ContributionHeatmapProps {
  data?: DayUsage[];
  className?: string;
  year?: number;
}

export function ContributionHeatmap({
  data,
  className,
  year = 2026,
}: ContributionHeatmapProps) {
  // Generate 52 weeks x 7 days if no data provided
  const weeks = 52;
  const daysPerWeek = 7;
  const [hoveredCell, setHoveredCell] = useState<{ date: string; units: number } | null>(null);

  // Deterministic realistic Kerala domestic daily load (average 6 - 16 units/day)
  const getSimulatedUnits = (week: number, day: number) => {
    // Summer months (weeks 8 - 20): AC load surges
    const isSummer = week >= 8 && week <= 20;
    // Monsoon months (weeks 22 - 34): lower fan/AC usage
    const isMonsoon = week >= 22 && week <= 34;
    // Weekend surge
    const isWeekend = day === 0 || day === 6;

    let base = 7 + (Math.sin(week / 4) * 3) + (isWeekend ? 2.5 : 0);
    if (isSummer) base += 5.5;
    if (isMonsoon) base -= 2.0;

    return Math.max(2, Math.round(base * 10) / 10);
  };

  const getIntensityColor = (units: number) => {
    if (units < 5) return 'bg-emerald-950/40 border-emerald-900/30';
    if (units < 8) return 'bg-emerald-800/70 border-emerald-700/50';
    if (units < 12) return 'bg-emerald-600 border-emerald-500/60';
    if (units < 16) return 'bg-amber-500 border-amber-400';
    return 'bg-rose-500 border-rose-400'; // High AC surge (>16 units)
  };

  return (
    <div className={cn('rounded-3xl bg-zinc-900 border border-zinc-800 p-5 text-white shadow-xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            {year} Annual Energy Intensity Heatmap
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <span>Less</span>
          <span className="size-2.5 rounded-sm bg-emerald-950/60 border border-emerald-900/50" />
          <span className="size-2.5 rounded-sm bg-emerald-700" />
          <span className="size-2.5 rounded-sm bg-emerald-500" />
          <span className="size-2.5 rounded-sm bg-amber-500" />
          <span className="size-2.5 rounded-sm bg-rose-500" />
          <span>More</span>
        </div>
      </div>

      {/* 52-Week Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px] min-w-[640px]">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: daysPerWeek }).map((_, d) => {
                const dataIndex = w * 7 + d;
                const entry = data && data[dataIndex];
                const units = entry ? entry.units : getSimulatedUnits(w, d);
                const dayDate = entry ? entry.date : `Week ${w + 1}, Day ${d + 1}`;
                return (
                  <motion.div
                    key={d}
                    onMouseEnter={() => setHoveredCell({ date: dayDate, units })}
                    onMouseLeave={() => setHoveredCell(null)}
                    whileHover={{ scale: 1.4, zIndex: 10 }}
                    className={cn(
                      'size-[9px] rounded-[2px] cursor-pointer border transition-colors',
                      getIntensityColor(units)
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Axis Month Markers */}
      <div className="flex justify-between text-[10px] text-zinc-500 pt-1 font-mono">
        <span>Jan</span>
        <span>Mar (Summer AC Surge)</span>
        <span>Jun (Monsoon)</span>
        <span>Sep (Onam Peak)</span>
        <span>Dec</span>
      </div>

      {/* Active Inspector Footer */}
      <div className="mt-3 min-h-[36px] rounded-2xl bg-zinc-800/80 px-3.5 py-1.5 flex items-center justify-between text-xs border border-zinc-700/60">
        {hoveredCell ? (
          <>
            <span className="text-zinc-300 font-mono">{hoveredCell.date}</span>
            <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
              <Zap className="size-3.5" />
              <span>{hoveredCell.units} kWh / day</span>
              <span className="text-zinc-500 text-[10px]">
                (~₹{(hoveredCell.units * 6.5).toFixed(0)})
              </span>
            </div>
          </>
        ) : (
          <span className="text-zinc-500 text-[11px]">
            Hover any day to inspect daily kWh burn rate and summer air-conditioning surges
          </span>
        )}
      </div>
    </div>
  );
}
