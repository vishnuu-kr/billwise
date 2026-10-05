'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { SavedHomeProfile } from '@/types';
import { predictUsage } from '@/lib/prediction/engine';
import { analytics } from '@/lib/observability/analytics';
import {
  Camera,
  X,
  Check,
  AlertCircle,
  Gauge,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import MeterScanner from '@/components/MeterScanner';
import { motion, AnimatePresence } from 'motion/react';
import { KsebOdometer } from '@/components/ui/KsebOdometer';
import { MeterTumblerInput } from '@/components/ui/MeterTumblerInput';
import { cn } from '@/lib/cn';

interface QuickMeterUpdateModalProps {
  home: SavedHomeProfile;
  onClose: () => void;
  onSuccess: (updatedHome: SavedHomeProfile) => void;
}

export default function QuickMeterUpdateModal({
  home,
  onClose,
  onSuccess,
}: QuickMeterUpdateModalProps) {
  const { lang } = useLanguage();
  const [readingInput, setReadingInput] = useState<string>(
    home.currentReading ? String(home.currentReading) : ''
  );
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasBaseline = typeof home.lastReading === 'number' && home.lastReading > 0;
  const [prevReadingInput, setPrevReadingInput] = useState<string>('');

  // Compute days elapsed since last bill or last reading
  const daysElapsedSinceLastReading = useMemo(() => {
    if (!home.lastReadingDate) return 25;
    const past = new Date(home.lastReadingDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.round((now - past) / (1000 * 60 * 60 * 24));
    return Math.min(58, Math.max(1, diffDays));
  }, [home.lastReadingDate]);

  const numReading = Number(readingInput);
  const isValidNumber = readingInput.trim() !== '' && !isNaN(numReading) && numReading > 0;

  const numPrev = prevReadingInput.trim() !== '' ? Number(prevReadingInput) : null;
  const effectivePrev = hasBaseline ? home.lastReading : (numPrev !== null && !isNaN(numPrev) ? numPrev : null);

  const isHigherThanLast = isValidNumber && effectivePrev !== null && numReading >= effectivePrev;
  const unitsSinceLast = isHigherThanLast && effectivePrev !== null ? numReading - effectivePrev : 0;

  // Instant prediction calculation
  const quickPrediction = useMemo(() => {
    if (!isHigherThanLast || effectivePrev === null || unitsSinceLast <= 0) return null;
    try {
      return predictUsage({
        previousReading: effectivePrev,
        currentReading: numReading,
        daysElapsed: daysElapsedSinceLastReading,
        totalCycleDays: home.billingCycle === 'monthly' ? 30 : 60,
        billingCycle: home.billingCycle,
        phase: home.phase,
        connectedLoadWatts: home.connectedLoadWatts || 1000,
      });
    } catch {
      return null;
    }
  }, [home, numReading, isHigherThanLast, effectivePrev, unitsSinceLast, daysElapsedSinceLastReading]);

  // Real-time Slab Cliff & Subsidy Threshold Detection
  const slabStatus = useMemo(() => {
    if (!quickPrediction) return null;
    const proj = quickPrediction.projectedUnits;
    if (home.billingCycle === 'monthly') {
      if (proj > 250) {
        return {
          type: 'danger' as const,
          title: lang === 'ml' ? 'നോൺ-ടെലിസ്കോപ്പിക് താരിഫ് മുന്നറിയിപ്പ്' : 'Non-Telescopic High Tariff Warning',
          desc: lang === 'ml'
            ? `പ്രതീക്ഷിക്കുന്നത് ~${proj} യൂണിറ്റ്. 250 യൂണിറ്റിന് മുകളിലുള്ള ഉപയോഗത്തിന് ഉയർന്ന നോൺ-ടെലിസ്കോപ്പിക് നിരക്ക് ബാധകമാകും.`
            : `Pacing ~${proj} units. Passing 250 units shifts your bill into non-telescopic high rates.`,
        };
      }
      if (proj > 120 && proj <= 125) {
        return {
          type: 'warning' as const,
          title: lang === 'ml' ? 'സ്ലാബ് പരിധി അടുക്കുന്നു' : 'Approaching Slab Cliff',
          desc: lang === 'ml'
            ? `~${proj} യൂണിറ്റ്. 125 യൂണിറ്റ് കഴിഞ്ഞാൽ അടുത്ത ഉയർന്ന സ്ലാബ് നിരക്ക് ബാധകമാകും.`
            : `~${proj} units projected. Exceeding 125 units jumps to the next higher slab.`,
        };
      }
    } else {
      // Bi-monthly (standard KSEB LT-1A)
      if (proj > 500) {
        return {
          type: 'danger' as const,
          title: lang === 'ml' ? '500u നോൺ-ടെലിസ്കോപ്പിക് മുന്നറിയിപ്പ്' : '500u Non-Telescopic Cliff Warning',
          desc: lang === 'ml'
            ? `പ്രതീക്ഷിക്കുന്നത് ~${proj} യൂണിറ്റ്. 500 യൂണിറ്റ് കഴിഞ്ഞാൽ മുഴുവൻ യൂണിറ്റുകൾക്കും ഉയർന്ന നോൺ-ടെലിസ്കോപ്പിക് നിരക്ക് വരും.`
            : `Projecting ~${proj} units. Passing 500 units drops telescopic slabs and applies higher non-telescopic rates across all units.`,
        };
      }
      if (proj > 240 && proj <= 270) {
        return {
          type: 'warning' as const,
          title: lang === 'ml' ? '240 യൂണിറ്റ് സബ്‌സിഡി പരിധി കടന്നു' : 'Crossed 240u Subsidy Cliff',
          desc: lang === 'ml'
            ? `പ്രതീക്ഷിക്കുന്നത് ~${proj} യൂണിറ്റ്. 240 യൂണിറ്റ് കഴിഞ്ഞതിനാൽ ₹5.90/u ഉയർന്ന സ്ലാബും +₹50 അധിക ഫിക്സഡ് ചാർജും വരും.`
            : `Pacing ~${proj} units. Above 240 units, energy charges jump to ₹5.90/u and fixed charge increases by +₹50.`,
        };
      }
      if (proj >= 210 && proj <= 240) {
        return {
          type: 'success' as const,
          title: lang === 'ml' ? '240 യൂണിറ്റ് പരിധിക്കുള്ളിൽ' : 'Within 240u Subsidy Threshold',
          desc: lang === 'ml'
            ? `പ്രതീക്ഷിക്കുന്നത് ~${proj} യൂണിറ്റ്. നിലവിലെ വേഗതയിൽ 240 യൂണിറ്റിന് താഴെ നിലനിർത്താൻ സാധിക്കും.`
            : `Projecting ~${proj} units. You are on track to stay within the subsidized lower tier (<= 240 units).`,
        };
      }
    }
    return null;
  }, [quickPrediction, home.billingCycle, lang]);

  const handleSave = () => {
    setErrorMsg(null);
    if (!isValidNumber) {
      setErrorMsg(lang === 'ml' ? 'ദയവായി സാധുവായ മീറ്റർ റീഡിംഗ് നൽകുക.' : 'Please enter a valid meter reading.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (hasBaseline) {
      if (numReading < home.lastReading) {
        setErrorMsg(
          lang === 'ml'
            ? `റീഡിംഗ് കഴിഞ്ഞ റീഡിംഗിനേക്കാൾ (${home.lastReading.toLocaleString()}) കുറവാകാൻ കഴിയില്ല. നിങ്ങളുടെ മീറ്ററിലെ കറുത്ത 5 അക്കങ്ങൾ പരിശോധിച്ച് നൽകുക.`
            : `Reading cannot be lower than previous reading (${home.lastReading.toLocaleString()}). Check the 5 black digits before the decimal on your meter.`
        );
        return;
      }

      const updated = storageManager.updateHomeReading(
        numReading,
        today,
        quickPrediction
          ? {
              estimatedBill: quickPrediction.estimatedBill,
              likelyRangeMin: quickPrediction.likelyRangeMin,
              likelyRangeMax: quickPrediction.likelyRangeMax,
              projectedUnits: quickPrediction.projectedUnits,
              unitsPerDay: quickPrediction.unitsPerDay,
              daysElapsed: quickPrediction.daysElapsed,
              daysRemaining: quickPrediction.daysRemaining,
              timestamp: new Date().toISOString(),
            }
          : undefined
      );

      analytics.track('reading_updated', {
        reading: numReading,
        unitsSinceLast,
        projectedUnits: quickPrediction?.projectedUnits ?? 0,
      });

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([15, 40, 20]);
        } catch {}
      }

      if (updated) onSuccess(updated);
      onClose();
    } else {
      // First-time baseline recording
      if (numPrev !== null && !isNaN(numPrev) && numPrev > 0) {
        if (numReading < numPrev) {
          setErrorMsg(
            lang === 'ml'
              ? 'ഇപ്പോഴത്തെ റീഡിംഗ് കഴിഞ്ഞതിനേക്കാൾ കുറവാകാൻ കഴിയില്ല.'
              : 'Current reading cannot be lower than previous reading.'
          );
          return;
        }

        const updatedHome: SavedHomeProfile = {
          ...home,
          lastReading: numPrev,
          lastReadingDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          currentReading: numReading,
          currentReadingDate: today,
          latestPrediction: quickPrediction
            ? {
                estimatedBill: quickPrediction.estimatedBill,
                likelyRangeMin: quickPrediction.likelyRangeMin,
                likelyRangeMax: quickPrediction.likelyRangeMax,
                projectedUnits: quickPrediction.projectedUnits,
                unitsPerDay: quickPrediction.unitsPerDay,
                daysElapsed: quickPrediction.daysElapsed,
                daysRemaining: quickPrediction.daysRemaining,
                timestamp: new Date().toISOString(),
              }
            : undefined,
          updatedAt: new Date().toISOString(),
        };

        storageManager.saveHome(updatedHome);
        analytics.track('reading_updated', {
          reading: numReading,
          unitsSinceLast,
          isFirstBaseline: true,
        });

        onSuccess(updatedHome);
        onClose();
      } else {
        // Save today as day 1 baseline
        const updatedHome: SavedHomeProfile = {
          ...home,
          lastReading: numReading,
          lastReadingDate: today,
          currentReading: undefined,
          currentReadingDate: undefined,
          latestPrediction: undefined,
          updatedAt: new Date().toISOString(),
        };

        storageManager.saveHome(updatedHome);
        analytics.track('reading_updated', {
          reading: numReading,
          isFirstBaselineOnly: true,
        });

        onSuccess(updatedHome);
        onClose();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

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
            onClose();
          }
        }}
        className="ios-sheet w-full max-h-[90vh] md:max-h-[85vh] md:max-w-[460px] md:rounded-[28px] md:shadow-2xl overflow-y-auto"
        style={{
          padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 24px)',
        }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-1 pb-3 md:hidden">
          <div className="ios-sheet-handle cursor-grab active:cursor-grabbing" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE]">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[#17171C]">
                {lang === 'ml' ? 'മീറ്റർ റീഡിംഗ് അപ്ഡേറ്റ്' : 'Update reading'}
              </h3>
              <p className="text-[11px] text-[#71717A]">
                {lang === 'ml' ? 'നിമിഷങ്ങൾക്കകം ബിൽ പരിശോധിക്കാം' : 'Update your meter in seconds'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-[#71717A] hover:text-[#17171C] active:scale-[0.96] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] rounded-full"
            aria-label="Close modal"
          >
            <span className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.1] flex items-center justify-center">
              <X className="w-4 h-4" aria-hidden="true" />
            </span>
          </button>
        </div>

        <div className="space-y-4 pt-3">
          {/* Baseline info */}
          {hasBaseline ? (
            <div className="flex items-center justify-between bg-black/[0.03] rounded-2xl p-3.5 text-[13px]">
              <div>
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'കഴിഞ്ഞ റീഡിംഗ്' : 'Last recorded reading'}
                </span>
                <span className="font-bold text-[#17171C] text-base num-tabular">
                  {home.lastReading.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'കാലയളവ്' : 'Cycle progress'}
                </span>
                <span className="font-semibold text-[#17171C] text-[13px] num-tabular">
                  ~{daysElapsedSinceLastReading}d {lang === 'ml' ? 'കഴിഞ്ഞു' : 'elapsed'}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#006FEE]/5 border border-[#006FEE]/15 p-3.5 text-[12px] space-y-1">
              <span className="font-bold text-[#006FEE] block">
                {lang === 'ml' ? 'ആദ്യ മീറ്റർ റീഡിംഗ്' : 'Set your meter baseline'}
              </span>
              <p className="text-[#71717A]">
                {lang === 'ml'
                  ? 'ഇന്നത്തെ മീറ്റർ റീഡിംഗ് നൽകി ട്രാക്കിംഗ് ആരംഭിക്കുക. അടുത്ത റീഡിംഗ് മുതൽ പ്രതിദിന ഉപയോഗം കാണാം.'
                  : 'Enter today’s reading to start your baseline. Future readings will track your daily pace.'}
              </p>
            </div>
          )}

          {/* Reading Input Field: Physical Mechanical Tumbler */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-[#17171C]">
                {lang === 'ml' ? 'ഇപ്പോഴത്തെ മീറ്റർ റീഡിംഗ്' : "Today's meter reading"}
              </label>
              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#006FEE] hover:underline cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{lang === 'ml' ? 'ക്യാമറ' : 'Scan display'}</span>
              </button>
            </div>

            <MeterTumblerInput
              value={readingInput}
              onChange={(val) => {
                setReadingInput(val);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={hasBaseline ? String(home.lastReading + 120) : '10450'}
              baselineReading={hasBaseline ? home.lastReading : null}
              autoFocus={true}
            />
          </div>

          {/* Optional previous reading if no baseline */}
          {!hasBaseline && (
            <div className="space-y-1.5 pt-1">
              <label htmlFor="optional-prev-reading" className="text-[12px] font-medium text-[#71717A] block">
                {lang === 'ml' ? 'കഴിഞ്ഞ ബില്ലിലെ റീഡിംഗ് (ഓപ്ഷണൽ)' : 'Previous bill reading (optional)'}
              </label>
              <input
                id="optional-prev-reading"
                type="number"
                inputMode="numeric"
                value={prevReadingInput}
                onChange={(e) => setPrevReadingInput(e.target.value)}
                placeholder="10210"
                className="w-full h-11 rounded-xl bg-[#F7F7F5] px-3.5 font-semibold text-lg num-tabular text-[#17171C] border border-black/[0.08] outline-none focus:border-[#006FEE] focus:bg-white"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-[#F31260]/10 border border-[#F31260]/25 text-[#900B37] text-[12px] flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Real-time Dynamic Projection Preview with Spring Physics */}
          <AnimatePresence>
            {quickPrediction && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="rounded-2xl bg-gradient-to-br from-[#006FEE]/10 via-[#006FEE]/5 to-white border border-[#006FEE]/20 p-4 space-y-3.5 shadow-sm"
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                      {lang === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന അടുത്ത ബിൽ' : 'Estimated next bill'}
                    </span>
                    <div className="pt-0.5 flex items-baseline gap-2">
                      <KsebOdometer value={quickPrediction.estimatedBill} size="xl" prefix="₹" />
                      {isHigherThanLast && unitsSinceLast > 0 && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[11px] font-bold text-[#0E7036] bg-[#17C964]/15 px-2 py-0.5 rounded-full num-tabular"
                        >
                          +{unitsSinceLast}u
                        </motion.span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#71717A] block font-medium">
                      {lang === 'ml' ? 'പ്രതിദിന വേഗത' : 'Daily pace'}
                    </span>
                    <motion.div
                      key={quickPrediction.unitsPerDay}
                      initial={{ scale: 0.82, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                      className="text-[16px] font-extrabold text-[#17171C] num-tabular"
                    >
                      {quickPrediction.unitsPerDay}{' '}
                      <span className="text-[11px] font-medium text-[#71717A]">u/day</span>
                    </motion.div>
                  </div>
                </div>

                {/* Subsidized Slab Cliff Detection & Warning */}
                {slabStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'p-2.5 rounded-xl border text-[11px] space-y-0.5',
                      slabStatus.type === 'danger'
                        ? 'bg-[#F31260]/10 border-[#F31260]/25 text-[#900B37]'
                        : slabStatus.type === 'warning'
                        ? 'bg-[#F5A524]/12 border-[#F5A524]/30 text-[#935303]'
                        : 'bg-[#17C964]/10 border-[#17C964]/25 text-[#0E7036]'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {slabStatus.type === 'danger' ? (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      ) : slabStatus.type === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{slabStatus.title}</span>
                    </div>
                    <p className="opacity-95 leading-relaxed pl-5 font-medium">{slabStatus.desc}</p>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#006FEE]/10 text-[12px]">
                  <div>
                    <span className="text-[#71717A] block font-medium">
                      {lang === 'ml' ? 'കഴിഞ്ഞ ചെക്ക് മുതൽ' : 'Units since last check'}
                    </span>
                    <span className="font-semibold text-[#17171C] num-tabular">
                      {unitsSinceLast} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block font-medium">
                      {lang === 'ml' ? 'ആകെ പ്രതീക്ഷിക്കുന്നത്' : 'Projected cycle'}
                    </span>
                    <span className="font-semibold text-[#17171C] num-tabular">
                      ~{quickPrediction.projectedUnits} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Action Button */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={hasBaseline ? !isHigherThanLast : !isValidNumber}
              className="ios-btn-primary w-full py-3.5 px-4 text-[14px] font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97]"
            >
              <Check className="w-4 h-4" />
              <span>
                {hasBaseline
                  ? lang === 'ml'
                    ? 'സേവ് ചെയ്ത് ബിൽ കാണുക'
                    : 'Save reading & see estimate'
                  : quickPrediction
                  ? lang === 'ml'
                    ? 'കണക്കുകൂട്ടി സേവ് ചെയ്യുക'
                    : 'Calculate & save reading'
                  : lang === 'ml'
                  ? 'തുടക്ക റീഡിംഗ് സേവ് ചെയ്യുക'
                  : 'Save starting baseline'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Camera scanner modal */}
      {showCameraScanner && (
        <MeterScanner
          isModal={true}
          onReadingConfirmed={(val) => {
            setReadingInput(String(val));
            setShowCameraScanner(false);
          }}
          onEnterManually={() => setShowCameraScanner(false)}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
}
