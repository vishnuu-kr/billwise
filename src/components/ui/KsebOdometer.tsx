'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';

const GLYPHS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface DigitProps {
  digit: number;
  fractionProgress?: number;
}

function OdometerDigit({ digit }: DigitProps) {
  const shouldReduceMotion = useReducedMotion();

  const spring = useSpring(digit, {
    stiffness: 280,
    damping: 28,
    mass: 0.6,
  });

  useEffect(() => {
    spring.set(digit);
  }, [digit, spring]);

  // Translate digit by -10% per number (each number is 10% of the 10-item stack)
  const y = useTransform(spring, (v) => `-${v * 10}%`);

  if (shouldReduceMotion) {
    return (
      <span className="inline-block h-[1.15em] w-[0.58em] text-center font-sans tabular-nums leading-none">
        {digit}
      </span>
    );
  }

  return (
    <span className="relative inline-block h-[1.15em] w-[0.58em] overflow-hidden text-center font-sans tabular-nums leading-none select-none align-baseline">
      <motion.span
        style={{ y }}
        className="absolute inset-x-0 top-0 flex flex-col items-center justify-start"
      >
        {GLYPHS.map((g, idx) => (
          <span
            key={idx}
            className="flex h-[1.15em] w-full items-center justify-center leading-none"
          >
            {g}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export interface KsebOdometerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function KsebOdometer({
  value,
  prefix = '₹',
  suffix = '',
  decimals = 0,
  className,
  size = 'lg',
}: KsebOdometerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeVal = Math.max(0, isNaN(value) ? 0 : value);
  const formattedStr = decimals > 0 ? safeVal.toFixed(decimals) : Math.round(safeVal).toString();

  const [intPart, decPart] = formattedStr.split('.');

  // Format Indian comma style for integer part
  const formatIndianNumber = (numStr: string) => {
    if (numStr.length <= 3) return numStr;
    const last3 = numStr.slice(-3);
    const rest = numStr.slice(0, -3);
    const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${withCommas},${last3}`;
  };

  const formattedInt = formatIndianNumber(intPart);

  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold tracking-tight',
    xl: 'text-3xl font-extrabold tracking-tight',
    '2xl': 'text-4xl md:text-5xl font-black tracking-tight',
  }[size];

  if (!mounted) {
    return (
      <span className={cn('inline-flex items-baseline font-sans tabular-nums tracking-tight', sizeClasses, className)}>
        {prefix && <span className="font-sans font-medium text-muted-foreground mr-0.5 text-[0.8em]">{prefix}</span>}
        <span>{formattedStr}</span>
        {suffix && <span className="font-sans font-normal text-muted-foreground ml-0.5 text-[0.7em]">{suffix}</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-baseline font-sans tabular-nums leading-none tracking-tight text-[#17171C]',
        sizeClasses,
        className
      )}
      aria-label={`${prefix}${safeVal}${suffix}`}
    >
      {prefix && (
        <span className="font-sans font-medium text-[#71717A] mr-0.5 text-[0.8em] select-none self-baseline">
          {prefix}
        </span>
      )}

      {/* Integer digits and commas */}
      {formattedInt.split('').map((char, index) => {
        if (char === ',') {
          return (
            <span
              key={`comma-${index}`}
              className="relative inline-flex items-end justify-center h-[1.15em] w-[0.24em] select-none text-current pb-[0.14em]"
            >
              ,
            </span>
          );
        }
        const digitNum = parseInt(char, 10);
        return <OdometerDigit key={`int-${index}`} digit={digitNum} />;
      })}

      {/* Decimal separator and digits */}
      {decPart && (
        <>
          <span className="relative inline-flex items-end justify-center h-[1.15em] w-[0.24em] select-none text-current pb-[0.14em]">.</span>
          {decPart.split('').map((char, index) => {
            const digitNum = parseInt(char, 10);
            return <OdometerDigit key={`dec-${index}`} digit={digitNum} />;
          })}
        </>
      )}

      {suffix && (
        <span className="font-sans font-normal text-[#71717A] ml-0.5 text-[0.7em] select-none">
          {suffix}
        </span>
      )}
    </span>
  );
}
