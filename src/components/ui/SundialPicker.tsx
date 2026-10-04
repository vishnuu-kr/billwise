'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SundialPickerProps {
  selectedHour?: number; // 0 to 23
  onChange?: (hour: number) => void;
  className?: string;
}

export function SundialPicker({
  selectedHour = 12,
  onChange,
  className,
}: SundialPickerProps) {
  const [hour, setHour] = useState(selectedHour);

  // Solar irradiance efficiency based on hour of day in Kerala
  const getSolarEfficiency = (h: number) => {
    if (h < 6 || h > 18) return 0;
    if (h >= 11 && h <= 14) return 100; // Peak solar window
    if ((h >= 9 && h < 11) || (h > 14 && h <= 16)) return 70;
    return 30;
  };

  const efficiency = getSolarEfficiency(hour);
  const isPeakSolar = hour >= 11 && hour <= 14;

  const handleHourSelect = (newHour: number) => {
    setHour(newHour);
    onChange?.(newHour);
  };

  // Convert hour to X position percentage along the arc
  const arcPercent = ((hour - 6) / 12) * 100;
  const isDaytime = hour >= 6 && hour <= 18;

  return (
    <div className={cn('relative rounded-3xl bg-zinc-900 text-white p-5 border border-zinc-800 shadow-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Sun className="size-4 text-amber-400 animate-spin-slow" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
            Solar Load Shifting Sundial
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs font-mono tabular-nums text-zinc-200">
          <span>{hour.toString().padStart(2, '0')}:00</span>
          <span className="text-[10px] text-zinc-400">IST</span>
        </div>
      </div>

      {/* Solar Arc Display */}
      <div className="relative h-32 w-full flex items-center justify-center my-2">
        {/* Parabolic SVG Arc */}
        <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
          {/* Base horizon line */}
          <line x1="10" y1="110" x2="290" y2="110" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Peak Solar Window Highlight (11 AM to 2 PM) */}
          <path
            d="M 125 110 Q 150 20 175 110"
            fill="none"
            stroke="rgba(245, 158, 11, 0.25)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Golden Solar Path */}
          <path
            d="M 20 110 Q 150 15 280 110"
            fill="none"
            stroke="url(#solarGradient)"
            strokeWidth="3"
          />

          <defs>
            <linearGradient id="solarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Sun Indicator Node */}
        {isDaytime ? (
          <motion.div
            className="absolute cursor-pointer flex flex-col items-center"
            style={{
              left: `${Math.max(8, Math.min(92, arcPercent))}%`,
              top: `${Math.max(10, Math.min(85, 100 - Math.sin(((hour - 6) / 12) * Math.PI) * 85))}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ scale: isPeakSolar ? [1, 1.12, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="size-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-amber-950 shadow-lg shadow-amber-500/50">
              <Sun className="size-5" />
            </div>
            {isPeakSolar && (
              <span className="text-[9px] font-bold tracking-tight bg-amber-500 text-black px-1.5 py-0.2 rounded-full mt-1 whitespace-nowrap">
                FREE SOLAR
              </span>
            )}
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center flex-col text-zinc-500">
            <Moon className="size-6 mb-1 text-zinc-600" />
            <span className="text-xs">Night Tariff Period (Zero Solar)</span>
          </div>
        )}
      </div>

      {/* Interactive Slider Bar */}
      <div className="space-y-2 pt-2">
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={hour}
          onChange={(e) => handleHourSelect(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>00:00</span>
          <span className="text-amber-400 font-semibold">12:00 (Peak Solar)</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Shifting Recommendation Card */}
      <div className="mt-4 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'size-7 rounded-xl flex items-center justify-center text-xs font-bold',
            isPeakSolar ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
          )}>
            <Zap className="size-4" />
          </div>
          <div>
            <div className="font-semibold text-zinc-200">
              {isPeakSolar ? 'Ideal Shifting Window' : 'Normal Grid Window'}
            </div>
            <div className="text-[11px] text-zinc-400">
              {isPeakSolar ? 'Run Washing Machine & Pump now at ₹0/unit' : 'Shift heavy loads to 11 AM - 2 PM for maximum solar savings'}
            </div>
          </div>
        </div>
        <span className="text-sm font-bold font-mono text-amber-400">
          {efficiency}%
        </span>
      </div>
    </div>
  );
}
