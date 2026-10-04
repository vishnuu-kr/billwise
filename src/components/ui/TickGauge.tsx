"use client";

import React, { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import { cn } from "@/lib/cn";

// No bounce: an arc that overshoots would briefly show a value that isn't
// true. Longer than a UI transition because the eye has to follow a change
// in magnitude, not just notice one.
const FILL = { visualDuration: 0.6, bounce: 0 };

// Instrument geometry in viewBox units: a half circle of ticks centred on
// (CX, CY), read left to right as 0 to 100.
const CX = 100;
const CY = 100;
const R = 84;
// 41 ticks is one every 2.5%, about 6.6 units apart on the arc: dense
// enough to read as a sweep, sparse enough that each tick is its own mark.
const TICKS = 41;
const TICK_IN = R - 8;
const TICK_OUT = R + 8;
// The peak marker reaches past the ticks on both sides so it stays legible
// on top of a lit run.
const PEAK_IN = R - 13;
const PEAK_OUT = R + 13;
// Peak hold, as on an audio meter: after a drop the marker waits where the
// value was, long enough to be seen (the fill settles in ~600ms), then falls.
const PEAK_HOLD = 900;
// An ease-in on purpose: the marker is let go and drops under its own
// weight, so it starts slow and lands fast.
const PEAK_FALL = { duration: 0.45, ease: [0.55, 0, 1, 0.45] } as const;

function pointAt(percent: number, radius: number) {
  const angle = Math.PI * (1 - percent / 100);
  // Rounded because the server's and the browser's trig can differ in the
  // last float digits, which would fail hydration on every tick.
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return [round(CX + radius * Math.cos(angle)), round(CY - radius * Math.sin(angle))];
}

const TICK_PERCENTS = Array.from({ length: TICKS }, (_, i) => (i / (TICKS - 1)) * 100);

export interface TickGaugeProps {
  value: number; // 0 to 100 percentage
  label?: string;
  threshold?: number; // default 48 for 240/500 units
  displayValue?: number; // e.g. Rupee bill amount or Units
  prefix?: string;
  unit?: string;
  sublabel?: string;
  className?: string;
}

export function TickGauge({
  value,
  label = "Kerala LT-1A Usage",
  threshold = 48,
  displayValue,
  prefix = "₹",
  unit = "",
  sublabel,
  className,
}: TickGaugeProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(SVGLineElement | null)[]>([]);
  const lit = useRef(0);
  const inView = useInView(rootRef, { once: true });
  const clamped = Math.round(Math.min(Math.max(value, 0), 100));
  const high = clamped > threshold;

  // One spring drives the ticks, the number and the peak so they never drift apart.
  const progress = useSpring(0, FILL);
  const shownProgress = useTransform(progress, (v) => Math.round(v));
  
  // If displayValue is provided, smoothly spring to displayValue
  const displaySpring = useSpring(displayValue ?? clamped, FILL);
  const shownDisplay = useTransform(displaySpring, (v) => Math.round(v).toLocaleString("en-IN"));

  const peak = useMotionValue(0);
  const fall = useRef<AnimationPlaybackControls>(undefined);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      progress.jump(clamped);
      if (displayValue !== undefined) displaySpring.jump(displayValue);
    } else {
      progress.set(clamped);
      if (displayValue !== undefined) displaySpring.set(displayValue);
    }

    if (clamped >= peak.get()) return;
    const timer = setTimeout(() => {
      fall.current?.stop();
      if (reduceMotion) peak.jump(clamped);
      else fall.current = animate(peak, clamped, PEAK_FALL);
    }, PEAK_HOLD);
    return () => clearTimeout(timer);
  }, [clamped, displayValue, inView, reduceMotion, progress, displaySpring, peak]);

  useEffect(() => () => fall.current?.stop(), []);

  // Lights ticks as the fill passes them
  useMotionValueEvent(progress, "change", (v) => {
    if (v > peak.get()) {
      fall.current?.stop();
      peak.set(v);
    }
    const count = v < 0.5 ? 0 : TICK_PERCENTS.filter((p) => p <= v + 0.5).length;
    const before = lit.current;
    if (count === before) return;
    for (let i = Math.min(count, before); i < Math.max(count, before); i++) {
      const tick = tickRefs.current[i];
      if (tick) tick.dataset.lit = String(i < count);
    }
    lit.current = count;
  });

  const peakOpacity = useTransform([peak, progress], ([p, v]: number[]) =>
    Math.min(Math.max((p - v - 1) / 3, 0), 1)
  );
  const px1 = useTransform(peak, (p) => pointAt(p, PEAK_IN)[0]);
  const py1 = useTransform(peak, (p) => pointAt(p, PEAK_IN)[1]);
  const px2 = useTransform(peak, (p) => pointAt(p, PEAK_OUT)[0]);
  const py2 = useTransform(peak, (p) => pointAt(p, PEAK_OUT)[1]);

  return (
    <div
      ref={rootRef}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={`${prefix}${displayValue ?? clamped}${unit}${high ? ", high/cliff" : ""}`}
      className={cn("flex w-[320px] max-w-full flex-col items-center select-none", className)}
    >
      <div className="relative w-full">
        <svg
          viewBox="0 0 200 110"
          className="block w-full overflow-visible"
          fill="none"
          aria-hidden
        >
          {TICK_PERCENTS.map((p, i) => {
            const [x1, y1] = pointAt(p, TICK_IN);
            const [x2, y2] = pointAt(p, TICK_OUT);
            const danger = p > threshold;
            return (
              <line
                key={i}
                ref={(el) => {
                  tickRefs.current[i] = el;
                }}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                data-lit="false"
                strokeWidth={2.5}
                strokeLinecap="round"
                className={cn(
                  "transition-[stroke] duration-150 ease-out motion-reduce:transition-none",
                  danger
                    ? "stroke-amber-500/20 data-[lit=true]:stroke-amber-500"
                    : "stroke-black/10 data-[lit=true]:stroke-[#006FEE]"
                )}
              />
            );
          })}
          <motion.line
            x1={px1}
            y1={py1}
            x2={px2}
            y2={py2}
            style={{ opacity: peakOpacity }}
            strokeWidth={2.5}
            strokeLinecap="round"
            className="stroke-amber-500"
          />
        </svg>

        {/* Tabular so the width holds steady while the number counts. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center text-center leading-none pointer-events-none"
        >
          <div className="flex items-baseline justify-center text-[44px] sm:text-[50px] font-bold tracking-tight text-[#17171C] num-tabular">
            {prefix && <span className="text-2xl sm:text-3xl font-semibold mr-1 text-[#71717A]">{prefix}</span>}
            <motion.span>{displayValue !== undefined ? shownDisplay : shownProgress}</motion.span>
            {unit && <span className="ml-1 text-sm sm:text-base font-medium text-[#71717A]">{unit}</span>}
          </div>
          {sublabel && (
            <span className="text-[12px] font-medium text-[#71717A] mt-2 num-tabular">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <div aria-hidden className="relative mt-2.5 flex items-center justify-center gap-2 text-[13px] font-medium">
        <span className="text-[#71717A]">{label}</span>
        {high && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Non-Telescopic
          </span>
        )}
      </div>
    </div>
  );
}
