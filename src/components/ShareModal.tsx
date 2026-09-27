'use client';

import React, { useState } from 'react';
import { PredictionResult } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { X, Check, Copy, Share2 } from 'lucide-react';

interface ShareModalProps {
  prediction: PredictionResult;
  onClose: () => void;
}

export default function ShareModal({ prediction, onClose }: ShareModalProps) {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const shareText = `⚡ BILLWISE Estimate:
Next KSEB Bill: ₹${prediction.estimatedBill.toLocaleString('en-IN')}
Likely range: ₹${prediction.likelyRangeMin.toLocaleString('en-IN')} – ₹${prediction.likelyRangeMax.toLocaleString('en-IN')}
Projected: ${prediction.projectedUnits} units (${prediction.unitsPerDay} units/day)
Calculate yours free on BILLWISE: https://billwise.app`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">
            {lang === 'ml' ? 'എസ്റ്റിമേറ്റ് പങ്കുവെക്കാം' : 'Share Bill Estimate'}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors touch-target"
            aria-label="Close share modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clean Visual Card Preview */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 text-center shadow-sm">
          <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            {lang === 'ml' ? 'അടുത്ത KSEB ബിൽ' : 'NEXT KSEB BILL'}
          </div>
          <div className="mt-2 text-4xl font-extrabold text-slate-900 num-tabular">
            ₹{prediction.estimatedBill.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {lang === 'ml'
              ? `സാധ്യതാ പരിധി ₹${prediction.likelyRangeMin.toLocaleString('en-IN')} – ₹${prediction.likelyRangeMax.toLocaleString('en-IN')}`
              : `Expected range ₹${prediction.likelyRangeMin.toLocaleString('en-IN')} – ₹${prediction.likelyRangeMax.toLocaleString('en-IN')}`}
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">
            {lang === 'ml'
              ? `${prediction.projectedUnits} യൂണിറ്റ് പ്രതീക്ഷിക്കുന്നു`
              : `${prediction.projectedUnits} units projected`}
          </div>
          <div className="mt-3 text-[10px] font-mono text-slate-400">
            billwise.app • Zero privacy tracking
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-[0.98] transition-all touch-target"
          >
            <Share2 className="h-4 w-4" />
            <span>{lang === 'ml' ? 'വാട്ട്‌സ്ആപ്പിൽ പങ്കുവെക്കാം' : 'Share to WhatsApp'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors touch-target"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{lang === 'ml' ? 'കോപ്പി ചെയ്തു!' : 'Copied to Clipboard!'}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>{lang === 'ml' ? 'ടെക്സ്റ്റ് കോപ്പി ചെയ്യാം' : 'Copy Summary Text'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
