'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

const CHARS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ#%&*+-=';

export interface TextScrambleProps {
  text: string;
  durationMs?: number;
  className?: string;
  trigger?: unknown;
}

export function TextScramble({
  text,
  durationMs = 800,
  className,
  trigger,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(10, Math.floor(durationMs / 30));
    const charsArray = text.split('');

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      const scrambled = charsArray
        .map((char, idx) => {
          if (char === ' ' || char === '\n') return char;
          // If this character position has finished resolving
          if (idx / charsArray.length < progress) {
            return char;
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');

      setDisplayText(scrambled);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, durationMs, trigger]);

  return <span className={cn('font-mono tabular-nums', className)}>{displayText}</span>;
}
