'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { Download, Upload, Trash2, ChevronRight, Check, X } from 'lucide-react';
import Link from 'next/link';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SITE_CONFIG } from '@/lib/config/site';
import dynamic from 'next/dynamic';

const PaperShredder = dynamic(
  () => import('@/components/ui/PaperShredder').then((m) => m.PaperShredder),
  { ssr: false }
);

export default function SettingsPage() {
  const { lang, setLang } = useLanguage();
  const [cleared, setCleared] = useState(false);
  const [imported, setImported] = useState(false);
  const [showShredder, setShowShredder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setShowShredder(true);
  };

  const handleShredComplete = () => {
    storageManager.clearAllData();
    setCleared(true);
    setTimeout(() => {
      setShowShredder(false);
      setTimeout(() => setCleared(false), 3000);
    }, 700);
  };

  const handleExport = () => {
    const json = storageManager.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billwise-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const ok = storageManager.importData(text);
          if (ok) {
            setImported(true);
            setTimeout(() => setImported(false), 3000);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--secondary)] hover:text-[var(--foreground)] active:opacity-60 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
      </Link>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="application/json"
        onChange={handleImport}
        aria-label="Import JSON backup"
      />

      {/* Title */}
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[var(--foreground)]">
          {lang === 'ml' ? 'ക്രമീകരണങ്ങൾ' : 'Settings'}
        </h1>
      </div>

      <div className="space-y-6">
        {/* GROUP 1: PREFERENCES */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[var(--tertiary)] uppercase tracking-wider block px-2">
            PREFERENCES
          </span>
          <div className="ios-grouped-list">
            <div className="ios-row">
              <span className="text-[14px] font-medium text-[var(--foreground)]">
                {lang === 'ml' ? 'ഭാഷ' : 'Language'}
              </span>
              <SegmentedControl
                options={[
                  { value: 'en' as const, label: 'English' },
                  { value: 'ml' as const, label: 'മലയാളം' },
                ]}
                value={lang}
                onChange={(v) => setLang(v as 'en' | 'ml')}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* GROUP 2: DATA */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[var(--tertiary)] uppercase tracking-wider block px-2">
            DATA
          </span>
          <div className="ios-grouped-list">
            {/* Export */}
            <button
              type="button"
              onClick={handleExport}
              className="ios-row w-full text-left cursor-pointer"
            >
              <div>
                <span className="text-[14px] font-medium text-[var(--foreground)] block">
                  {lang === 'ml' ? 'ഡാറ്റ എക്സ്പോർട്ട് ചെയ്യുക' : 'Export backup'}
                </span>
                <span className="text-[12px] text-[var(--secondary)]">
                  {lang === 'ml' ? 'JSON ഫയൽ' : 'Download readings as JSON'}
                </span>
              </div>
              <Download style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
            </button>

            {/* Import */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ios-row w-full text-left cursor-pointer"
            >
              <div>
                <span className="text-[14px] font-medium text-[var(--foreground)] block">
                  {lang === 'ml' ? 'ഡാറ്റ ഇംപോർട്ട് ചെയ്യുക' : 'Import backup'}
                </span>
                <span className="text-[12px] text-[var(--secondary)]">
                  {lang === 'ml' ? 'JSON ഫയൽ റീസ്റ്റോർ ചെയ്യുക' : 'Restore from JSON file'}
                </span>
              </div>
              <Upload style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={handleClear}
              className="ios-row w-full text-left cursor-pointer"
            >
              <div>
                <span className="text-[14px] font-medium text-[var(--danger)] block">
                  {lang === 'ml' ? 'ഡാറ്റ ഒഴിവാക്കുക' : 'Delete local data'}
                </span>
                <span className="text-[12px] text-[var(--secondary)]">
                  {lang === 'ml' ? 'ഈ ഫോണിലെ വിവരങ്ങൾ മാറ്റുന്നു' : 'Erase history & saved preferences'}
                </span>
              </div>
              <Trash2 style={{ width: '16px', height: '16px', color: 'var(--danger)' }} />
            </button>
          </div>

          {cleared && (
            <div className="text-[12px] text-[var(--success)] flex items-center gap-1.5 px-2">
              <Check style={{ width: '14px', height: '14px' }} />
              <span>Local data erased successfully</span>
            </div>
          )}

          {imported && (
            <div className="text-[12px] text-[var(--success)] flex items-center gap-1.5 px-2">
              <Check style={{ width: '14px', height: '14px' }} />
              <span>Backup restored successfully</span>
            </div>
          )}
        </div>

        {/* GROUP 3: ABOUT */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[var(--tertiary)] uppercase tracking-wider block px-2">
            ABOUT
          </span>
          <div className="ios-grouped-list">
            <div className="ios-row">
              <span className="text-[14px] text-[var(--secondary)]">Version</span>
              <span className="text-[14px] font-medium text-[var(--foreground)] num-tabular">v{SITE_CONFIG.appVersion} ({SITE_CONFIG.activeTariffLabel})</span>
            </div>

            <Link href="/privacy" className="ios-row text-inherit no-underline">
              <span className="text-[14px] font-medium text-[var(--foreground)]">
                {lang === 'ml' ? 'സ്വകാര്യതാ നയം' : 'Privacy guarantee'}
              </span>
              <ChevronRight style={{ width: '15px', height: '15px', color: 'var(--quaternary)' }} />
            </Link>

            <Link href="/about" className="ios-row text-inherit no-underline">
              <span className="text-[14px] font-medium text-[var(--foreground)]">
                {lang === 'ml' ? 'BILLWISE വിവരങ്ങൾ' : 'About BILLWISE'}
              </span>
              <ChevronRight style={{ width: '15px', height: '15px', color: 'var(--quaternary)' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Paper Shredder Confirmation Modal */}
      {showShredder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setShowShredder(false)}
              aria-label="Close confirmation dialog"
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <PaperShredder
              onShredComplete={handleShredComplete}
              title={lang === 'ml' ? 'ഡാറ്റ നശിപ്പിക്കുക' : 'Wipe Session & History'}
              label={lang === 'ml' ? 'ക്ലിക്ക് ചെയ്ത് സ്ഥിരീകരിക്കുക' : 'Click to shred and clear all data'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

