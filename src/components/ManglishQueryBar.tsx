'use client';

import React, { useState } from 'react';
import { parseManglishQuery, ManglishParseResult } from '@/lib/i18n/manglishParser';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Search, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

export default function ManglishQueryBar() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ManglishParseResult | null>(null);

  const handleSearch = (text: string) => {
    setQuery(text);
    const parsed = parseManglishQuery(text);
    setResult(parsed);
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
  };

  return (
    <div className="w-full space-y-2">
      {/* Sleek Intelligence Input Pill */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-[#71717A]" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={lang === 'ml' ? 'ചോദിക്കൂ (ഉദാ: 240 units aayal ethra?)' : 'Ask BILLWISE (e.g. "240 units aayal ethra?")'}
          className="w-full h-11 rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.07] pl-10 pr-9 text-[13px] font-medium text-[#17171C] placeholder:text-[#A1A1AA] shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus:border-[#006FEE] focus:ring-2 focus:ring-[#006FEE]/15 focus-visible:outline-none transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 w-8 h-8 flex items-center justify-center text-[#71717A] hover:text-[#17171C] active:scale-[0.96] rounded-full cursor-pointer"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Quick Suggestion Chips when empty */}
      {!query && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
          {[
            { label: '240 units', q: '240 units bill ethra?' },
            { label: 'Slab cliff', q: 'Slab cliff limit' },
            { label: 'Solar net meter', q: 'Solar net meter rule' },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSearch(chip.q)}
              className="text-[11px] font-semibold text-[#71717A] hover:text-[#17171C] bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.05] rounded-full px-2.5 py-1 whitespace-nowrap cursor-pointer transition-all active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Answer item (if query entered) */}
      {result && result.directAnswer && (
        <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.06] p-4 space-y-2 text-[13px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02]">
          <div className="font-semibold text-[#17171C] leading-relaxed">
            {result.directAnswer}
          </div>
          {result.suggestedAction && (
            <div className="pt-0.5">
              <Link
                href={result.suggestedAction.href}
                className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                <span>{result.suggestedAction.label}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
