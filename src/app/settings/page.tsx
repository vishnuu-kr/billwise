'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import {
  Settings2,
  Globe,
  Trash2,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { lang, setLang, t } = useLanguage();
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    const confirmMsg = lang === 'ml'
      ? 'നിങ്ങളുടെ സേവ് ചെയ്ത എല്ലാ മീറ്റർ റീഡിംഗുകളും ഹിസ്റ്ററിയും ഒഴിവാക്കണോ?'
      : 'Clear all your saved meter readings, history, and preferences?';
    if (confirm(confirmMsg)) {
      storageManager.clearAllData();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
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

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'ക്രമീകരണങ്ങൾ' : 'Preferences'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
          {lang === 'ml' ? 'ക്രമീകരണങ്ങളും ഡാറ്റയും' : 'Settings & Data'}
        </h1>
      </div>

      {/* Language Preference */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Globe className="h-4 w-4 text-sky-600" />
          <span>Language / ഭാഷ</span>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => setLang('en')}
            className={`rounded-xl border p-3 text-xs font-semibold transition-all touch-target ${
              lang === 'en'
                ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            English
          </button>

          <button
            onClick={() => setLang('ml')}
            className={`rounded-xl border p-3 text-xs font-semibold transition-all touch-target ${
              lang === 'ml'
                ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            മലയാളം (Malayalam)
          </button>
        </div>
      </div>

      {/* Local Storage & Backup */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          {lang === 'ml' ? 'ഡാറ്റ ബാക്കപ്പ്' : 'Local Data Backup'}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {lang === 'ml'
            ? 'നിങ്ങളുടെ മീറ്റർ റീഡിംഗുകളും ബജറ്റും ഈ ഫോണിൽ/കമ്പ്യൂട്ടറിൽ മാത്രമാണ് സേവ് ചെയ്തിട്ടുള്ളത്. നിങ്ങൾക്ക് ഇത് മറ്റൊരു ബ്രൗസറിലേക്ക് മാറ്റാൻ ഡൗൺലോഡ് ചെയ്യാം.'
            : 'Your meter readings and budget settings are saved only on this phone/computer. You can download a backup or transfer it to another browser.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors touch-target"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>{lang === 'ml' ? 'ഡാറ്റ ഡൗൺലോഡ്' : 'Export JSON'}</span>
          </button>

          <Link
            href="/history"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors touch-target"
          >
            <span>{lang === 'ml' ? 'ഉപയോഗ ചരിത്രം കാണുക' : 'View History Records'}</span>
          </Link>
        </div>
      </div>

      {/* Privacy Wipe */}
      <div className="rounded-3xl border border-red-100 bg-red-50/60 p-5 sm:p-6 space-y-3">
        <h3 className="font-bold text-red-950 text-sm">
          {lang === 'ml' ? 'ഡാറ്റ പൂർണ്ണമായി ഒഴിവാക്കുക' : 'Wipe Local Storage'}
        </h3>
        <p className="text-xs text-red-900 leading-relaxed">
          {lang === 'ml'
            ? 'ഈ ഉപകരണത്തിൽ സേവ് ചെയ്തിട്ടുള്ള എല്ലാ മുൻകാല വിവരങ്ങളും പൂർണ്ണമായി ഒഴിവാക്കാം.'
            : 'Erase all history records, cached bill scans, and preferences from this device.'}
        </p>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 active:scale-[0.98] transition-all touch-target"
        >
          <Trash2 className="h-4 w-4" />
          <span>
            {cleared
              ? (lang === 'ml' ? 'ഡാറ്റ ഒഴിവാക്കി' : 'All local data deleted')
              : (lang === 'ml' ? 'എല്ലാ ഡാറ്റയും ഒഴിവാക്കുക' : 'Delete all local data')}
          </span>
        </button>
      </div>
    </div>
  );
}
