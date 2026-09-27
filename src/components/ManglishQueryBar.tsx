'use client';

import React, { useState } from 'react';
import { parseManglishQuery, ManglishParseResult } from '@/lib/i18n/manglishParser';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Search, Sparkles, ArrowRight, X } from 'lucide-react';
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

  const quickPrompts = [
    '240 units aayal ethra?',
    'current reading 10412',
    'bill kurakkan engane?',
  ];

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-sky-600" />
        <span>{lang === 'ml' ? 'ലളിതമായ ചോദ്യങ്ങൾ ചോദിക്കാം (Manglish)' : 'Ask in Manglish or Quick Query'}</span>
      </div>

      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={lang === 'ml' ? 'ഉദാ: 240 units aayal ethra?' : 'e.g. 240 units aayal ethra? or current reading 10412'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Quick Prompts */}
      {!result && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400">Try:</span>
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => handleSearch(p)}
              className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              &ldquo;{p}&rdquo;
            </button>
          ))}
        </div>
      )}

      {/* Parsed Answer Card */}
      {result && result.directAnswer && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 space-y-2 text-xs">
          <div className="font-medium text-slate-900 leading-relaxed">
            {result.directAnswer}
          </div>
          {result.suggestedAction && (
            <div className="pt-1">
              <Link
                href={result.suggestedAction.href}
                className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800"
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
