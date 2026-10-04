"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

export type DropzoneEntry = { id: number; name: string; size: number; file: File };

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;
const ENTER = { duration: 0.25, ease: EASE_OUT };
const LEAVE = { duration: 0.15, ease: EASE_OUT };
const INSTANT = { duration: 0 };
const TICK = 280;
const EDGE_LENGTH = 120;

const CSS = `
@keyframes dz-march { to { stroke-dashoffset: -1; } }
.dz-edge {
  stroke-dasharray: 0.5 0.5;
  transition: stroke-dasharray 240ms cubic-bezier(0.23, 1, 0.32, 1), color 150ms ease-out;
}
@media (hover: hover) and (pointer: fine) {
  .dz-zone:hover .dz-edge[data-state="idle"] { animation: dz-march 1.6s linear infinite; }
}
.dz-edge[data-state="dragging"] { animation: dz-march 0.6s linear infinite; }
.dz-edge[data-state="over"] { stroke-dasharray: 1 0; }
@media (prefers-reduced-motion: reduce) {
  .dz-edge { animation: none !important; }
}
`;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

function hasFiles(e: DragEvent | React.DragEvent) {
  return !!e.dataTransfer?.types.includes("Files");
}

export interface FileDropzoneProps {
  onFiles?: (files: File[]) => void;
  onFileSelect?: (file: File) => void;
  label?: string;
  sublabel?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function FileDropzone({
  onFiles,
  onFileSelect,
  label = "Drop files here or click to browse",
  sublabel = "On-device processing · files never leave your device",
  accept = "image/*,application/pdf",
  multiple = false,
  className,
}: FileDropzoneProps) {
  const reduceMotion = useReducedMotion();
  const hintId = useId();
  const [entries, setEntries] = useState<DropzoneEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const zoneRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const removeRefs = useRef(new Map<number, HTMLButtonElement>());
  const nextId = useRef(0);
  const zoneDepth = useRef(0);

  useEffect(() => {
    let depth = 0;
    const reset = () => {
      depth = 0;
      zoneDepth.current = 0;
      setDragging(false);
      setOver(false);
    };
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      if (++depth === 1) setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) reset();
    };
    const dragover = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (!zoneRef.current?.contains(e.target as Node) && e.dataTransfer) {
        e.dataTransfer.dropEffect = "none";
      }
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      reset();
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", dragover);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", dragover);
      window.removeEventListener("drop", drop);
    };
  }, []);

  const add = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const newEntries: DropzoneEntry[] = files.map((f) => ({
      id: nextId.current++,
      name: f.name,
      size: f.size,
      file: f,
    }));
    setEntries((prev) => (multiple ? [...prev, ...newEntries] : newEntries));
    setAnnouncement(
      files.length === 1 ? `Added ${files[0].name}` : `Added ${files.length} files`
    );
    onFiles?.(files);
    if (files[0]) {
      onFileSelect?.(files[0]);
    }
  };

  const remove = (entry: DropzoneEntry) => {
    const index = entries.findIndex((e) => e.id === entry.id);
    const next = entries[index + 1] ?? entries[index - 1];
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setAnnouncement(`Removed ${entry.name}`);
    (next ? removeRefs.current.get(next.id) : zoneRef.current)?.focus();
  };

  return (
    <div className={cn("flex w-full flex-col gap-3 select-none", className)}>
      <button
        ref={zoneRef}
        type="button"
        aria-describedby={hintId}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          if (!hasFiles(e)) return;
          if (++zoneDepth.current === 1) setOver(true);
        }}
        onDragLeave={(e) => {
          if (!hasFiles(e)) return;
          zoneDepth.current = Math.max(0, zoneDepth.current - 1);
          if (zoneDepth.current === 0) setOver(false);
        }}
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className={cn(
          "dz-zone relative flex h-[200px] sm:h-[220px] touch-manipulation flex-col items-center justify-center gap-3 rounded-[24px] px-6 text-center outline-hidden cursor-pointer",
          "transition-[background-color,border-color,scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.99] motion-reduce:transition-[background-color]",
          over ? "bg-[#006FEE]/10" : dragging ? "bg-[#006FEE]/5" : "bg-white/80 dark:bg-zinc-900/60 shadow-2xs backdrop-blur-xs"
        )}
      >
        <style href="file-dropzone" precedence="default">
          {CSS}
        </style>
        <svg
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 size-full overflow-visible",
            over
              ? "text-[#006FEE]"
              : dragging
              ? "text-[#006FEE]/60"
              : "text-zinc-300 dark:text-zinc-700 [.dz-zone:hover_&]:text-[#006FEE]/50"
          )}
        >
          <rect
            x="1"
            y="1"
            rx="23"
            style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
            pathLength={EDGE_LENGTH}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            data-state={over ? "over" : dragging ? "dragging" : "idle"}
            className="dz-edge"
          />
        </svg>

        {/* Floating icon */}
        <div
          className={cn(
            "size-11 rounded-2xl bg-white dark:bg-zinc-800 shadow-xs border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[#006FEE] transition-[translate,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
            over && "-translate-y-1.5 scale-105"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 15V4.5M7.75 8.5 12 4.25l4.25 4.25" />
            <path d="M4.75 14.5v3.25a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2V14.5" />
          </svg>
        </div>

        <span className="flex flex-col gap-1 max-w-xs">
          <span className="grid text-[15px] font-semibold text-[#17171C] dark:text-white">
            <span
              className={cn(
                "col-start-1 row-start-1 transition-[opacity,filter] duration-150 ease-out",
                over && "opacity-0 blur-[4px]"
              )}
            >
              {label}
            </span>
            <span
              aria-hidden
              className={cn(
                "col-start-1 row-start-1 text-[#006FEE] transition-[opacity,filter] duration-150 ease-out",
                !over && "opacity-0 blur-[4px]"
              )}
            >
              Release to scan
            </span>
          </span>
          <span id={hintId} className="text-[12px] text-[#71717A] leading-tight">
            {sublabel}
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Progress File Rows List */}
      {entries.length > 0 && (
        <motion.div
          layoutScroll
          className="max-h-[264px] overflow-y-auto overscroll-contain [scrollbar-width:thin]"
        >
          <ul aria-label="Files" className="relative flex flex-col gap-1.5">
            <AnimatePresence mode="popLayout" initial={false}>
              {entries.map((entry) => (
                <motion.li
                  key={entry.id}
                  layout="position"
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 6, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    reduceMotion
                      ? { opacity: 0, transition: LEAVE }
                      : { opacity: 0, scale: 0.98, transition: LEAVE }
                  }
                  transition={{
                    ...ENTER,
                    layout: reduceMotion ? INSTANT : ENTER,
                  }}
                >
                  <FileRow
                    entry={entry}
                    reduceMotion={reduceMotion}
                    removeRef={(el) => {
                      if (el) removeRefs.current.set(entry.id, el);
                      else removeRefs.current.delete(entry.id);
                    }}
                    onRemove={() => remove(entry)}
                    onDone={() => setAnnouncement(`Uploaded ${entry.name}`)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      )}

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

function FileRow({
  entry,
  reduceMotion,
  removeRef,
  onRemove,
  onDone,
}: {
  entry: DropzoneEntry;
  reduceMotion: boolean | null;
  removeRef: (el: HTMLButtonElement | null) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const ticks = Math.min(16, Math.max(5, entry.size / 400_000));
    let p = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const stall = Math.random() < 1 / 6;
      const chunk = stall
        ? 0
        : ((0.6 + Math.random() * 0.8) / ticks) * (1.2 - p * 0.5);
      p = Math.min(1, p + chunk);
      setProgress(p);
      if (p < 1) {
        timer = setTimeout(step, TICK);
      } else {
        timer = setTimeout(() => {
          setDone(true);
          onDoneRef.current();
        }, 300);
      }
    };
    timer = setTimeout(step, 150);
    return () => clearTimeout(timer);
  }, [entry.size]);

  const hidden = reduceMotion
    ? { scale: 1, opacity: 0, filter: "blur(0px)" }
    : { scale: 0.25, opacity: 0, filter: "blur(4px)" };

  return (
    <div className="flex h-14 items-center gap-3 rounded-2xl pr-1.5 pl-3.5 bg-white dark:bg-zinc-900 border border-black/[0.05] dark:border-white/[0.05] shadow-xs">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] leading-5 font-medium text-[#17171C] dark:text-zinc-100">
          {entry.name}
        </span>
        <div className="flex h-4 items-center gap-3 text-[12px] text-[#71717A]">
          <span className="shrink-0 tabular-nums">
            {formatSize(entry.size)}
          </span>
          <span className="grid flex-1 items-center">
            <span
              role="progressbar"
              aria-label={`Processing ${entry.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className={cn(
                "col-start-1 row-start-1 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 transition-[opacity] duration-200 ease-out",
                done && "opacity-0"
              )}
            >
              <span
                className="block h-full origin-left rounded-full bg-[#006FEE] transition-[scale] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ scale: `${progress} 1` }}
              />
            </span>
            <span
              className={cn(
                "col-start-1 row-start-1 text-emerald-600 dark:text-emerald-400 font-medium transition-[opacity,filter] duration-200 ease-out",
                !done && "opacity-0 blur-[4px]"
              )}
            >
              Ready
            </span>
          </span>
        </div>
      </div>

      <span className="grid w-8 shrink-0 place-items-center text-[12px] text-[#71717A] tabular-nums">
        <span
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 transition-[opacity,filter] duration-150 ease-out",
            done && "opacity-0 blur-[4px]"
          )}
        >
          {Math.round(progress * 100)}%
        </span>
        <motion.svg
          viewBox="0 0 16 16"
          className="col-start-1 row-start-1 size-4 text-emerald-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          initial={false}
          animate={done ? { scale: 1, opacity: 1, filter: "blur(0px)" } : hidden}
          transition={ICON_SWAP}
        >
          <path d="m3.5 8.5 3 3 6-7" />
        </motion.svg>
      </span>

      <button
        ref={removeRef}
        type="button"
        aria-label={`Remove ${entry.name}`}
        onClick={onRemove}
        className="flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-full text-[#71717A] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#17171C] active:scale-95 transition-all"
      >
        <svg
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="m4.75 4.75 6.5 6.5M11.25 4.75l-6.5 6.5" />
        </svg>
      </button>
    </div>
  );
}
