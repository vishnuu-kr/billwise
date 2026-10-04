'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface SpineSection {
  id: string;
  title: string;
  subtitle?: string;
}

export interface ScrollSpineProps {
  sections: SpineSection[];
  className?: string;
}

export function ScrollSpine({
  sections,
  className,
}: ScrollSpineProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      // Detect active section
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 150) {
            setActiveId(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('relative flex flex-col items-start gap-4 select-none', className)}>
      {/* Spine Bar */}
      <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="w-full bg-emerald-500 origin-top"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

      {/* Nodes */}
      {sections.map((sec) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className="group flex items-center gap-3 text-left rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 cursor-pointer"
          >
            {/* Pip Dot */}
            <motion.div
              animate={{ scale: isActive ? 1.3 : 1 }}
              className={cn(
                'z-10 size-4 rounded-full border-2 transition-all flex items-center justify-center',
                isActive
                  ? 'border-emerald-500 bg-emerald-500 shadow-md shadow-emerald-500/40'
                  : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 group-hover:border-emerald-400'
              )}
            >
              {isActive && <div className="size-1.5 rounded-full bg-white" />}
            </motion.div>

            {/* Label */}
            <div className="transition-opacity">
              <span
                className={cn(
                  'text-xs font-semibold block transition-colors',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                )}
              >
                {sec.title}
              </span>
              {sec.subtitle && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                  {sec.subtitle}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
