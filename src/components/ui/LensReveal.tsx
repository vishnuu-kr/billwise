'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface LensRevealProps {
  imageSrc: string;
  zoomLevel?: number;
  lensSize?: number;
  alt?: string;
  className?: string;
  annotations?: { x: number; y: number; label: string }[];
}

export function LensReveal({
  imageSrc,
  zoomLevel = 2.5,
  lensSize = 130,
  alt = 'KSEB Bill Document',
  className,
  annotations = [],
}: LensRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [relativePos, setRelativePos] = useState({ x: 0, y: 0, width: 1, height: 1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
    setRelativePos({
      x,
      y,
      width: rect.width,
      height: rect.height,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 select-none cursor-crosshair group shadow-sm',
        className
      )}
    >
      {/* Base Image (client blob URL or data URI) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-auto object-contain block select-none pointer-events-none"
      />

      {/* Optional Pin Annotations */}
      {annotations.map((item, idx) => (
        <div
          key={idx}
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/80 border-2 border-white shadow-md pointer-events-none animate-pulse"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          title={item.label}
        />
      ))}

      {/* Floating Instructions when not hovered */}
      {!isHovered && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium pointer-events-none">
          <ZoomIn className="size-3.5" />
          <span>Hover to inspect fine print</span>
        </div>
      )}

      {/* Magnifying Lens Loupe */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="absolute pointer-events-none rounded-full border-2 border-emerald-500 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900"
          style={{
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            left: `${mousePos.x - lensSize / 2}px`,
            top: `${mousePos.y - lensSize / 2}px`,
            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Zoomed Mirrored Background */}
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${imageSrc})`,
              backgroundSize: `${relativePos.width * zoomLevel}px ${relativePos.height * zoomLevel}px`,
              backgroundPosition: `-${mousePos.x * zoomLevel - lensSize / 2}px -${mousePos.y * zoomLevel - lensSize / 2}px`,
            }}
          />

          {/* Crosshair Target */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-full h-px bg-emerald-500" />
            <div className="h-full w-px bg-emerald-500" />
          </div>

          <div className="absolute top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-emerald-400">
            {zoomLevel}x
          </div>
        </motion.div>
      )}
    </div>
  );
}
