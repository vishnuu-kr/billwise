'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Zap, Globe } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { lang, toggleLang, t } = useLanguage();

  const navLinks = [
    { href: '/predict', label: lang === 'ml' ? 'കണക്കുകൂട്ടാം' : 'Predict' },
    { href: '/history', label: lang === 'ml' ? 'ചരിത്രം' : 'History' },
    { href: '/usage', label: lang === 'ml' ? 'ഉപയോഗം' : 'Usage' },
    { href: '/what-if', label: lang === 'ml' ? 'സിമുലേറ്റർ' : 'What-If' },
    { href: '/budget', label: lang === 'ml' ? 'ബജറ്റ്' : 'Budget' },
    { href: '/tariff', label: lang === 'ml' ? 'താരിഫ്' : 'Tariff' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          aria-label="BILLWISE Homepage"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sky-400 shadow-sm transition-transform group-hover:scale-105">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base font-bold tracking-tight text-slate-900">
                BILLWISE
              </span>
              <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-800 tracking-wider">
                BETA
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
              Kerala Power
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA & Language Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors touch-target"
            title="Switch Language / ഭാഷ മാറ്റുക"
            aria-label="Toggle between English and Malayalam"
          >
            <Globe className="h-3.5 w-3.5 text-sky-600" />
            <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>

          <Link
            href="/predict"
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
          >
            {t.predictMyBill}
          </Link>
        </div>
      </div>
    </header>
  );
}
