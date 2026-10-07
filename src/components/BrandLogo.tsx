'use client';

import React from 'react';

interface BrandIconProps {
  size?: number;
  className?: string;
  color?: string;
  secondaryColor?: string;
}

export function BrandIcon({
  size = 20,
  className = '',
  color = 'var(--accent)',
  secondaryColor = 'var(--foreground)',
}: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BILLWISE logo mark"
      role="img"
    >
      {/* Precision Dual-Shard Energy Mark */}
      <polygon points="144,16 64,132 118,132 156,94 132,94" fill={color} />
      <polygon points="112,240 192,124 138,124 100,162 124,162" fill={secondaryColor} />
    </svg>
  );
}

interface BrandLogoProps {
  size?: number;
  showBeta?: boolean;
  className?: string;
}

export function BrandLogo({ size = 20, showBeta = true, className = '' }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <BrandIcon size={size} />
      <div className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          BILLWISE
        </span>
        {showBeta && (
          <span className="text-[9px] font-bold tracking-[0.05em] px-1.5 py-0.5 rounded-full bg-black/[0.05] text-[#71717A] uppercase leading-none">
            beta
          </span>
        )}
      </div>
    </div>
  );
}
