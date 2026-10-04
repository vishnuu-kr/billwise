'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { PredictionResult, Phase, BillingCycle } from '@/types';
import { analytics } from '@/lib/observability/analytics';
import { Bookmark, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface SaveHomePromptProps {
  prediction: PredictionResult;
  lastReading?: number;
  lastBillAmount?: number;
  phase?: Phase;
  billingCycle?: BillingCycle;
  connectedLoadWatts?: number;
  onHomeSaved?: () => void;
}

export default function SaveHomePrompt({
  prediction,
  lastReading,
  lastBillAmount,
  phase = 'single',
  billingCycle = 'bi-monthly',
  connectedLoadWatts = 1000,
  onHomeSaved,
}: SaveHomePromptProps) {
  const { lang } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // If already saved, don't show prompt
  if (storageManager.hasSavedHome() || isDismissed) {
    return null;
  }

  const handleSave = () => {
    const today = new Date().toISOString().slice(0, 10);
    const resolvedLastReading = typeof lastReading === 'number' && lastReading > 0 ? lastReading : 0;
    const hasMeterReading = resolvedLastReading > 0;
    storageManager.saveHome({
      id: 'home-primary',
      name: 'Home',
      billingCycle,
      tariff: 'LT-1A',
      phase,
      connectedLoadWatts,
      lastBillAmount: typeof lastBillAmount === 'number' && lastBillAmount > 0 ? lastBillAmount : prediction.estimatedBill,
      lastBillUnits: prediction.projectedUnits,
      lastBillDate: typeof lastBillAmount === 'number' && lastBillAmount > 0 ? today : undefined,
      lastReading: resolvedLastReading,
      lastReadingDate: today,
      currentReading: hasMeterReading ? resolvedLastReading + prediction.currentUnits : undefined,
      currentReadingDate: hasMeterReading ? today : undefined,
      latestPrediction: {
        estimatedBill: prediction.estimatedBill,
        likelyRangeMin: prediction.likelyRangeMin,
        likelyRangeMax: prediction.likelyRangeMax,
        projectedUnits: prediction.projectedUnits,
        unitsPerDay: prediction.unitsPerDay,
        daysElapsed: prediction.daysElapsed,
        daysRemaining: prediction.daysRemaining,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    analytics.track('home_saved', {
      phase,
      cycle: billingCycle,
      projectedUnits: prediction.projectedUnits,
    });

    setIsSaved(true);
    if (onHomeSaved) {
      onHomeSaved();
    }
  };

  if (isSaved) {
    return (
      <div className="rounded-2xl bg-[#17C964]/10 border border-[#17C964]/20 p-4 flex items-center gap-3 text-[#0E7036] animate-in fade-in duration-200">
        <div className="w-8 h-8 rounded-full bg-[#17C964] flex items-center justify-center text-white shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[13px] font-semibold">
            {lang === 'ml' ? 'വീട് ഫോണിൽ സേവ് ചെയ്തു' : 'Home saved to this device'}
          </p>
          <p className="text-[11px] text-[#0E7036]/80 mt-0.5">
            {lang === 'ml'
              ? 'അടുത്ത തവണ മീറ്റർ നോക്കി നിമിഷങ്ങൾക്കകം ബിൽ പരിശോധിക്കാം.'
              : 'Next time, update your meter in seconds without re-entering details.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#006FEE]/5 border border-[#006FEE]/15 p-4 sm:p-5 space-y-3 relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#006FEE]/10 border border-[#006FEE]/20 flex items-center justify-center text-[#006FEE] shrink-0 mt-0.5">
          <Bookmark className="w-4 h-4" />
        </div>
        <div className="space-y-1 pr-1">
          <h4 className="text-[14px] font-semibold text-[#17171C] leading-snug">
            {lang === 'ml' ? 'ഈ വീട് ഓർത്തു വെക്കണോ?' : 'Want BILLWISE to remember this home?'}
          </h4>
          <p className="text-[12px] text-[#71717A] leading-relaxed">
            {lang === 'ml'
              ? 'നിങ്ങളുടെ റീഡിംഗുകൾ ഈ ഫോണിൽ മാത്രം സുരക്ഷിതമായിരിക്കും. അടുത്ത തവണ നിമിഷങ്ങൾക്കകം മീറ്റർ അപ്ഡേറ്റ് ചെയ്യാം.'
              : 'Your readings stay on this device. Next time, you can update your meter in seconds.'}
          </p>
        </div>
      </div>

      {/* Trust reassurance */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] pl-1">
        <ShieldCheck className="w-3.5 h-3.5 text-[#17C964]" />
        <span>
          {lang === 'ml'
            ? 'അക്കൗണ്ടോ ഫോൺ നമ്പറോ ആവശ്യമില്ല · 100% സ്വകാര്യം'
            : 'No account · No phone number · 100% on-device storage'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="ios-btn-primary flex-1 py-2.5 px-3 text-[13px] font-semibold rounded-xl flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'ml' ? 'ഈ വീട് സേവ് ചെയ്യുക' : 'Save this home'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="ios-btn-secondary py-2.5 px-3 text-[13px] font-medium text-[#71717A] hover:text-[#17171C] rounded-xl"
        >
          {lang === 'ml' ? 'ഇപ്പോഴല്ല' : 'Not now'}
        </button>
      </div>
    </div>
  );
}
