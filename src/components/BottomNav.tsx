'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Zap, Camera, Clock, Settings2 } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const items = [
    {
      href: '/predict',
      label: lang === 'ml' ? 'കണക്കുകൂട്ടാം' : 'Predict',
      icon: Zap,
    },
    {
      href: '/scan',
      label: lang === 'ml' ? 'സ്കാൻ' : 'Scan',
      icon: Camera,
    },
    {
      href: '/history',
      label: lang === 'ml' ? 'ചരിത്രം' : 'History',
      icon: Clock,
    },
    {
      href: '/settings',
      label: lang === 'ml' ? 'സെറ്റിംഗ്സ്' : 'Settings',
      icon: Settings2,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 block border-t border-slate-200/80 bg-white/95 backdrop-blur-md md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="grid h-16 grid-cols-4 items-center">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/predict' && pathname === '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors touch-target ${
                isActive ? 'text-sky-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
