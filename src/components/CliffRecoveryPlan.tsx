'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { calculateBill } from '@/lib/calculation/engine';
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  Check,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { analytics } from '@/lib/observability/analytics';

interface ApplianceCutOption {
  id: string;
  nameEng: string;
  nameMal: string;
  detailEng: string;
  detailMal: string;
  dailyUnitSavings: number;
  icon: string;
}

const APPLIANCE_CUT_OPTIONS: ApplianceCutOption[] = [
  {
    id: 'ac_eco',
    nameEng: 'AC Eco Temperature (26°C + 4h Timer)',
    nameMal: 'എസി 26°C ലും 4 മണിക്കൂർ ടൈമറിലും ആക്കുക',
    detailEng: 'Shift temperature from 20°C/22°C to 26°C with auto-sleep after 4 hours.',
    detailMal: '22 ഡിഗ്രിയിൽ നിന്ന് 26 ഡിഗ്രിയിലേക്ക് മാറ്റുക, രാത്രി 4 മണിക്കൂർ ടൈമർ വെക്കുക.',
    dailyUnitSavings: 1.2,
    icon: '❄️',
  },
  {
    id: 'geyser_cut',
    nameEng: 'Geyser / Water Heater Smart Limit',
    nameMal: 'ഗീസർ / വാട്ടർ ഹീറ്റർ ഉപയോഗം ചുരുക്കുക',
    detailEng: 'Turn on for 15 minutes before bath only; keep switched off during daytime.',
    detailMal: 'കുളിക്കുന്നതിന് 15 മിനിറ്റ് മുൻപ് മാത്രം ഓൺ ചെയ്യുക, പകലിൽ ഓഫ് ചെയ്തിടുക.',
    dailyUnitSavings: 0.7,
    icon: '🚿',
  },
  {
    id: 'ironing_batch',
    nameEng: 'Ironing & Heavy Laundry Batching',
    nameMal: 'ഇസ്തിരിയിടലും വാഷിംഗ് മെഷീനും ഒന്നിച്ച് ചെയ്യുക',
    detailEng: 'Batch iron all clothes at once, use cold wash cycle on washing machine.',
    detailMal: 'വസ്ത്രങ്ങൾ ഓരോന്നായി ചെയ്യാതെ ഒന്നിച്ച് ഇസ്തിരിയിടുക, തണുത്ത വെള്ളത്തിൽ അലക്കുക.',
    dailyUnitSavings: 0.4,
    icon: '👔',
  },
  {
    id: 'standby_cut',
    nameEng: 'Standby Power & Set-Top Box Off',
    nameMal: 'ടിവി സെറ്റ് ടോപ്പ് ബോക്സും സ്റ്റാൻഡ്ബൈയും ഓഫ് ചെയ്യുക',
    detailEng: 'Turn off TV socket, microwave, and chargers at the wall switch overnight.',
    detailMal: 'രാത്രിയിൽ ടിവി, സെറ്റ് ടോപ്പ് ബോക്സ് എന്നിവ പ്ലഗ് പോയിന്റിൽ തന്നെ സ്വിച്ച് ഓഫ് ചെയ്യുക.',
    dailyUnitSavings: 0.3,
    icon: '🔌',
  },
];

interface CliffRecoveryPlanProps {
  currentProjectedUnits: number;
  daysRemaining?: number;
  phase?: 'single' | 'three';
  onPlanApplied?: (rescuedUnits: number) => void;
}

export default function CliffRecoveryPlan({
  currentProjectedUnits,
  daysRemaining = 18,
  phase = 'single',
  onPlanApplied,
}: CliffRecoveryPlanProps) {
  const { lang } = useLanguage();
  const [selectedCutIds, setSelectedCutIds] = useState<string[]>(['ac_eco']);

  const excessUnits = Math.max(0, currentProjectedUnits - 240);
  const requiredDailyCut = daysRemaining > 0 ? Number((excessUnits / daysRemaining).toFixed(2)) : excessUnits;

  // Toggle selection
  const toggleCut = (id: string) => {
    setSelectedCutIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sum daily savings
  const totalDailySavings = useMemo(() => {
    return selectedCutIds.reduce((sum, id) => {
      const opt = APPLIANCE_CUT_OPTIONS.find((o) => o.id === id);
      return sum + (opt ? opt.dailyUnitSavings : 0);
    }, 0);
  }, [selectedCutIds]);

  const totalCycleSavings = Number((totalDailySavings * daysRemaining).toFixed(1));
  const newProjectedUnits = Math.max(0, Math.round(currentProjectedUnits - totalCycleSavings));
  const isSafe = newProjectedUnits <= 240;

  // Bills comparison
  const originalBill = useMemo(() => {
    return calculateBill({ units: currentProjectedUnits, phase, billingCycle: 'bi-monthly' });
  }, [currentProjectedUnits, phase]);

  const newBill = useMemo(() => {
    return calculateBill({ units: newProjectedUnits, phase, billingCycle: 'bi-monthly' });
  }, [newProjectedUnits, phase]);

  const totalMoneySaved = Math.max(0, originalBill.total - newBill.total);

  return (
    <div className="rounded-[24px] bg-white border border-black/[0.08] p-5 sm:p-6 space-y-4 shadow-sm">
      {/* Title & Status */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isSafe
                  ? 'bg-[#17C964]/10 text-[#0E7036]'
                  : 'bg-[#E11D48]/10 text-[#E11D48]'
              }`}
            >
              {isSafe
                ? lang === 'ml' ? 'സബ്സിഡി സുരക്ഷിതം' : 'Subsidy Rescued'
                : lang === 'ml' ? 'ക്ലിഫ് മുന്നറിയിപ്പ്' : 'Cliff Alert Active'}
            </span>
            <span className="text-[11px] text-[#71717A] num-tabular">
              {daysRemaining} {lang === 'ml' ? 'ദിവസം ബാക്കി' : 'days left'}
            </span>
          </div>

          <h3 className="text-[18px] font-bold text-[#17171C]">
            {isSafe
              ? lang === 'ml' ? 'നിങ്ങളുടെ പ്ലാൻ വിജയിച്ചു! ₹' + totalMoneySaved + ' ലാഭിക്കാം' : `Plan Active: Saving ₹${totalMoneySaved}`
              : lang === 'ml' ? '240 യൂണിറ്റ് കടക്കാതിരിക്കാൻ ഒരു പ്ലാൻ' : 'Cliff Recovery Plan'}
          </h3>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
            isSafe ? 'bg-[#17C964]' : 'bg-[#E11D48]'
          }`}
        >
          {isSafe ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
      </div>

      {/* Progress / Target Banner */}
      <div className="bg-[#F4F4F5] p-3.5 rounded-2xl border border-black/[0.04] space-y-2">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#71717A] font-medium">
            {lang === 'ml' ? 'കണക്കാക്കിയ പുതിയ യൂണിറ്റ്:' : 'New projected units:'}
          </span>
          <span className="font-bold text-[#17171C] num-tabular">
            {newProjectedUnits} units{' '}
            <span className="text-[11px] text-[#71717A] font-normal">
              ({currentProjectedUnits} → {newProjectedUnits})
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#71717A] font-medium">
            {lang === 'ml' ? 'പുതിയ ബിൽ തുക:' : 'Estimated bill:'}
          </span>
          <span className="font-bold num-tabular text-[#0E7036] text-[16px]">
            ₹{newBill.total}{' '}
            <span className="text-[12px] font-semibold text-[#0E7036]">
              (−₹{totalMoneySaved})
            </span>
          </span>
        </div>

        {/* Target warning if not safe yet */}
        {!isSafe && (
          <p className="text-[12px] text-[#E11D48] pt-1 border-t border-black/[0.05]">
            {lang === 'ml'
              ? `ഇനിയും ${newProjectedUnits - 240} യൂണിറ്റ് കൂടി കുറച്ചാൽ മാത്രമേ ₹148 സബ്സിഡി ലഭിക്കൂ. താഴെ മറ്റൊരു വഴി കൂടി തിരഞ്ഞെടുക്കുക:`
              : `Still ${newProjectedUnits - 240} units over the cliff. Select 1 more cut to rescue your full subsidy.`}
          </p>
        )}
      </div>

      {/* Actionable Appliance Cut Options */}
      <div className="space-y-2 pt-1">
        <span className="text-[12px] font-bold text-[#71717A] uppercase tracking-wider block">
          {lang === 'ml' ? 'നടപ്പിലാക്കാൻ കഴിയുന്ന മാറ്റങ്ങൾ:' : 'Select Actionable Cuts for 18 Days:'}
        </span>

        {APPLIANCE_CUT_OPTIONS.map((opt) => {
          const isSelected = selectedCutIds.includes(opt.id);
          const totalUnitsRescued = Number((opt.dailyUnitSavings * daysRemaining).toFixed(1));

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleCut(opt.id)}
              className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-[#006FEE]/5 border-[#006FEE]/30 shadow-2xs'
                  : 'bg-white border-black/[0.06] hover:border-black/[0.12]'
              }`}
            >
              <div className="text-[20px] shrink-0 mt-0.5">{opt.icon}</div>

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#17171C]">
                    {lang === 'ml' ? opt.nameMal : opt.nameEng}
                  </span>
                  <span className="text-[11px] font-semibold text-[#006FEE] bg-[#006FEE]/10 px-2 py-0.5 rounded-full shrink-0">
                    −{opt.dailyUnitSavings}u/day (−{totalUnitsRescued}u)
                  </span>
                </div>

                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  {lang === 'ml' ? opt.detailMal : opt.detailEng}
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-1 border transition-all ${
                  isSelected
                    ? 'bg-[#006FEE] border-[#006FEE] text-white'
                    : 'border-black/[0.2] bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Apply Plan Confirmation Button */}
      {isSafe && (
        <button
          type="button"
          onClick={() => {
            if (onPlanApplied) onPlanApplied(newProjectedUnits);
            analytics.track('cliff_recovery_plan_applied', {
              savedRupees: totalMoneySaved,
              rescuedUnits: currentProjectedUnits - newProjectedUnits,
            });
          }}
          className="ios-btn-primary w-full py-3.5 px-4 text-[14px] font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {lang === 'ml'
              ? `ഈ പ്ലാൻ ഉറപ്പിക്കുക (₹${totalMoneySaved} ലാഭിക്കും)`
              : `Apply Plan: Lock in ₹${totalMoneySaved} Savings`}
          </span>
        </button>
      )}
    </div>
  );
}
