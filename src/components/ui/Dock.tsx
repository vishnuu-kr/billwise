'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type Transition,
} from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { cn } from '@/lib/cn';

const REST = 42;
const PEAK = 70;
// How far from the cursor, in px, an icon still feels the pull.
const REACH = 140;
// Light mass so the icons keep up with a fast cursor; low damping leaves a
// small settle, which is what makes the dock feel springy rather than scripted.
const SIZE_SPRING = { mass: 0.1, stiffness: 170, damping: 12 };
// The first label waits so a cursor passing through doesn't flash one.
const TOOLTIP_DELAY = 300;
// The launch: two hops, the second lower, like something being thrown up
// and caught. 700ms is well past the UI budget on purpose: it is the
// "starting up" signal itself, it happens once per app, and input is never
// blocked while it plays.
const HOP: { y: number[]; transition: Transition } = {
  y: [0, -22, 0, -9, 0],
  // Up fast and down with gravity; each landing is the quickest part.
  transition: {
    duration: 0.7,
    times: [0, 0.3, 0.55, 0.78, 1],
    ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'],
  },
};
// Squashes on each landing, so the icon reads as having weight.
const SQUASH: { scaleX: number[]; scaleY: number[]; transition: Transition } = {
  scaleY: [1, 1.04, 0.9, 1.02, 0.96, 1],
  scaleX: [1, 0.97, 1.08, 0.99, 1.03, 1],
  transition: { duration: 0.7, times: [0, 0.3, 0.55, 0.7, 0.8, 1] },
};

export type Item = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

type Tip = { label: string; instant: boolean };

export function Dock({
  items,
  defaultRunning = [],
  running: controlledRunning,
  onLaunch,
  className,
}: {
  items: Item[];
  // Labels of the apps that start with a running light under them.
  defaultRunning?: string[];
  running?: string[];
  onLaunch?: (label: string, item: Item) => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(Infinity);
  const [tip, setTip] = useState<Tip | null>(null);
  const [internalRunning, setInternalRunning] = useState(defaultRunning);
  const running = controlledRunning ?? internalRunning;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showTip = (label: string) => {
    clearTimeout(timer.current);
    // Once a label is up, moving along the dock swaps it with no delay and no
    // animation, so scanning the icons feels instant.
    if (tip) setTip({ label, instant: true });
    else
      timer.current = setTimeout(
        () => setTip({ label, instant: false }),
        TOOLTIP_DELAY
      );
  };

  const hideTip = () => {
    clearTimeout(timer.current);
    setTip(null);
  };

  return (
    <nav
      aria-label="Dock"
      className={cn(
        'flex h-16 items-end gap-2.5 rounded-full bg-white/94 backdrop-blur-2xl border border-black/[0.08] px-3 pb-3 shadow-raised transition-all select-none',
        className
      )}
      onPointerMove={(e) => {
        if (reduceMotion || e.pointerType === 'touch') return;
        mouseX.set(e.clientX);
      }}
      onPointerLeave={() => {
        mouseX.set(Infinity);
        hideTip();
      }}
    >
      {items.map((item) => (
        <DockItem
          key={item.label}
          item={item}
          mouseX={mouseX}
          tip={tip?.label === item.label ? tip : null}
          onEnter={() => showTip(item.label)}
          onFocus={() => setTip({ label: item.label, instant: false })}
          onBlur={hideTip}
          running={running.includes(item.label)}
          onLaunch={() => {
            if (!controlledRunning) {
              setInternalRunning((r) =>
                r.includes(item.label) ? r : [...r, item.label]
              );
            }
            item.onClick?.();
            onLaunch?.(item.label, item);
          }}
        />
      ))}
    </nav>
  );
}

function DockItem({
  item,
  mouseX,
  tip,
  onEnter,
  onFocus,
  onBlur,
  running,
  onLaunch,
}: {
  item: Item;
  mouseX: MotionValue<number>;
  tip: Tip | null;
  onEnter: () => void;
  onFocus: () => void;
  onBlur: () => void;
  running: boolean;
  onLaunch: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const hop = useRef<AnimationPlaybackControls[]>([]);
  useEffect(() => () => hop.current.forEach((a) => a.stop()), []);

  const distance = useTransform(mouseX, (x) => {
    const box = ref.current?.getBoundingClientRect();
    return box ? x - box.left - box.width / 2 : Infinity;
  });
  const target = useTransform(distance, [-REACH, 0, REACH], [REST, PEAK, REST]);
  const size = useSpring(target, SIZE_SPRING);
  const iconSize = useTransform(size, (s) => s * 0.46);

  const launch = () => {
    onLaunch();
    if (reduceMotion || !ref.current) return;
    hop.current.forEach((a) => a.stop());
    hop.current = [
      animate(ref.current, { y: HOP.y }, HOP.transition),
      animate(
        ref.current,
        { scaleX: SQUASH.scaleX, scaleY: SQUASH.scaleY },
        SQUASH.transition
      ),
    ];
  };

  // Width and height animate instead of scale on purpose: the neighbours have
  // to move apart, and a transform would let the icons overlap instead.
  return (
    <span className="relative flex shrink-0">
      <motion.button
        ref={ref}
        type="button"
        aria-label={running ? `${item.label}, running` : item.label}
        // Lands on its base, so the squash spreads along the dock.
        style={{ width: size, height: size, originY: 1 }}
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full bg-white text-[#17171C] shadow-raised outline-hidden transition-[scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#006FEE] active:scale-[0.96] border border-black/[0.06]',
          running && 'text-[#006FEE] ring-1.5 ring-[#006FEE]/30 bg-[#006FEE]/[0.05]'
        )}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'touch') onEnter();
        }}
        onClick={launch}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <motion.div
          style={{ width: iconSize, height: iconSize }}
          className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          aria-hidden
        >
          {item.icon}
        </motion.div>
      </motion.button>

      {/* Outside the button, so the label holds still while the icon hops. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-md bg-[#17171C] px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-lg transition-[opacity,translate] duration-150 ease-out z-50',
          tip ? 'opacity-100' : 'translate-y-1 opacity-0',
          tip?.instant && 'transition-none'
        )}
      >
        {item.label}
      </span>

      {/* The running light stays on the shelf while the icon hops, and
          comes on as it first lands (0.55 of 700ms) rather than on click. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-full left-1/2 mt-1.5 -ml-0.5 size-1 rounded-full bg-[#006FEE] transition-[opacity,scale] ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_0_6px_#006FEE]',
          running
            ? 'scale-100 opacity-100 delay-[385ms] duration-200 motion-reduce:delay-0'
            : 'scale-50 opacity-0 duration-150'
        )}
      />
    </span>
  );
}

const ITEMS: Item[] = [
  {
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1H15v-5.5H9V20H4.5a1 1 0 0 1-1-1Z" />
      </svg>
    ),
  },
  {
    label: 'Search',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.35-4.35" />
      </svg>
    ),
  },
  {
    label: 'Predict',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: 'Scan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
  },
  {
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'Tools',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

export default function DockDemo() {
  return <Dock items={ITEMS} defaultRunning={['Home']} />;
}

export { TabBar, type TabBarItem } from './TabBar';
