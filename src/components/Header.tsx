'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { BrandLogo } from '@/components/BrandLogo';
import { Search } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import dynamic from 'next/dynamic';

const CommandPalette = dynamic(
  () => import('@/components/ui/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
);

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const navLinks = [
    { href: '/predict', label: lang === 'ml' ? 'കണക്കുകൂട്ടാം' : 'Predict' },
    { href: '/providers', label: lang === 'ml' ? 'ബോർഡുകൾ' : 'Providers' },
    { href: '/history', label: lang === 'ml' ? 'ചരിത്രം' : 'History' },
    { href: '/usage', label: lang === 'ml' ? 'ഉപയോഗം' : 'Usage' },
    { href: '/how-it-works', label: lang === 'ml' ? 'വിശദാംശങ്ങൾ' : 'How it works' },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full transition-colors pt-safe"
      style={{
        background: 'rgba(247, 247, 245, 0.88)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--separator)',
      }}
    >
      <div className="mx-auto flex h-11 max-w-[430px] md:max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand — Refined geometric mark + modern wordmark */}
        <Link
          href="/"
          className="group flex items-center transition-opacity active:opacity-60"
          aria-label="BILLWISE Homepage"
        >
          <BrandLogo size={18} showBeta={true} />
        </Link>

        {/* Desktop Navigation — Quiet inline links */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {navLinks.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors active:opacity-60"
                style={{
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 450,
                  color: isActive ? 'var(--foreground)' : 'var(--secondary)',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Controls: Segmented Language & Settings */}
        <div className="flex items-center gap-2">
          {/* Segmented language selector */}
          <SegmentedControl
            options={[
              { value: 'en' as const, label: 'EN' },
              { value: 'ml' as const, label: 'മല' },
            ]}
            value={lang}
            onChange={(v) => setLang(v as 'en' | 'ml')}
            size="sm"
            layoutId="header-lang-segmented"
          />

          {/* Command Palette Trigger (⌘K) */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            aria-label={lang === 'ml' ? 'ടൂളുകൾ തിരയുക (⌘K)' : 'Search features (⌘K)'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--secondary)] hover:text-[var(--foreground)] bg-black/[0.04] border border-black/[0.06] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            title={lang === 'ml' ? 'ടൂളുകൾ തിരയുക (⌘K)' : 'Search features (⌘K)'}
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <kbd className="hidden sm:inline font-mono text-[10px] opacity-60">⌘K</kbd>
          </button>

          {/* Quick link to Settings */}
          <Link
            href="/settings"
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full text-[var(--secondary)] hover:text-[var(--foreground)] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            aria-label="Settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpen={() => setIsCommandOpen(true)}
      />
    </header>
  );
}
