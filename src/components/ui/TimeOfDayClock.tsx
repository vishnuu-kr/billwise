'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Moon, Sun, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

export function TimeOfDayClock({ className }: { className?: string }) {
  const [currentHour, setCurrentHour] = useState(14);
  const [currentMinute, setCurrentMinute] = useState(30);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentMinute(now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalMinutes = currentHour * 60 + currentMinute;
  const timeAngle = (totalMinutes / (24 * 60)) * 360;

  // Determine active zone
  let activeZone: 'peak' | 'offpeak' | 'normal' = 'normal';
  if (currentHour >= 18 && currentHour < 22) {
    activeZone = 'peak';
  } else if (currentHour >= 22 || currentHour < 6) {
    activeZone = 'offpeak';
  }

  const zoneInfo = {
    peak: {
      label: 'Peak Hour Surcharge (+20%)',
      color: 'text-amber-800 bg-amber-500/10 border-amber-500/25',
      badgeColor: 'text-amber-700 bg-amber-50',
      desc: '18:00 to 22:00 — Heavy tariff penalty. Avoid running water pumps, washing machines, and geysers.',
    },
    offpeak: {
      label: 'Off-Peak Incentive Rebate (-10%)',
      color: 'text-emerald-800 bg-emerald-500/10 border-emerald-500/25',
      badgeColor: 'text-emerald-700 bg-emerald-50',
      desc: '22:00 to 06:00 — Cheapest energy window. Ideal time for charging EVs and running heavy loads.',
    },
    normal: {
      label: 'Normal Day Rate (100%)',
      color: 'text-[#006FEE] bg-[#006FEE]/10 border-[#006FEE]/25',
      badgeColor: 'text-[#006FEE] bg-blue-50',
      desc: '06:00 to 18:00 — Standard KSEB base telescopic domestic tariff rates apply.',
    },
  }[activeZone];

  return (
    <div className={cn('glass-card p-4 sm:p-5 rounded-2xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
          <Clock className="size-4 text-[#006FEE]" />
          <span>KSEB Time-of-Day (ToD) Clock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold text-[var(--secondary)] num-tabular">
            {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')} IST
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* SVG Circular 24-Hour Dial */}
        <div className="relative size-36 shrink-0 flex items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 100 100">
            {/* Track Background */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E4E4E7"
              strokeWidth="11"
            />

            {/* Normal Zone (06:00 to 18:00 = 50% circle from 90 deg to 270 deg) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#006FEE"
              strokeWidth="11"
              strokeDasharray={`${(12 / 24) * 251.2} 251.2`}
              strokeDashoffset={`-${(6 / 24) * 251.2}`}
              className="opacity-85"
            />

            {/* Peak Zone (18:00 to 22:00 = 4 hours) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#F5A524"
              strokeWidth="11"
              strokeDasharray={`${(4 / 24) * 251.2} 251.2`}
              strokeDashoffset={`-${(18 / 24) * 251.2}`}
              className="opacity-95"
            />

            {/* Off-Peak Zone (22:00 to 06:00 = 8 hours) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#17C964"
              strokeWidth="11"
              strokeDasharray={`${(8 / 24) * 251.2} 251.2`}
              strokeDashoffset={`-${(22 / 24) * 251.2}`}
              className="opacity-85"
            />
          </svg>

          {/* Dial Center Hub & Needle Hand */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `rotate(${timeAngle}deg)` }}
          >
            {/* Precision needle pointer */}
            <div className="w-[2.5px] h-15 bg-[#17171C] -translate-y-7 rounded-full shadow-sm" />
          </div>

          {/* Clean Metallic Center Hub Cap (no text collision) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="size-3.5 rounded-full bg-[#17171C] border-2 border-white shadow-xs" />
          </div>

          {/* Subtle 24h indicator badge placed safely below the hub */}
          <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-[var(--tertiary)] uppercase tracking-wider">
              24h cycle
            </span>
          </div>
        </div>

        {/* Active Status & Recommendation */}
        <div className="flex-1 space-y-2 text-xs w-full">
          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold', zoneInfo.color)}>
            {activeZone === 'peak' ? (
              <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
            ) : activeZone === 'offpeak' ? (
              <Moon className="size-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Sun className="size-3.5 text-[#006FEE] shrink-0" />
            )}
            <span>{zoneInfo.label}</span>
          </div>
          <p className="text-[var(--secondary)] leading-relaxed text-xs">
            {zoneInfo.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
