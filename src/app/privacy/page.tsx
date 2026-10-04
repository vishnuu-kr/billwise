'use client';

import React, { useState } from 'react';
import { storageManager } from '@/lib/storage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Trash2, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const [deleted, setDeleted] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const handleDeleteData = () => {
    if (confirm(lang === 'ml' ? 'സേവ് ചെയ്ത വിവരങ്ങൾ ഒഴിവാക്കണോ?' : 'Wipe all saved readings and budgets from your device?')) {
      storageManager.clearAllData();
      setDeleted(true);
      setTimeout(() => setDeleted(false), 3000);
    }
  };

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] active:opacity-60 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
      </Link>

      {/* Title */}
      <div className="space-y-1">
        <span className="text-[12px] font-medium text-[#8E8E93] block">
          {lang === 'ml' ? 'സുരക്ഷ & സ്വകാര്യത' : 'Privacy & Security'}
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[#1C1C1E]">
          {lang === 'ml' ? 'ഡാറ്റ സ്വകാര്യത' : 'Privacy guarantee'}
        </h1>
        <p className="text-[15px] font-normal text-[#6E6E73] leading-relaxed pt-1">
          {lang === 'ml'
            ? 'നിങ്ങളുടെ വിവരങ്ങൾ നിങ്ങളുടെ ഫോണിൽ മാത്രം സൂക്ഷിക്കുന്നു.'
            : 'Your electricity data never leaves your device.'}
        </p>
      </div>

      <div className="space-y-5">
        {/* GROUP 1: WHAT STAYS ON YOUR DEVICE */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider block px-1">
            {lang === 'ml' ? 'ഡിവൈസിൽ സൂക്ഷിക്കുന്നത്' : 'What stays on your device'}
          </span>
          <div className="ios-grouped-list p-4 space-y-2 text-[14px] text-[#6E6E73] leading-relaxed">
            <p>
              • <strong className="text-[#1C1C1E]">Meter readings:</strong> Past and present readings are stored exclusively in your browser’s localStorage.
            </p>
            <p>
              • <strong className="text-[#1C1C1E]">Bill scans:</strong> Image OCR processing runs directly on your device CPU. No bill images or photos are ever uploaded to any cloud server.
            </p>
            <p>
              • <strong className="text-[#1C1C1E]">Budget goals:</strong> Spending targets stay on this device only.
            </p>
          </div>
        </div>

        {/* GROUP 2: WHAT GETS SENT */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider block px-1">
            {lang === 'ml' ? 'പുറത്തേക്ക് അയക്കുന്നത്' : 'What gets sent'}
          </span>
          <div className="ios-grouped-list p-4 space-y-1 text-[14px] text-[#6E6E73] leading-relaxed">
            <p className="text-[#1C1C1E] font-medium">Nothing.</p>
            <p>Zero bytes of billing data or photos leave your phone.</p>
          </div>
        </div>

        {/* GROUP 3: WHAT WE DON'T COLLECT */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider block px-1">
            {lang === 'ml' ? 'ശേഖരിക്കാത്തവ' : 'What we do not collect'}
          </span>
          <div className="ios-grouped-list p-4 space-y-2 text-[14px] text-[#6E6E73] leading-relaxed">
            <p>• No consumer number, phone number, name, or address.</p>
            <p>• No login credentials or account profiles.</p>
            <p>• No third-party ad trackers or behavioural cookies.</p>
          </div>
        </div>

        {/* GROUP 4: DELETE YOUR DATA */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider block px-1">
            {lang === 'ml' ? 'ഡാറ്റ ഒഴിവാക്കാം' : 'Delete your data'}
          </span>
          <div className="ios-grouped-list p-4 space-y-3">
            <p className="text-[13px] text-[#6E6E73]">
              {lang === 'ml'
                ? 'നിങ്ങളുടെ ഉപകരണത്തിൽ ശേഖരിച്ച എല്ലാ റീഡിംഗുകളും ബജറ്റുകളും ഉടൻ തന്നെ നീക്കം ചെയ്യാം.'
                : 'Instantly wipe all reading history and preferences stored on this device.'}
            </p>
            <button
              onClick={handleDeleteData}
              className="ios-btn-secondary text-[#FF3B30] border-[#FF3B30]/30 w-full"
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
              <span>{lang === 'ml' ? 'ഡാറ്റ പൂർണ്ണമായി ഒഴിവാക്കൂ' : 'Wipe all device data'}</span>
            </button>
            {deleted && (
              <p className="text-[12px] text-[#34C759] flex items-center gap-1 font-medium">
                <Check style={{ width: '14px', height: '14px' }} />
                <span>Local data erased.</span>
              </p>
            )}
          </div>
        </div>

        {/* TECHNICAL ACCORDION */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowTechnical(prev => !prev)}
            className="flex items-center justify-between w-full text-[13px] text-[#6E6E73] hover:text-[#1C1C1E] transition-colors py-2"
          >
            <span>Technical architecture details</span>
            <ChevronDown
              style={{
                width: '14px',
                height: '14px',
                transform: showTechnical ? 'rotate(180deg)' : 'none',
                transition: 'transform 150ms ease',
              }}
            />
          </button>
          {showTechnical && (
            <div className="ios-surface-1 p-4 mt-2 text-[12px] text-[#6E6E73] space-y-2">
              <p>Storage Engine: Browser LocalStorage (Web Storage API)</p>
              <p>Image Processing: Canvas 2D Context + WebAssembly OCR</p>
              <p>Network Calls: Strictly limited to static application assets (HTML/JS/CSS)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
