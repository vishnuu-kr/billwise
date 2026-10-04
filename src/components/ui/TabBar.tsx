"use client";

import React, { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/cn";

export type TabBarItem = {
  id: string;
  label: string;
  // Drawn once and reused for both states: outline when idle, filled when
  // active, so the two can never drift apart.
  icon: React.ReactNode;
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// The pill and the widths share one spring so the row reflows as a single
// motion. No bounce: a pill that overshoots its tab reads as imprecise.
const SLIDE = { type: "spring", visualDuration: 0.3, bounce: 0 } as const;
const INSTANT = { duration: 0 } as const;
// Waits a beat for the tab to start widening, so the label fades into room
// that is opening rather than being squeezed.
const LABEL_IN = { duration: 0.2, delay: 0.05, ease: EASE_OUT };
const LABEL_OUT = { duration: 0.1, ease: EASE_OUT };

export function TabBar({
  items,
  value,
  onChange,
  label,
  idBase,
  className,
}: {
  items: readonly TabBarItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  // Lets the caller point tab panels back at their tabs.
  idBase: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const index = Math.max(
    items.findIndex((t) => t.id === value),
    0,
  );
  const layout = reduce ? INSTANT : SLIDE;

  return (
    <LayoutGroup id={idBase}>
      <div
        role="tablist"
        aria-label={label}
        className={cn("flex items-center justify-between", className)}
        onKeyDown={(e) => {
          const target = {
            ArrowRight: index + 1,
            ArrowLeft: index - 1,
            Home: 0,
            End: items.length - 1,
          }[e.key];
          if (target === undefined) return;
          e.preventDefault();
          // Automatic activation, animated exactly like a tap.
          const next = items[(target + items.length) % items.length].id;
          onChange(next);
          refs.current.get(next)?.focus();
        }}
      >
        {items.map((item) => {
          const active = item.id === items[index].id;
          return (
            <motion.button
              key={item.id}
              ref={(el) => {
                if (el) refs.current.set(item.id, el);
                else refs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={`${idBase}-tab-${item.id}`}
              aria-selected={active}
              aria-controls={active ? `${idBase}-panel-${item.id}` : undefined}
              aria-label={item.label}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.id)}
              layout
              // Only a change of tab moves anything, so unrelated renders
              // skip the measure.
              layoutDependency={value}
              transition={{ layout }}
              // Radius set in style so Motion can correct it while the
              // button's box is scaled mid-morph.
              style={{ borderRadius: 24 }}
              className={cn(
                "group relative flex h-12 touch-manipulation items-center overflow-hidden px-3 outline-hidden select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-foreground cursor-pointer",
                active ? "text-foreground font-medium" : "text-muted hover:text-foreground",
                "transition-[color] duration-150 ease-out",
              )}
            >
              {active && (
                <motion.span
                  layoutId="pill"
                  aria-hidden
                  className="absolute inset-0 bg-foreground/[0.08]"
                  style={{ borderRadius: 24 }}
                  transition={{ layout }}
                />
              )}
              {/* Position-only, so the icon and label ride along with the
                  morph without being stretched by it. */}
              <motion.span
                layout="position"
                layoutDependency={value}
                transition={{ layout }}
                className="relative flex items-center"
              >
                <span className="relative flex items-center gap-2 transition-[scale] duration-150 ease-out group-active:scale-[0.96] motion-reduce:transition-none">
                  <Icon active={active}>{item.icon}</Icon>
                  <AnimatePresence initial={false} mode="popLayout">
                    {active && (
                      <motion.span
                        key="label"
                        aria-hidden
                        initial={{
                          opacity: 0,
                          filter: reduce ? "blur(0px)" : "blur(4px)",
                        }}
                        animate={{
                          opacity: 1,
                          filter: "blur(0px)",
                          transition: LABEL_IN,
                        }}
                        exit={{
                          opacity: 0,
                          filter: "blur(0px)",
                          transition: LABEL_OUT,
                        }}
                        className="pr-1 text-sm font-semibold tracking-tight whitespace-nowrap text-foreground"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export function Icon({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="grid size-6 shrink-0" aria-hidden>
      <svg
        viewBox="0 0 24 24"
        className="col-start-1 row-start-1 size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
      {/* The fill floods out from the icon's middle and drains back in: a
          clip-path transition, so a quick second tap reverses it midway. */}
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "col-start-1 row-start-1 size-6 transition-[clip-path,opacity] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:[clip-path:none]",
          active
            ? "[clip-path:circle(75%_at_50%_55%)] opacity-100 duration-200"
            : "[clip-path:circle(0%_at_50%_55%)] opacity-0 duration-150",
        )}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}
