'use client';

import React, { useState } from 'react';
import { PredictionResult } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getShareUrl } from '@/lib/config/site';
import { Check, Copy, Share2, X } from 'lucide-react';

interface ShareModalProps {
  prediction: PredictionResult;
  onClose: () => void;
}

export default function ShareModal({ prediction, onClose }: ShareModalProps) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  const shareText = `BILLWISE Estimate:
Next KSEB Bill: ₹${prediction.estimatedBill.toLocaleString('en-IN')}
Likely range: ₹${prediction.likelyRangeMin.toLocaleString('en-IN')} – ₹${prediction.likelyRangeMax.toLocaleString('en-IN')}
Projected: ${prediction.projectedUnits} units (${prediction.unitsPerDay} units/day)
Calculate yours: ${getShareUrl(prediction.projectedUnits)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.36)', backdropFilter: 'blur(4px)' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* iOS Action Sheet Container */}
      <div className="relative z-10 w-full sm:max-w-sm ios-sheet sm:rounded-3xl p-5 pb-8 sm:pb-6 space-y-4">
        {/* Grab Handle */}
        <div className="sm:hidden flex justify-center pb-2">
          <div className="ios-sheet-handle" />
        </div>

        <div className="flex items-center justify-between pb-1">
          <h3 className="text-base font-semibold text-[#1C1C1E]">
            {lang === 'ml' ? 'എസ്റ്റിമേറ്റ് പങ്കുവെക്കാം' : 'Share Estimate'}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/[0.05] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] active:scale-95 transition-all"
            aria-label="Close"
          >
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        {/* Clean Native Preview */}
        <div className="rounded-2xl bg-black/[0.03] p-4 text-center space-y-1">
          <span className="text-[11px] font-medium text-[#8E8E93] block">
            {lang === 'ml' ? 'അടുത്ത KSEB ബിൽ' : 'Next KSEB bill'}
          </span>
          <div className="num-hero text-3xl font-semibold text-[#1C1C1E]">
            ₹{prediction.estimatedBill.toLocaleString('en-IN')}
          </div>
          <p className="text-[12px] text-[#6E6E73]">
            ₹{prediction.likelyRangeMin.toLocaleString('en-IN')} – ₹{prediction.likelyRangeMax.toLocaleString('en-IN')} · {prediction.projectedUnits} units
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleWhatsApp}
            className="w-full h-12 rounded-xl bg-[#25D366] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Share2 style={{ width: '16px', height: '16px' }} />
            <span>{lang === 'ml' ? 'WhatsApp-ൽ അയക്കുക' : 'Share to WhatsApp'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full h-12 rounded-xl bg-black/[0.05] text-[#1C1C1E] text-[14px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {copied ? (
              <>
                <Check style={{ width: '16px', height: '16px', color: '#34C759' }} />
                <span>{lang === 'ml' ? 'കോപ്പി ചെയ്തു!' : 'Copied to Clipboard'}</span>
              </>
            ) : (
              <>
                <Copy style={{ width: '16px', height: '16px', color: '#6E6E73' }} />
                <span>{lang === 'ml' ? 'ടെക്സ്റ്റ് കോപ്പി ചെയ്യുക' : 'Copy Text'}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-transparent text-[#8E8E93] text-[14px] font-medium flex items-center justify-center active:scale-[0.98] transition-all"
          >
            {lang === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
