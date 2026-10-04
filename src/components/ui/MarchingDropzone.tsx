'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MarchingDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
  label?: string;
  sublabel?: string;
}

export function MarchingDropzone({
  onFileSelect,
  accept = 'image/*',
  className,
  label = 'Drop meter photo or bill here',
  sublabel = 'Supports PNG, JPG, or PDF camera capture',
}: MarchingDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'group relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed cursor-pointer transition-all select-none',
        isDragOver
          ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
          : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-600',
        className
      )}
      style={{
        // Marching dashed border animation via SVG or CSS dashoffset
        strokeDasharray: '8 6',
      }}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="sr-only"
      />

      <div className="size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-3 shadow-inner">
        {selectedFileName ? (
          <CheckCircle2 className="size-6 text-emerald-500" />
        ) : (
          <UploadCloud className="size-6" />
        )}
      </div>

      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 text-center">
        {selectedFileName ? selectedFileName : label}
      </p>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 text-center">
        {selectedFileName ? 'Tap to change file' : sublabel}
      </p>
    </label>
  );
}
