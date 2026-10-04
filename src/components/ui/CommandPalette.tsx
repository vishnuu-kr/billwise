'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { cn } from '@/lib/cn';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Opened constantly, so the entrance is barely there: fast enough never to
// feel like waiting, just enough that the panel arrives rather than blinks.
const OPEN = { duration: 0.15, ease: EASE_OUT };
// Closing is quicker still; nobody watches a palette leave.
const CLOSE = { duration: 0.1, ease: EASE_OUT };

export type Command = {
  id: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  shortcut?: string[];
  href?: string;
  action?: () => void;
};

type Match = { command: Command; ranges: [number, number][] };

// Contiguous substring first, so "set" highlights "Settings" as one run
// instead of scattered letters; subsequence is the fallback ("gtst").
function match(label: string, query: string): [number, number][] | null {
  if (!query) return [];
  const hay = label.toLowerCase();
  const needle = query.toLowerCase();
  const at = hay.indexOf(needle);
  if (at !== -1) return [[at, at + needle.length]];
  const ranges: [number, number][] = [];
  let from = 0;
  for (const char of needle) {
    const i = hay.indexOf(char, from);
    if (i === -1) return null;
    const last = ranges[ranges.length - 1];
    if (last && last[1] === i) last[1] = i + 1;
    else ranges.push([i, i + 1]);
    from = i + 1;
  }
  return ranges;
}

const subscribeNoop = () => () => {};
function useIsMac() {
  // Server renders "Ctrl"; the client corrects it without a hydration mismatch.
  return useSyncExternalStore(
    subscribeNoop,
    () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
}

// The portal needs document.body, which only exists on the client.
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

const DEFAULT_COMMANDS: Command[] = [
  {
    id: 'predict',
    group: 'Calculators',
    label: 'Predict Electricity Bill',
    shortcut: ['G', 'P'],
    href: '/predict',
    icon: (
      <LineIcon>
        <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
        <path d="M5.5 5.5h5M5.5 8h2M8.5 8h2M5.5 10.5h2M8.5 10.5h2" />
      </LineIcon>
    ),
  },
  {
    id: 'scan',
    group: 'Calculators',
    label: 'Scan Meter or Bill OCR',
    shortcut: ['G', 'S'],
    href: '/scan',
    icon: (
      <LineIcon>
        <path d="M2.5 5.5v-2a1 1 0 0 1 1-1h2M10.5 2.5h2a1 1 0 0 1 1 1v2M13.5 10.5v2a1 1 0 0 1-1 1h-2M5.5 13.5h-2a1 1 0 0 1-1-1v-2" />
        <circle cx="8" cy="8" r="2.5" />
      </LineIcon>
    ),
  },
  {
    id: 'appliances',
    group: 'Calculators',
    label: 'Appliance Energy Audit',
    shortcut: ['G', 'A'],
    href: '/appliances',
    icon: (
      <LineIcon>
        <path d="M8 2.5l1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z" />
      </LineIcon>
    ),
  },
  {
    id: 'what-if',
    group: 'Calculators',
    label: 'What-If Load Simulator',
    shortcut: ['G', 'W'],
    href: '/what-if',
    icon: (
      <LineIcon>
        <path d="M2.5 13.5h11M8 2.5v11M4.5 5.5l-2 5h4l-2-5zM11.5 5.5l-2 5h4l-2-5z" />
      </LineIcon>
    ),
  },
  {
    id: 'budget',
    group: 'Calculators',
    label: 'Bi-monthly Budget Ceiling',
    shortcut: ['G', 'B'],
    href: '/budget',
    icon: (
      <LineIcon>
        <path d="M13 5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
        <path d="M10 8.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0z" />
      </LineIcon>
    ),
  },
  {
    id: 'history',
    group: 'Navigation',
    label: 'Usage History & Heatmap',
    shortcut: ['G', 'H'],
    href: '/history',
    icon: (
      <LineIcon>
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 5v3.25l2.25 1.25" />
      </LineIcon>
    ),
  },
  {
    id: 'home',
    group: 'Navigation',
    label: 'Go to Home',
    href: '/',
    icon: (
      <LineIcon>
        <path d="M2.75 7.25 8 2.75l5.25 4.5v6h-3.5v-3.5h-3.5v3.5h-3.5z" />
      </LineIcon>
    ),
  },
  {
    id: 'tariff',
    group: 'Intelligence',
    label: 'KSEB LT-1A Tariff Slabs & Rates',
    href: '/tariff',
    icon: (
      <LineIcon>
        <path d="M3.5 2.5h9v11h-9zM6 5.5h4M6 8h4M6 10.5h2.5" />
      </LineIcon>
    ),
  },
  {
    id: 'explain',
    group: 'Intelligence',
    label: 'Kerala 240-Unit Subsidy Cliff Rule',
    href: '/explain',
    icon: (
      <LineIcon>
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 7v4M8 5h.01" />
      </LineIcon>
    ),
  },
  {
    id: 'how-it-works',
    group: 'Intelligence',
    label: 'How KSEB Bi-Monthly Billing Works',
    href: '/how-it-works',
    icon: (
      <LineIcon>
        <path d="M3 3h10v10H3zM6 8h4M8 6v4" />
      </LineIcon>
    ),
  },
  {
    id: 'settings',
    group: 'Preferences',
    label: 'Settings & System Preferences',
    shortcut: ['G', 'S'],
    href: '/settings',
    icon: (
      <LineIcon>
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
      </LineIcon>
    ),
  },
];

/**
 * Opened many times a day, so every animation stays tiny: a 150ms entrance,
 * a 100ms exit, and the active item moves instantly with the keys. Anything
 * longer would be paid on every use.
 */
export function CommandPalette({
  commands = DEFAULT_COMMANDS,
  onRun,
  placeholder = 'Type a command or search...',
  className,
  isOpen,
  onClose,
  onOpen,
  showTrigger = false,
}: {
  commands?: Command[];
  onRun?: (command: Command) => void;
  placeholder?: string;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  showTrigger?: boolean;
}) {
  const router = useRouter();
  const isMac = useIsMac();
  const isClient = useIsClient();
  const reduceMotion = useReducedMotion();
  const id = useId();

  const isControlled = isOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? isOpen : internalOpen;

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Last pointer position, so a list scrolling under a still cursor (which
  // browsers can report as hover) never steals the active item from the keys.
  const pointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      pointer.current = null;
    }
  }, [open]);

  const results = useMemo(() => {
    const matches: Match[] = [];
    for (const command of commands) {
      const ranges = match(command.label, query.trim());
      if (ranges) matches.push({ command, ranges });
    }
    const groups = [...new Set(matches.map((m) => m.command.group))];
    return groups.map((group) => ({
      group,
      items: matches.filter((m) => m.command.group === group),
    }));
  }, [commands, query]);

  // Flattened in rendered order, so arrow keys and indices always agree even
  // when commands arrive with their groups interleaved.
  const flat = useMemo(() => results.flatMap((g) => g.items), [results]);
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));
  const activeItem = flat[activeIndex];
  const optionId = useCallback(
    (command: Command) => `${id}-option-${command.id}`,
    [id],
  );

  const show = useCallback(() => {
    setQuery('');
    setActive(0);
    pointer.current = null;
    if (isControlled) {
      onOpen?.();
    } else {
      setInternalOpen(true);
    }
  }, [isControlled, onOpen]);

  const close = useCallback(() => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalOpen(false);
    }
    triggerRef.current?.focus();
  }, [isControlled, onClose]);

  const run = (command: Command) => {
    close();
    if (command.href) {
      router.push(command.href);
    }
    command.action?.();
    onRun?.(command);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;
      if (e.altKey || e.shiftKey || e.repeat) return;
      // Inert copies, like index previews, stay quiet.
      if (triggerRef.current?.closest('[inert]')) return;
      // Browsers bind Ctrl+K to address bar search. Marking it handled also
      // tells the site's own search to stand aside on this page.
      e.preventDefault();
      if (open) {
        close();
      } else if (isControlled) {
        onOpen?.();
      } else {
        show();
      }
    };
    // Capture, so it runs before the site's search, which listens later.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, close, show, isControlled, onOpen]);

  useEffect(() => {
    if (!open || !activeItem) return;
    // Smooth, so stepping past the edge glides the list along rather than
    // jumping it. "nearest" means it only scrolls when the item is out of view.
    document.getElementById(optionId(activeItem.command))?.scrollIntoView({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [open, activeItem, optionId, reduceMotion]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    const count = flat.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!count) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((activeIndex + step + count) % count);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItem) run(activeItem.command);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      // The input is the dialog's only tab stop; keep focus inside.
      e.preventDefault();
    }
  };

  const onOptionPointerMove = (e: React.PointerEvent, optionIndex: number) => {
    if (e.pointerType === 'touch') return;
    const last = pointer.current;
    if (last && last.x === e.clientX && last.y === e.clientY) return;
    pointer.current = { x: e.clientX, y: e.clientY };
    if (optionIndex !== activeIndex) setActive(optionIndex);
  };

  let index = -1;

  return (
    <>
      {showTrigger && (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
          onClick={show}
          className={cn(
            'flex h-9 w-60 touch-manipulation items-center gap-2 rounded-lg bg-surface pr-1.5 pl-3 text-sm text-[#71717A] shadow-raised outline-hidden transition-[scale,color] duration-150 ease-out select-none hover:text-[#17171C] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#006FEE] active:scale-[0.96] motion-reduce:transition-[color]',
            className,
          )}
        >
          <SearchIcon />
          <span className="flex-1 text-left">Search commands</span>
          <Kbd keys={[isMac ? '⌘' : 'Ctrl', 'K']} />
        </button>
      )}

      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: OPEN }}
                exit={{ opacity: 0, transition: CLOSE }}
              >
                {/* Frosted backdrop */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                  onClick={close}
                />
                <motion.div
                  // Grows from its top edge, where the eye already is at the input.
                  initial={reduceMotion ? false : { scale: 0.98 }}
                  animate={{ scale: 1, transition: OPEN }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { scale: 0.98, transition: CLOSE }
                  }
                  role="dialog"
                  aria-modal="true"
                  aria-label="Command palette"
                  // Clicks anywhere in the panel keep focus in the input, so
                  // typing and arrow keys carry on after a stray click.
                  onMouseDown={(e) => {
                    if (!(e.target instanceof HTMLInputElement))
                      e.preventDefault();
                  }}
                  // Pinned 18vh from the top rather than vertically centered, so
                  // the input stays put while filtering resizes the list below.
                  className="absolute top-[18vh] left-1/2 flex w-[480px] max-w-[calc(100vw-32px)] origin-top -translate-x-1/2 flex-col overflow-hidden rounded-[24px] bg-white shadow-raised border border-black/[0.08]"
                >
                  <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-black/[0.06] px-4 text-[#71717A]">
                    <SearchIcon />
                    <input
                      autoFocus
                      type="text"
                      role="combobox"
                      aria-expanded="true"
                      aria-controls={`${id}-listbox`}
                      aria-autocomplete="list"
                      aria-activedescendant={
                        activeItem ? optionId(activeItem.command) : undefined
                      }
                      aria-label="Search commands"
                      placeholder={placeholder}
                      spellCheck={false}
                      autoComplete="off"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActive(0);
                      }}
                      onKeyDown={onInputKeyDown}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#17171C] outline-hidden placeholder:text-[#A1A1AA]"
                    />
                  </div>

                  {/* 4px padding + 8px item radius = the panel's 12px radius. */}
                  <div
                    id={`${id}-listbox`}
                    role="listbox"
                    aria-label="Commands"
                    className={cn(
                      'max-h-[min(340px,50vh)] scroll-py-1 overflow-y-auto overscroll-contain p-2',
                      !flat.length && 'hidden',
                    )}
                    onPointerLeave={() => {
                      pointer.current = null;
                    }}
                  >
                    {results.map(({ group, items }) => (
                      <div
                        key={group}
                        role="group"
                        aria-labelledby={`${id}-group-${group}`}
                      >
                        <div
                          id={`${id}-group-${group}`}
                          className="px-3 pt-2.5 pb-1 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider select-none"
                        >
                          {group}
                        </div>
                        {items.map(({ command, ranges }) => {
                          index += 1;
                          const i = index;
                          const selected = i === activeIndex;
                          return (
                            <div
                              key={command.id}
                              id={optionId(command)}
                              role="option"
                              aria-selected={selected}
                              onPointerMove={(e) => onOptionPointerMove(e, i)}
                              onClick={() => run(command)}
                              className={cn(
                                'flex h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm select-none transition-colors duration-100',
                                selected ? 'bg-[#006FEE]/10 text-[#17171C]' : 'text-[#71717A] hover:bg-black/[0.04]',
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  'flex size-4 shrink-0 items-center justify-center',
                                  selected ? 'text-[#006FEE]' : 'text-[#71717A]',
                                )}
                              >
                                {command.icon}
                              </span>
                              <Highlight
                                label={command.label}
                                ranges={ranges}
                              />
                              {command.shortcut && (
                                <Kbd keys={command.shortcut} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {!flat.length && (
                    <p
                      role="status"
                      className="px-4 py-8 text-center text-sm text-[#71717A]"
                    >
                      No commands found
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function Highlight({
  label,
  ranges,
}: {
  label: string;
  ranges: [number, number][];
}) {
  if (!ranges.length)
    return <span className="flex-1 truncate text-[#17171C]">{label}</span>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push(label.slice(cursor, start));
    parts.push(
      <span key={start} className="text-[#006FEE] font-semibold">
        {label.slice(start, end)}
      </span>,
    );
    cursor = end;
  }
  parts.push(label.slice(cursor));
  return <span className="flex-1 truncate text-[#71717A]">{parts}</span>;
}

function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="flex shrink-0 gap-0.5" aria-hidden>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="flex h-5 min-w-5 items-center justify-center rounded border border-black/[0.08] bg-black/[0.04] px-1 font-sans text-[11px] leading-none text-[#71717A]"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export function LineIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function SearchIcon() {
  return (
    <LineIcon>
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10.25 10.25 3 3" />
    </LineIcon>
  );
}

export default function CommandPaletteDemo() {
  const [ran, setRan] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <CommandPalette
        showTrigger={true}
        onRun={(command) => setRan(command.label)}
      />
      <p className="h-5 text-sm text-[#71717A]" aria-live="polite">
        {ran && (
          <>
            Ran: <span className="text-[#17171C] font-semibold">{ran}</span>
          </>
        )}
      </p>
    </div>
  );
}
