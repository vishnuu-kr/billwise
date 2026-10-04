'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { SavedHomeProfile, Phase, BillingCycle } from '@/types';
import { NATIONAL_PROVIDER_REGISTRY } from '@/lib/electricity/providers';
import { ElectricityProvider } from '@/lib/electricity/types';
import { ProviderSelectModal } from './ProviderSelectModal';
import { calculateBill } from '@/lib/calculation/engine';
import { predictUsage } from '@/lib/prediction/engine';
import { analytics } from '@/lib/observability/analytics';
import {
  Camera,
  Gauge,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  X,
  Check,
  Building2,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (home: SavedHomeProfile) => void;
}

type SetupStep = 'provider' | 'choose-path' | 'meter-input' | 'units-input' | 'confirm';

export default function OnboardingWizardModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingWizardModalProps) {
  const router = useRouter();
  const { lang } = useLanguage();

  const [step, setStep] = useState<SetupStep>('provider');
  const [provider, setProvider] = useState<ElectricityProvider>(NATIONAL_PROVIDER_REGISTRY['kseb']);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('single');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('bi-monthly');
  const [connectedLoadWatts, setConnectedLoadWatts] = useState<number>(2000);

  // Path data
  const [chosenPath, setChosenPath] = useState<'scan' | 'meter' | 'units'>('units');
  const [meterReadingInput, setMeterReadingInput] = useState<string>('');
  const [optionalPrevReading, setOptionalPrevReading] = useState<string>('');
  const [selectedUnits, setSelectedUnits] = useState<number>(240);
  const [inputError, setInputError] = useState<string | null>(null);

  // Handled cleanly via AnimatePresence in render

  const handleDismiss = () => {
    storageManager.setOnboardingCompleted(true);
    analytics.track('onboarding_dismissed', { step });
    onClose();
  };

  const handleSelectProvider = (p: ElectricityProvider) => {
    setProvider(p);
    if (p.billingCycles.includes('MONTHLY') && !p.billingCycles.includes('BIMONTHLY')) {
      setBillingCycle('monthly');
    } else {
      setBillingCycle('bi-monthly');
    }
    setIsProviderModalOpen(false);
  };

  const handleFinishWithMeter = () => {
    setInputError(null);
    const currNum = Number(meterReadingInput.trim());
    if (!meterReadingInput.trim() || isNaN(currNum) || currNum <= 0) {
      setInputError(lang === 'ml' ? 'സാധുവായ മീറ്റർ റീഡിംഗ് നൽകുക (e.g. 10450).' : 'Please enter a valid meter reading (e.g. 10450).');
      return;
    }

    const prevNum = optionalPrevReading.trim() ? Number(optionalPrevReading.trim()) : null;
    const today = new Date().toISOString().slice(0, 10);

    let profile: SavedHomeProfile;

    if (prevNum !== null && !isNaN(prevNum) && prevNum > 0) {
      if (currNum < prevNum) {
        setInputError(
          lang === 'ml'
            ? 'ഇപ്പോഴത്തെ റീഡിംഗ് കഴിഞ്ഞതിനേക്കാൾ കുറവാകാൻ കഴിയില്ല. നിങ്ങളുടെ മീറ്ററിലെ കറുത്ത 5 അക്കങ്ങൾ പരിശോധിക്കുക.'
            : 'Current reading cannot be lower than previous reading. Check the 5 black digits on your meter or adjust your previous bill reading.'
        );
        return;
      }
      const consumedUnits = currNum - prevNum;
      const prediction = predictUsage({
        previousReading: prevNum,
        currentReading: currNum,
        daysElapsed: 30,
        totalCycleDays: billingCycle === 'monthly' ? 30 : 60,
        billingCycle,
        phase,
        connectedLoadWatts,
      });

      profile = {
        id: 'home_primary',
        name: 'Home',
        providerId: provider.id,
        providerName: provider.displayName,
        providerShortName: provider.shortName,
        state: provider.state,
        billingCycle,
        tariff: provider.supportedTariffCategories[0] || 'LT-1A',
        phase,
        connectedLoadWatts,
        lastReading: prevNum,
        lastReadingDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        currentReading: currNum,
        currentReadingDate: today,
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
      };
    } else {
      // Day 1 Baseline: Today is baseline start
      profile = {
        id: 'home_primary',
        name: 'Home',
        providerId: provider.id,
        providerName: provider.displayName,
        providerShortName: provider.shortName,
        state: provider.state,
        billingCycle,
        tariff: provider.supportedTariffCategories[0] || 'LT-1A',
        phase,
        connectedLoadWatts,
        lastReading: currNum,
        lastReadingDate: today,
        currentReading: undefined,
        currentReadingDate: undefined,
        latestPrediction: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    storageManager.saveHome(profile);
    storageManager.setOnboardingCompleted(true);
    analytics.track('onboarding_completed', {
      method: 'meter',
      provider: provider.id,
      hasPrevious: prevNum !== null,
    });
    onComplete(profile);
    onClose();
  };

  const handleFinishWithUnits = (unitsToUse: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const bill = calculateBill({
      units: unitsToUse,
      billingCycle,
      phase,
      connectedLoadWatts,
    });

    const profile: SavedHomeProfile = {
      id: 'home_primary',
      name: 'Home',
      providerId: provider.id,
      providerName: provider.displayName,
      providerShortName: provider.shortName,
      state: provider.state,
      billingCycle,
      tariff: provider.supportedTariffCategories[0] || 'LT-1A',
      phase,
      connectedLoadWatts,
      lastBillAmount: bill.total,
      lastBillUnits: unitsToUse,
      lastBillDate: today,
      lastReading: 0, // indicates no meter reading yet
      lastReadingDate: today,
      currentReading: undefined,
      currentReadingDate: undefined,
      latestPrediction: {
        estimatedBill: bill.total,
        likelyRangeMin: Math.round(bill.total * 0.95),
        likelyRangeMax: Math.round(bill.total * 1.05),
        projectedUnits: unitsToUse,
        unitsPerDay: Number((unitsToUse / (billingCycle === 'monthly' ? 30 : 60)).toFixed(1)),
        daysElapsed: billingCycle === 'monthly' ? 30 : 60,
        daysRemaining: 0,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageManager.saveHome(profile);
    storageManager.setOnboardingCompleted(true);
    analytics.track('onboarding_completed', {
      method: 'units',
      provider: provider.id,
      units: unitsToUse,
    });
    onComplete(profile);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'ml' ? 'സ്വാഗതം - വീട് സജ്ജീകരിക്കാം' : 'Welcome - Set up your home'}
            className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4"
          >
            {/* Backdrop with spring fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm -z-10"
              onClick={handleDismiss}
              aria-hidden="true"
            />

            {/* Fluid bottom sheet with drag-to-dismiss momentum */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  handleDismiss();
                }
              }}
              className="ios-sheet w-full max-h-[92vh] md:max-h-[85vh] md:max-w-[480px] md:rounded-[28px] md:shadow-2xl overflow-y-auto"
              style={{
                padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 24px)',
              }}
            >
              {/* Grab handle */}
              <div className="flex justify-center pt-1 pb-3 md:hidden">
                <div className="ios-sheet-handle cursor-grab active:cursor-grabbing" />
              </div>

          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              {step !== 'provider' && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'meter-input' || step === 'units-input') setStep('choose-path');
                    else if (step === 'choose-path') setStep('provider');
                  }}
                  className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center text-[#71717A] hover:text-[#17171C] active:scale-[0.96] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] rounded-full"
                  aria-label="Go back to previous step"
                >
                  <span className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.1] flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </span>
                </button>
              )}
              <span className="text-[11px] font-bold text-[#006FEE] uppercase tracking-wider">
                {step === 'provider' && (lang === 'ml' ? 'ഘട്ടം 1 / 2' : 'Step 1 of 2 · Provider')}
                {step === 'choose-path' && (lang === 'ml' ? 'ഘട്ടം 2 / 2' : 'Step 2 of 2 · Starting point')}
                {step === 'meter-input' && (lang === 'ml' ? 'മീറ്റർ നൽകാം' : 'Enter meter')}
                {step === 'units-input' && (lang === 'ml' ? 'യൂണിറ്റ് നൽകാം' : 'Choose units')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-[12px] font-medium text-[#71717A] hover:text-[#17171C] px-3 py-2 -mr-1 rounded-xl cursor-pointer min-h-[44px] flex items-center justify-center active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
              aria-label={lang === 'ml' ? 'ആരംഭം ഒഴിവാക്കുക' : 'Skip onboarding'}
            >
              {lang === 'ml' ? 'പിന്നീട്' : 'Skip'}
            </button>
          </div>

          {/* Steps container with horizontal fluid slide */}
          <AnimatePresence mode="wait">
            {step === 'provider' && (
              <motion.div
                key="step-provider"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-4 pt-3"
              >
                <div className="space-y-1">
                  <h2 className="text-[22px] font-bold tracking-tight text-[#17171C]">
                    {lang === 'ml' ? 'വൈദ്യുതി ബോർഡ് സ്ഥിരീകരിക്കുക' : 'Welcome to BILLWISE'}
                  </h2>
                  <p className="text-[13px] text-[#71717A] leading-relaxed">
                    {lang === 'ml'
                      ? 'മീറ്റർ റീഡർ വരുന്നതിനു മുൻപ് നിങ്ങളുടെ ബിൽ കൃത്യമായി അറിയാം. 100% സ്വകാര്യം, നിങ്ങളുടെ ഫോണിൽ മാത്രം.'
                      : 'Track your daily electricity pace and know your bill before it arrives. 100% on-device.'}
                  </p>
                </div>

                {/* Provider Card */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#F7F7F5] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                      {lang === 'ml' ? 'വൈദ്യുതി ബോർഡ്' : 'Electricity Provider'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsProviderModalOpen(true)}
                      className="text-[12px] font-semibold text-[#006FEE] hover:underline cursor-pointer"
                    >
                      {lang === 'ml' ? 'മാറ്റുക' : 'Change'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE] shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#17171C]">
                        {provider.displayName}
                      </h3>
                      <p className="text-[12px] text-[#71717A]">
                        {provider.state} · {provider.supportedTariffCategories[0] || 'LT-1A'} Domestic
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#0E7036] bg-[#17C964]/10 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ml'
                        ? 'ഔദ്യോഗിക നവംബർ 2024 താരിഫ് നിരക്കുകൾ പരിശോധിച്ചു'
                        : 'Verified KSERC Nov 2024 Domestic Tariffs'}
                    </span>
                  </div>
                </div>

                {/* Phase Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider block">
                    {lang === 'ml' ? 'കണക്ഷൻ തരം' : 'Supply Phase'}
                  </label>
                  <SegmentedControl
                    options={[
                      { value: 'single' as const, label: lang === 'ml' ? '1-ഫേസ് (Single)' : '1-Phase (Single)' },
                      { value: 'three' as const, label: lang === 'ml' ? '3-ഫേസ് (Three)' : '3-Phase (Three)' },
                    ]}
                    value={phase}
                    onChange={(v) => setPhase(v as Phase)}
                  />
                  <p className="text-[11px] text-[#71717A] pl-1">
                    {lang === 'ml'
                      ? 'കേരളത്തിലെ മിക്ക വീടുകളിലും സിംഗിൾ ഫേസ് (1-Phase) കണക്ഷനാണ് ഉള്ളത്.'
                      : 'Most domestic residences use standard Single Phase.'}
                  </p>
                </div>

                {/* Privacy Reassurance */}
                <div className="flex items-center gap-2 text-[11px] text-[#71717A] pt-1">
                  <ShieldCheck className="w-4 h-4 text-[#17C964] shrink-0" />
                  <span>
                    {lang === 'ml'
                      ? 'ലോഗിൻ ആവശ്യമില്ല · നിങ്ങളുടെ വിവരങ്ങൾ ഈ ഫോണിൽ മാത്രം സൂക്ഷിക്കുന്നു'
                      : 'Zero login · No phone numbers · All data stays on this device'}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('choose-path')}
                    className="ios-btn-primary w-full py-3.5 px-4 text-[14px] font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.97]"
                  >
                    <span>{lang === 'ml' ? 'തുടങ്ങാം' : 'Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full py-2.5 text-center text-[13px] font-medium text-[#71717A] hover:text-[#17171C] cursor-pointer"
                  >
                    {lang === 'ml' ? 'ആപ്പ് നേരിട്ട് കാണുക' : 'Explore on my own'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* -------------------------------------------------------------
                STEP 2: CHOOSE STARTING POINT
               ------------------------------------------------------------- */}
            {step === 'choose-path' && (
              <motion.div
                key="step-choose-path"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-4 pt-3"
              >
              <div className="space-y-1">
                <h2 className="text-[20px] font-bold tracking-tight text-[#17171C]">
                  {lang === 'ml' ? 'എങ്ങനെ തുടങ്ങാൻ ആഗ്രഹിക്കുന്നു?' : 'How would you like to start?'}
                </h2>
                <p className="text-[13px] text-[#71717A]">
                  {lang === 'ml'
                    ? 'ഏറ്റവും എളുപ്പമുള്ള മാർഗ്ഗം തിരഞ്ഞെടുക്കുക.'
                    : 'Select the easiest method for you right now.'}
                </p>
              </div>

              {/* 3 Starting Option Cards */}
              <div className="space-y-2.5 pt-1">
                {/* Option 1: Scan Bill */}
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    router.push('/scan');
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-black/[0.08] hover:border-[#006FEE] bg-white transition-all cursor-pointer shadow-2xs group flex items-start gap-3.5 active:scale-[0.97]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE] shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-bold text-[#17171C]">
                        {lang === 'ml' ? 'കഴിഞ്ഞ ബിൽ സ്കാൻ ചെയ്യാം' : 'Scan previous bill'}
                      </h4>
                      <span className="text-[10px] font-bold bg-[#006FEE]/10 text-[#006FEE] px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[12px] text-[#71717A] mt-0.5 leading-relaxed">
                      {lang === 'ml'
                        ? 'ബില്ലിലെ പഴയ റീഡിംഗും തീയതിയും ഓട്ടോമാറ്റിക്കായി വായിക്കും.'
                        : 'Reads previous reading and date from your paper bill or PDF.'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#006FEE] self-center shrink-0" />
                </button>

                {/* Option 2: Today's Meter Reading */}
                <button
                  type="button"
                  onClick={() => setStep('meter-input')}
                  className="w-full text-left p-4 rounded-2xl border border-black/[0.08] hover:border-[#006FEE] bg-white transition-all cursor-pointer shadow-2xs group flex items-start gap-3.5 active:scale-[0.97]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#17C964]/10 flex items-center justify-center text-[#0E7036] shrink-0 group-hover:scale-105 transition-transform">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-[#17171C]">
                      {lang === 'ml' ? 'ഇപ്പോഴത്തെ മീറ്റർ റീഡിംഗ് നൽകാം' : "Start with today's meter reading"}
                    </h4>
                    <p className="text-[12px] text-[#71717A] mt-0.5 leading-relaxed">
                      {lang === 'ml'
                        ? 'മീറ്ററിലെ 5 അക്കങ്ങൾ നൽകുക. ഇന്നത്തെ റീഡിംഗ് അടിസ്ഥാനമാക്കി സൂക്ഷിക്കാം.'
                        : "Standing by your meter? Record today's 5 digits to set your baseline."}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#006FEE] self-center shrink-0" />
                </button>

                {/* Option 3: Units / Rough estimate */}
                <button
                  type="button"
                  onClick={() => setStep('units-input')}
                  className="w-full text-left p-4 rounded-2xl border border-black/[0.08] hover:border-[#006FEE] bg-white transition-all cursor-pointer shadow-2xs group flex items-start gap-3.5 active:scale-[0.97]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F5A524]/10 flex items-center justify-center text-[#B45309] shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-[#17171C]">
                      {lang === 'ml' ? 'സാധാരണ ഉപയോഗം വച്ച് നോക്കാം' : 'Quick estimate with typical units'}
                    </h4>
                    <p className="text-[12px] text-[#71717A] mt-0.5 leading-relaxed">
                      {lang === 'ml'
                        ? 'ബില്ലോ മീറ്ററോ കയ്യിലില്ലേ? 240 യൂണിറ്റ് പോലുള്ള മാതൃക വച്ച് തുടങ്ങാം.'
                        : 'No bill or meter handy? Estimate with typical consumption (e.g. 240 units).'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#006FEE] self-center shrink-0" />
                </button>
              </div>
            </motion.div>
          )}

          {/* -------------------------------------------------------------
              STEP 3A: ENTER METER READING
             ------------------------------------------------------------- */}
          {step === 'meter-input' && (
            <motion.div
              key="step-meter-input"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4 pt-3"
            >
              <div className="space-y-1">
                <h2 className="text-[20px] font-bold tracking-tight text-[#17171C]">
                  {lang === 'ml' ? 'ഇപ്പോഴത്തെ മീറ്റർ റീഡിംഗ്' : "What's on your meter today?"}
                </h2>
                <p className="text-[13px] text-[#71717A]">
                  {lang === 'ml'
                    ? 'ഡിജിറ്റൽ മീറ്ററിലെ 5 അക്കങ്ങൾ നൽകുക (kWh).'
                    : 'Enter the 5-digit number shown on your digital meter.'}
                </p>
              </div>

              {inputError && (
                <div className="p-3 rounded-xl bg-[#F31260]/10 border border-[#F31260]/20 text-[#F31260] text-[12px] font-medium">
                  {inputError}
                </div>
              )}

              {/* Current reading input */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#006FEE]">
                  {lang === 'ml' ? 'ഇന്നത്തെ മീറ്റർ റീഡിംഗ്' : "Today's meter reading"}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={meterReadingInput}
                  onChange={(e) => setMeterReadingInput(e.target.value)}
                  placeholder="10450"
                  autoFocus
                  className="w-full h-13 rounded-2xl bg-[#F7F7F5] px-4 font-bold text-2xl num-tabular text-[#17171C] border border-[#006FEE]/50 outline-none focus:bg-white focus:border-[#006FEE]"
                />
              </div>

              {/* Optional previous reading */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[12px]">
                  <label className="font-medium text-[#71717A]">
                    {lang === 'ml' ? 'കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ് (ഓപ്ഷണൽ)' : 'Previous bill reading (optional)'}
                  </label>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={optionalPrevReading}
                  onChange={(e) => setOptionalPrevReading(e.target.value)}
                  placeholder="10210"
                  className="w-full h-11 rounded-xl bg-[#F7F7F5] px-3.5 font-semibold text-lg num-tabular text-[#17171C] border border-black/[0.08] outline-none focus:bg-white focus:border-[#006FEE]"
                />
                <p className="text-[11px] text-[#71717A]">
                  {lang === 'ml'
                    ? 'കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ് നൽകിയാൽ തത്സമയം ബിൽ കണക്കാക്കാം. ഇല്ലെങ്കിലും ഇന്നത്തെ റീഡിംഗ് സേവ് ചെയ്യാം.'
                    : 'If entered, we will calculate your live projected bill now. If omitted, today starts your baseline.'}
                </p>
              </div>

              {/* Finish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishWithMeter}
                  className="ios-btn-primary w-full py-3.5 px-4 text-[14px] font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.97]"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'ml' ? 'വീട് സേവ് ചെയ്യുക' : 'Save home profile'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* -------------------------------------------------------------
              STEP 3B: ENTER TYPICAL UNITS
             ------------------------------------------------------------- */}
          {step === 'units-input' && (
            <motion.div
              key="step-units-input"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4 pt-3"
            >
              <div className="space-y-1">
                <h2 className="text-[20px] font-bold tracking-tight text-[#17171C]">
                  {lang === 'ml' ? 'സാധാരണ എത്ര യൂണിറ്റ് വരും?' : 'Typical consumption'}
                </h2>
                <p className="text-[13px] text-[#71717A]">
                  {lang === 'ml'
                    ? 'ഒരു ബില്ലിംഗ് കാലയളവിലെ (2 മാസം) ഏകദേശ യൂണിറ്റ് തിരഞ്ഞെടുക്കുക.'
                    : 'Select your typical 2-month electricity consumption.'}
                </p>
              </div>

              {/* Unit chips */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { units: 100, label: '100 u', bill: '₹460' },
                  { units: 160, label: '160 u', bill: '₹740' },
                  { units: 200, label: '200 u', bill: '₹940' },
                  { units: 240, label: '240 u', bill: '₹1,148', badge: 'Subsidy Limit' },
                  { units: 300, label: '300 u', bill: '₹1,750' },
                  { units: 400, label: '400 u', bill: '₹2,590' },
                ].map((item) => (
                  <button
                    key={item.units}
                    type="button"
                    onClick={() => setSelectedUnits(item.units)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative active:scale-[0.96] ${
                      selectedUnits === item.units
                        ? 'border-[#006FEE] bg-[#006FEE]/5 text-[#006FEE] ring-2 ring-[#006FEE]/20 shadow-xs'
                        : 'border-black/[0.08] bg-white hover:bg-black/[0.02] text-[#17171C]'
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-[#17C964] text-white px-1.5 py-0.2 rounded-full whitespace-nowrap">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[15px] font-bold block num-tabular">{item.label}</span>
                    <span className="text-[11px] text-[#71717A] block mt-0.5 font-medium">{item.bill}</span>
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[12px] font-medium text-[#71717A] block">
                  {lang === 'ml' ? 'മറ്റൊരു യൂണിറ്റ് നൽകണോ?' : 'Or enter exact units:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={selectedUnits}
                    onChange={(e) => setSelectedUnits(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full h-12 rounded-xl bg-[#F7F7F5] px-3.5 font-bold text-xl num-tabular text-[#17171C] border border-black/[0.08] outline-none focus:bg-white focus:border-[#006FEE]"
                  />
                  <span className="text-[14px] font-semibold text-[#71717A] shrink-0">units</span>
                </div>
              </div>

              {/* Preview banner */}
              <div className="p-3.5 rounded-2xl bg-black/[0.03] flex items-center justify-between text-[13px]">
                <span className="text-[#71717A]">
                  {lang === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന ബിൽ:' : 'Estimated bill:'}
                </span>
                <span className="font-extrabold text-[16px] text-[#17171C] num-tabular">
                  ₹{calculateBill({ units: selectedUnits, billingCycle, phase, connectedLoadWatts }).total.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Finish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleFinishWithUnits(selectedUnits)}
                  className="ios-btn-primary w-full py-3.5 px-4 text-[14px] font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.97]"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'ml' ? 'ഈ വിവരങ്ങൾ സേവ് ചെയ്യുക' : 'Save & view my electricity'}</span>
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </div>
    )}
  </AnimatePresence>

      {/* Provider Selector Modal */}
      {isProviderModalOpen && (
        <ProviderSelectModal
          isOpen={isProviderModalOpen}
          onClose={() => setIsProviderModalOpen(false)}
          onSelectProvider={handleSelectProvider}
          selectedProviderId={provider.id}
        />
      )}
    </>
  );
}
