'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { KsebOdometer } from '@/components/ui/KsebOdometer';

interface RadialEnergyGaugeProps {
  units: number;
  maxUnits?: number;
  estimatedBill: number;
  dailyPace: string | number;
  className?: string;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

export default function RadialEnergyGauge({
  units,
  maxUnits = 500,
  estimatedBill,
  dailyPace,
  className = '',
}: RadialEnergyGaugeProps) {
  const { lang } = useLanguage();

  // Kerala Subsidy limit is 240 units for 60-day cycle
  const isNearLimit = units > 200 && units <= 240;
  const isExceeded = units > 240;

  // Arc spans 220 degrees: from -110° to +110°
  const START_ANGLE = -110;
  const TOTAL_DEGREES = 220;
  const clampedUnits = Math.max(0, Math.min(units, maxUnits));
  const progressRatio = clampedUnits / maxUnits;
  const activeEndAngle = START_ANGLE + progressRatio * TOTAL_DEGREES;

  // SVG dimensions
  const CX = 130;
  const CY = 125;
  const RADIUS = 92;
  const STROKE_WIDTH = 12;

  const bgArc = describeArc(CX, CY, RADIUS, START_ANGLE, START_ANGLE + TOTAL_DEGREES);
  const progressArc = progressRatio > 0.01 
    ? describeArc(CX, CY, RADIUS, START_ANGLE, Math.min(START_ANGLE + TOTAL_DEGREES, activeEndAngle))
    : '';

  // 240-unit threshold tick angle
  const thresholdRatio = Math.min(1, 240 / maxUnits);
  const thresholdAngle = START_ANGLE + thresholdRatio * TOTAL_DEGREES;
  const tickOuter = polarToCartesian(CX, CY, RADIUS + STROKE_WIDTH / 2 + 3, thresholdAngle);
  const tickInner = polarToCartesian(CX, CY, RADIUS - STROKE_WIDTH / 2 - 3, thresholdAngle);

  // Color selection
  let progressColor = '#006FEE'; // Primary blue
  let glowColor = 'rgba(0, 111, 238, 0.25)';
  let statusBadgeBg = 'rgba(0, 111, 238, 0.08)';
  let statusBadgeBorder = 'rgba(0, 111, 238, 0.20)';
  let statusTextColor = '#006FEE';
  let statusLabel = lang === 'ml' ? 'സബ്‌സിഡി സുരക്ഷിത തലം' : 'Safe Subsidy Tier';

  if (isNearLimit) {
    progressColor = '#F5A524'; // Amber
    glowColor = 'rgba(245, 165, 36, 0.25)';
    statusBadgeBg = 'rgba(245, 165, 36, 0.10)';
    statusBadgeBorder = 'rgba(245, 165, 36, 0.30)';
    statusTextColor = '#B45309';
    statusLabel = lang === 'ml' ? '240 യൂണിറ്റ് അടുക്കുന്നു' : 'Near 240u Subsidy Limit';
  } else if (isExceeded) {
    progressColor = '#F31260'; // Coral Red
    glowColor = 'rgba(243, 18, 96, 0.25)';
    statusBadgeBg = 'rgba(243, 18, 96, 0.10)';
    statusBadgeBorder = 'rgba(243, 18, 96, 0.30)';
    statusTextColor = '#BE123C';
    statusLabel = lang === 'ml' ? 'സബ്‌സിഡി പരിധി കഴിഞ്ഞു' : 'Above Subsidy (High Slab)';
  }

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* SVG Arc Display */}
      <div className="relative w-[260px] h-[175px]">
        <svg
          viewBox="0 0 260 175"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="arcTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EAEAEC" />
              <stop offset="100%" stopColor="#E2E2E6" />
            </linearGradient>
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={glowColor} />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={bgArc}
            fill="none"
            stroke="url(#arcTrackGrad)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />

          {/* 240-unit Threshold Marker */}
          <line
            x1={tickInner.x}
            y1={tickInner.y}
            x2={tickOuter.x}
            y2={tickOuter.y}
            stroke="#71717A"
            strokeWidth={2}
            strokeDasharray="2,2"
            opacity={0.7}
          />

          {/* Active Progress Arc */}
          {progressArc && (
            <path
              d={progressArc}
              fill="none"
              stroke={progressColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              filter="url(#arcGlow)"
              style={{ transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          )}
        </svg>

        {/* Center Readout Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 text-center pointer-events-none">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--tertiary)]">
            {lang === 'ml' ? 'അടുത്ത ബിൽ' : 'Projected Bill'}
          </span>
          <div className="flex items-baseline justify-center mt-1">
            <KsebOdometer value={estimatedBill} size="xl" />
          </div>
          <div className="text-[13px] font-medium text-[var(--secondary)] mt-1.5 num-tabular">
            {units} <span className="text-[11px] font-normal text-[var(--tertiary)]">{lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}</span>
            <span className="mx-1.5 opacity-40">·</span>
            {dailyPace} <span className="text-[11px] font-normal text-[var(--tertiary)]">{lang === 'ml' ? 'യു/ദി' : 'u/day'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Status Chip */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-200 mt-1"
        style={{
          backgroundColor: statusBadgeBg,
          border: `1px solid ${statusBadgeBorder}`,
          color: statusTextColor,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: statusTextColor }}
        />
        <span>{statusLabel}</span>
      </div>
    </div>
  );
}
