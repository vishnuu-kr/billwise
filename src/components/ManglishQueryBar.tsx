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
      {/* Single elegant input row */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-3.5 w-3.5 text-[var(--tertiary)]" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={lang === 'ml' ? 'ചോദിക്കൂ (ഉദാ: 240 units aayal ethra?)' : 'Ask BILLWISE (e.g. "240 units aayal ethra?")'}
          className="w-full h-10 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] pl-9 pr-9 text-[13px] font-normal text-[var(--foreground)] placeholder:text-[var(--tertiary)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 w-8 h-8 flex items-center justify-center text-[var(--tertiary)] hover:text-[var(--foreground)] active:scale-[0.96] rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Answer item (if query entered) */}
      {result && result.directAnswer && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] p-3.5 space-y-1.5 text-[13px]">
          <div className="font-medium text-[var(--foreground)] leading-relaxed">
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
