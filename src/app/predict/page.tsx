'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { predictUsage } from '@/lib/prediction/engine';
import { storageManager } from '@/lib/storage';
import { PredictionResult, SavedHomeProfile, BillingCycle } from '@/types';
import MeterVisualGuide from '@/components/MeterVisualGuide';
import ResultCard from '@/components/ResultCard';
import CardSkeleton from '@/components/CardSkeleton';
import MeterScanner from '@/components/MeterScanner';
import { Camera, ChevronLeft, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DateRangePicker, type Range, daysBetween, short } from '@/components/ui/DateRangePicker';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_DAYS = 30;

function PredictContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const [prevReading, setPrevReading] = useState<number | null>(null);
  const [currentReading, setCurrentReading] = useState<string>('');
  const [daysElapsed, setDaysElapsed] = useState<number>(DEFAULT_DAYS);
  
  const providerParam = searchParams.get('provider') || searchParams.get('providerId') || 'kseb';
  const isMonthlyProvider = providerParam === 'bescom' || providerParam === 'msedcl';
  const totalCycleDays = isMonthlyProvider ? 30 : 60;
  const billingCycle: BillingCycle = isMonthlyProvider ? 'monthly' : 'bi-monthly';

  const [phase, setPhase] = useState<'single' | 'three'>('single');
  const [previousBillAmount, setPreviousBillAmount] = useState<number | undefined>(undefined);
  
  const [showMeterScannerModal, setShowMeterScannerModal] = useState<boolean>(false);
  const [selectedDateRange, setSelectedDateRange] = useState<Range | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const isMeterReplaced = false;

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLowerError, setIsLowerError] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApplyDateRange = (range: Range) => {
    setSelectedDateRange(range);
    const diff = Math.min(totalCycleDays, Math.max(1, daysBetween(range.start, range.end) + 1));
    setDaysElapsed(diff);
    runCalculation(prevReading, currentReading, diff, isMeterReplaced, phase);
    setShowCalendarModal(false);
  };

  const runCalculation = useCallback((
    prev: number | null,
    currStr: string,
    days: number,
    replaced: boolean,
    selectedPhase: 'single' | 'three'
  ) => {
    setValidationError(null);
    setIsLowerError(false);

    const sanitizedCurr = currStr.replace(/[₹\s,]/g, '');
    const curr = Number(sanitizedCurr);
    const hasCurrent = sanitizedCurr.trim() !== '' && !isNaN(curr);

    if (prev === null) {
      // Only nag about the previous reading once the user has started typing a current one
      if (hasCurrent) {
        setValidationError(
          lang === 'ml'
            ? 'കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ് ആദ്യം നൽകുക.'
            : 'Enter the reading from your last bill first.'
        );
      }
      setPrediction(null);
      return;
    }

    if (!hasCurrent) {
      setPrediction(null);
      return;
    }

    if (!replaced && curr < prev) {
      setIsLowerError(true);
      setPrediction(null);
      return;
    }

    try {
      const res = predictUsage({
        previousReading: prev,
        currentReading: curr,
        daysElapsed: days,
        totalCycleDays,
        billingCycle,
        phase: selectedPhase,
        providerId: providerParam,
      });

      setPrediction(res);
    } catch (e: unknown) {
      setValidationError((e as Error).message || 'Error occurred calculating prediction.');
      setPrediction(null);
    }
  }, [totalCycleDays, billingCycle, providerParam, lang]);

  const [isBaselineSaved, setIsBaselineSaved] = useState<boolean>(false);

  const handleSaveBaseline = () => {
    const curr = Number(currentReading);
    if (!curr || isNaN(curr)) return;
    const today = new Date().toISOString().slice(0, 10);
    const home = storageManager.getSavedHome();
    const newHome: SavedHomeProfile = {
      id: home?.id || 'home_primary',
      name: home?.name || 'Home',
      providerId: home?.providerId || 'kseb',
      providerName: home?.providerName || 'Kerala State Electricity Board',
      providerShortName: home?.providerShortName || 'KSEB',
      state: home?.state || 'Kerala',
      billingCycle: home?.billingCycle || 'bi-monthly',
      tariff: home?.tariff || 'LT-1A',
      phase,
      connectedLoadWatts: home?.connectedLoadWatts || 2000,
      lastReading: curr,
      lastReadingDate: today,
      currentReading: undefined,
      currentReadingDate: undefined,
      latestPrediction: undefined,
      createdAt: home?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storageManager.saveHome(newHome);
    setIsBaselineSaved(true);
  };

  // Hydrate from URL / saved reading exactly once per distinct query string.
  // (Previously this re-ran on every slider/phase change and clobbered user input.)
  const initKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = searchParams.toString();
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;

    const pReading = searchParams.get('prevReading');
    const cReading = searchParams.get('reading');
    const uParam = searchParams.get('units');
    const prevBillParam = searchParams.get('prevBill');

    let initialPrev: number | null = null;
    if (pReading && !isNaN(Number(pReading))) {
      initialPrev = Number(pReading);
      setPrevReading(initialPrev);
    } else {
      const lastSaved = storageManager.getLastReading();
      if (lastSaved && lastSaved.reading > 0) {
        initialPrev = lastSaved.reading;
        setPrevReading(initialPrev);
      } else {
        const home = storageManager.getSavedHome();
        if (home && home.lastReading > 0) {
          initialPrev = home.lastReading;
          setPrevReading(initialPrev);
        } else if (home && home.currentReading && home.currentReading > 0) {
          initialPrev = home.currentReading;
          setPrevReading(initialPrev);
        }
      }
    }

    if (cReading) {
      setCurrentReading(cReading);
    }

    if (prevBillParam && !isNaN(Number(prevBillParam))) {
      setPreviousBillAmount(Number(prevBillParam));
    }

    const phaseParam = searchParams.get('phase');
    if (phaseParam === 'single' || phaseParam === 'three') {
      setPhase(phaseParam);
    }

    // Direct unit calculation support
    if (uParam) {
      const uVal = Number(uParam);
      if (!isNaN(uVal) && uVal > 0) {
        const dummyPrev = 10000;
        const dummyCurr = dummyPrev + uVal;
        setPrevReading(dummyPrev);
        setCurrentReading(String(dummyCurr));
        setDaysElapsed(60);
        runCalculation(dummyPrev, String(dummyCurr), 60, false, 'single');
        return;
      }
    }

    if (initialPrev !== null && cReading) {
      runCalculation(initialPrev, cReading, DEFAULT_DAYS, false, 'single');
    }
  }, [searchParams, runCalculation]);

  const handlePrevChange = (val: number | null) => {
    setPrevReading(val);
    runCalculation(val, currentReading, daysElapsed, isMeterReplaced, phase);
  };

  const handleCurrentChange = (valStr: string) => {
    setCurrentReading(valStr);
    runCalculation(prevReading, valStr, daysElapsed, isMeterReplaced, phase);
  };

  const handleDaysChange = (days: number) => {
    setDaysElapsed(days);
    setSelectedDateRange(null);
    runCalculation(prevReading, currentReading, days, isMeterReplaced, phase);
  };

  const handlePhaseChange = (newPhase: 'single' | 'three') => {
    setPhase(newPhase);
    runCalculation(prevReading, currentReading, daysElapsed, isMeterReplaced, newPhase);
  };

  const handleApplySampleData = () => {
    setPrevReading(10055);
    setCurrentReading('10295');
    setPreviousBillAmount(1148);
    setDaysElapsed(DEFAULT_DAYS);
    setSelectedDateRange(null);
    runCalculation(10055, '10295', DEFAULT_DAYS, false, phase);
  };

  const currNum = Number(currentReading) || 0;
  const consumedSoFar = prevReading !== null && currNum >= prevReading ? currNum - prevReading : 0;

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-5">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#71717A] block">
          {searchParams.get('prevReading')
            ? (lang === 'ml' ? 'ഘട്ടം 2 · മീറ്റർ' : 'Step 2 · Meter reading')
            : (lang === 'ml' ? 'മീറ്റർ പരിശോധന' : 'Meter check & pace')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#17171C] mt-1">
          {t.checkMeterTitle}
        </h1>
        <p className="text-[14px] text-[#71717A] mt-1 leading-relaxed">
          {t.checkMeterSubtitle}
        </p>
      </div>

      {/* Visual Guide */}
      <MeterVisualGuide currentReadingVal={currentReading} />

      {/* Readings Grouped Surface */}
      <div className="glass-card p-5 space-y-4">
        {/* Phase Segmented Selector */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-[#71717A] block">
            {lang === 'ml' ? 'കണക്ഷൻ തരം' : 'Supply Phase'}
          </label>
          <SegmentedControl
            options={[
              { value: 'single' as const, label: lang === 'ml' ? '1-ഫേസ് (Single)' : '1-Phase (Single)' },
              { value: 'three' as const, label: lang === 'ml' ? '3-ഫേസ് (Three)' : '3-Phase (Three)' },
            ]}
            value={phase}
            onChange={(v) => handlePhaseChange(v as 'single' | 'three')}
          />
        </div>

        {/* Previous Reading */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[12px]">
            <label htmlFor="prev-reading-input" className="font-medium text-[#71717A]">
              {lang === 'ml' ? 'കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ്' : 'Last bill reading'}
            </label>
            <Link
              href="/scan"
              className="text-[#006FEE] font-medium hover:underline text-[12px]"
            >
              {lang === 'ml' ? 'ബിൽ സ്കാൻ ചെയ്യൂ' : 'Scan bill'}
            </Link>
          </div>
          <input
            id="prev-reading-input"
            type="text"
            inputMode="numeric"
            value={prevReading !== null ? prevReading : ''}
            onChange={e => handlePrevChange(e.target.value ? Number(e.target.value.replace(/[₹\s,]/g, '')) : null)}
            placeholder="10055"
            className="w-full h-12 rounded-xl bg-[#F7F7F5] px-3.5 font-semibold text-xl num-tabular text-[#17171C] border border-black/[0.08] outline-none focus:border-[#006FEE] focus:bg-white transition-all"
          />
        </div>

        {/* Current Reading */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[12px]">
            <label htmlFor="curr-reading-input" className="font-semibold text-[#006FEE]">
              {lang === 'ml' ? 'ഇപ്പോഴത്തെ മീറ്റർ റീഡിംഗ്' : 'Current meter reading'}
            </label>
            <button
              type="button"
              onClick={() => setShowMeterScannerModal(true)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#006FEE] hover:underline cursor-pointer"
            >
              <Camera style={{ width: '13px', height: '13px' }} />
              <span>{lang === 'ml' ? 'ക്യാമറ' : 'Scan camera'}</span>
            </button>
          </div>
          <input
            id="curr-reading-input"
            type="text"
            inputMode="numeric"
            value={currentReading}
            onChange={e => handleCurrentChange(e.target.value)}
            placeholder="10295"
            className="w-full h-12 rounded-xl bg-[#F7F7F5] px-3.5 font-semibold text-xl num-tabular text-[#17171C] border border-[#006FEE]/40 outline-none focus:border-[#006FEE] focus:bg-white transition-all"
          />
        </div>

        {/* Live consumption summary */}
        {prevReading !== null && currentReading && !isLowerError && (
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
            <span className="text-[13px] text-[#71717A]">
              {lang === 'ml' ? 'ഇതുവരെ ഉപയോഗിച്ചത്:' : 'Consumed so far:'}
            </span>
            <span className="num-tabular text-[17px] font-semibold text-[#17171C]">
              {consumedSoFar} <span className="text-[13px] font-normal text-[#A1A1AA]">{t.units}</span>
            </span>
          </div>
        )}

        {/* Days elapsed slider & Calendar picker */}
        <div className="pt-3 border-t border-black/[0.06] space-y-2.5">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#71717A] font-medium">
              {lang === 'ml' ? 'ഈ സൈക്കിളിലെ ദിവസങ്ങൾ' : 'Days into this cycle'}
            </span>
            <div className="flex items-center gap-2">
              <span className="num-tabular font-semibold text-[#17171C]">
                {daysElapsed} / {totalCycleDays} {lang === 'ml' ? 'ദിവസം' : 'days'}
              </span>
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#006FEE]/10 text-[#006FEE] hover:bg-[#006FEE]/15 transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                <span>{selectedDateRange ? (lang === 'ml' ? 'മാറ്റുക' : 'Edit') : (lang === 'ml' ? 'കലണ്ടർ' : 'Pick Dates')}</span>
              </button>
            </div>
          </div>

          {/* Active Date Range Tag if selected */}
          {selectedDateRange && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px]">
              <span className="text-emerald-700 font-medium">
                🗓️ {short(selectedDateRange.start, false)} → {short(selectedDateRange.end, false)} ({daysElapsed}d)
              </span>
              <button
                type="button"
                onClick={() => setSelectedDateRange(null)}
                className="text-emerald-700/70 hover:text-emerald-800 text-[11px] font-medium cursor-pointer"
              >
                {lang === 'ml' ? 'റദ്ദാക്കുക' : 'Reset'}
              </button>
            </div>
          )}

          <input
            type="range"
            min={5}
            max={totalCycleDays}
            value={daysElapsed}
            onChange={e => handleDaysChange(Number(e.target.value))}
            className="w-full"
            aria-label="Days elapsed"
          />
        </div>

        {/* Baseline Saved Confirmation */}
        {isBaselineSaved && (
          <div className="p-4 rounded-2xl bg-[#17C964]/10 border border-[#17C964]/20 text-[#0E7036] space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#17C964]" />
              <span className="text-[13px] font-bold">
                {lang === 'ml' ? 'തുടക്ക മീറ്റർ റീഡിംഗ് സേവ് ചെയ്തു' : 'Baseline reading saved'}
              </span>
            </div>
            <p className="text-[12px] text-[#0E7036]/90 leading-relaxed">
              {lang === 'ml'
                ? `ഇന്നത്തെ റീഡിംഗ് (${currentReading}) സേവ് ചെയ്തു. ഏതാനും ദിവസങ്ങൾക്ക് ശേഷം വീണ്ടും പരിശോധിച്ചാൽ നിങ്ങളുടെ കൃത്യമായ പ്രതിദിന വേഗതയും ബില്ലും കാണാം.`
                : `Today’s reading (${currentReading}) is saved to your device. Check your meter again in a few days to view your daily consumption pace.`}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006FEE] hover:underline pt-1"
            >
              <span>{lang === 'ml' ? 'ഹോം ഡാഷ്‌ബോർഡിലേക്ക് പോകാം →' : 'Go to dashboard →'}</span>
            </Link>
          </div>
        )}

        {/* Options when prevReading is missing */}
        {prevReading === null && currentReading && !isBaselineSaved && (
          <div className="p-4 rounded-2xl bg-[#006FEE]/5 border border-[#006FEE]/15 space-y-3 animate-fade-in">
            <div>
              <span className="text-[13px] font-bold text-[#17171C] block">
                {lang === 'ml' ? 'കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ് കയ്യിലില്ലേ?' : "Don't have your last bill reading?"}
              </span>
              <p className="text-[12px] text-[#71717A] mt-0.5 leading-relaxed">
                {lang === 'ml'
                  ? 'പ്രതിദിന വേഗത കാണാൻ കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ് വേണം. അല്ലെങ്കിൽ ഇന്നത്തെ റീഡിംഗ് തുടക്കമായി സേവ് ചെയ്യാം.'
                  : 'Comparing with a previous reading enables live daily pace tracking.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveBaseline}
                className="ios-btn-secondary py-2.5 px-3 text-[12px] font-semibold text-[#17171C] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{lang === 'ml' ? 'ഇന്നത്തെ റീഡിംഗ് തുടക്കമായി സേവ് ചെയ്യുക' : 'Save today as baseline'}</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href="/scan"
                  className="ios-btn-primary flex-1 py-2.5 px-3 text-[12px] font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{lang === 'ml' ? 'ബിൽ സ്കാൻ ചെയ്യാം' : 'Scan last bill'}</span>
                </Link>

                <Link
                  href="/manual"
                  className="ios-btn-secondary py-2.5 px-3 text-[12px] font-medium text-[#71717A] rounded-xl text-center"
                >
                  <span>{lang === 'ml' ? 'യൂണിറ്റ്' : 'Direct units'}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* No bill handy fallback */}
        {prevReading === null && !currentReading && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleApplySampleData}
              className="text-[12px] text-[#006FEE] font-medium hover:underline cursor-pointer"
            >
              {lang === 'ml' ? 'ബില്ലില്ലേ? 240 യൂണിറ്റ് മാതൃക പരീക്ഷിക്കൂ' : 'No bill handy? Load sample data'}
            </button>
          </div>
        )}

        {/* Lower Reading Error Warning */}
        {isLowerError && (
          <div className="border-l-2 border-[#F31260] pl-3 py-1 text-[13px] text-[#F31260] space-y-1">
            <p className="font-semibold">
              {lang === 'ml' ? 'റീഡിംഗ് കുറഞ്ഞത് ആകാൻ പറ്റില്ല' : 'Reading cannot be lower than previous'}
            </p>
            <p className="text-[12px] text-[#71717A]">
              {lang === 'ml'
                ? 'ഇപ്പോഴത്തെ റീഡിംഗ് പഴയതിനേക്കാൾ കൂടുതലായിരിക്കണം.'
                : 'Current meter reading must be higher than previous reading.'}
            </p>
          </div>
        )}

        {/* Validation Error (only show if not already covered by the missing prev helper) */}
        {validationError && !(prevReading === null && currentReading) && (
          <div className="border-l-2 border-[#F31260] pl-3 py-1 text-[13px] text-[#F31260]">
            <p className="font-semibold">{validationError}</p>
          </div>
        )}
      </div>

      {/* Prediction Result Display */}
      {prediction && (
        <div className="pt-2">
          <ResultCard
            prediction={prediction}
            previousBillAmount={previousBillAmount}
            hideBackLink={true}
          />
        </div>
      )}

      {/* Date Range Picker Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs -z-10"
              onClick={() => setShowCalendarModal(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 360 }}
              className="relative w-full max-w-[580px] bg-white rounded-[28px] shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#17171C]">
                    {lang === 'ml' ? 'ബിൽ കാലയളവ് തിരഞ്ഞെടുക്കുക' : 'Select Billing Period'}
                  </h3>
                  <p className="text-[12px] text-[#71717A]">
                    {lang === 'ml'
                      ? 'മുൻ ബിൽ തീയതിയും ഇപ്പോഴത്തെ റീഡിംഗ് തീയതിയും'
                      : 'Choose your previous bill date and meter check date'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.1] text-[#71717A] flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                  aria-label="Close date picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center">
                <DateRangePicker
                  value={selectedDateRange}
                  onApply={handleApplyDateRange}
                  className="w-full shadow-none border-none p-0"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meter Scanner Modal */}
      {showMeterScannerModal && (
        <MeterScanner
          isModal={true}
          onReadingConfirmed={(val) => {
            setCurrentReading(String(val));
            if (prevReading !== null) runCalculation(prevReading, String(val), daysElapsed, isMeterReplaced, phase);
            setShowMeterScannerModal(false);
          }}
          onEnterManually={() => setShowMeterScannerModal(false)}
          onClose={() => setShowMeterScannerModal(false)}
        />
      )}
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[430px] mx-auto px-4 pt-6">
          <CardSkeleton title="Loading prediction tool..." />
        </div>
      }
    >
      <PredictContent />
    </Suspense>
  );
}
