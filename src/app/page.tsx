'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { storageManager } from '@/lib/storage';
import { SavedHomeProfile, HistoryRecord, CycleComparisonDetail } from '@/types';
import { analytics } from '@/lib/observability/analytics';
import {
  Camera,
  Gauge,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Receipt,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import ProductPreviewCard from '@/components/ProductPreviewCard';
import ManglishQueryBar from '@/components/ManglishQueryBar';
import CycleComparisonCard from '@/components/CycleComparisonCard';
import CycleTimeline from '@/components/CycleTimeline';
import { KsebOdometer } from '@/components/ui/KsebOdometer';
import {
  evaluatePersonalBaseline,
  evaluateBillHealth,
  getPredictionConfidence,
  getPredictionLearning,
} from '@/lib/retention/intelligence';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';

const QuickMeterUpdateModal = dynamic(() => import('@/components/QuickMeterUpdateModal'), { ssr: false });
const ActualBillModal = dynamic(() => import('@/components/ActualBillModal'), { ssr: false });
const OnboardingWizardModal = dynamic(() => import('@/components/OnboardingWizardModal'), { ssr: false });

export default function HomePage() {
  const { lang } = useLanguage();
  const [savedHome, setSavedHome] = useState<SavedHomeProfile | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Modals
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [showActualBillModal, setShowActualBillModal] = useState(false);
  const [showExamplePreview, setShowExamplePreview] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadData = () => {
    const home = storageManager.getSavedHome();
    const hist = storageManager.getHistory();
    setSavedHome(home);
    setHistory(hist);
  };

  useEffect(() => {
    const home = storageManager.getSavedHome();
    const hist = storageManager.getHistory();
    setSavedHome(home);
    setHistory(hist);

    const isFirstTime = !home && hist.length === 0 && !storageManager.isOnboardingCompleted();
    if (isFirstTime) {
      setShowOnboarding(true);
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'returning' || mode === 'quick-update' || mode === 'actual-bill') {
        const sampleHome: SavedHomeProfile = {
          id: 'home_preview',
          tariff: 'LT-1A',
          phase: 'single',
          billingCycle: 'bi-monthly',
          connectedLoadWatts: 3000,
          lastReading: 10055,
          lastReadingDate: new Date(Date.now() - 25 * 86400000).toISOString(),
          lastBillAmount: 1148,
          lastBillUnits: 240,
          currentReading: 10295,
          currentReadingDate: new Date().toISOString(),
          latestPrediction: {
            estimatedBill: 1220,
            likelyRangeMin: 1160,
            likelyRangeMax: 1280,
            projectedUnits: 254,
            unitsPerDay: 3.8,
            daysElapsed: 25,
            daysRemaining: 35,
            timestamp: new Date().toISOString(),
          },
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSavedHome(sampleHome);
        if (mode === 'quick-update') setShowQuickUpdate(true);
        if (mode === 'actual-bill') setShowActualBillModal(true);
      }
      if (mode === 'setup') {
        setShowOnboarding(true);
      }
    }
    setIsClientLoaded(true);
    analytics.track('page_visit', { route: '/' });
  }, []);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (lang === 'ml') {
      if (hour < 12) return 'സുപ്രഭാതം';
      if (hour < 17) return 'ശുഭദിനം';
      return 'ശുഭസായാഹ്നം';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [lang]);

  // Days since last meter check
  const daysSinceCheck = useMemo(() => {
    if (!savedHome?.lastReadingDate) return null;
    const diff = Math.round(
      (new Date().getTime() - new Date(savedHome.lastReadingDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
  }, [savedHome]);

  // Cycle progress calculation
  const totalCycleDays = savedHome?.billingCycle === 'monthly' ? 30 : 60;
  const cycleDaysElapsed = savedHome?.latestPrediction?.daysElapsed || (daysSinceCheck ? Math.min(totalCycleDays, daysSinceCheck) : 25);

  // Cycle comparison if 2+ records exist in history
  const recentComparison: CycleComparisonDetail | null = useMemo(() => {
    if (history.length >= 2) {
      return storageManager.compareTwoCycles(history[1], history[0]);
    }
    return null;
  }, [history]);

  // Estimated bill and range
  const estimatedBill = savedHome?.latestPrediction?.estimatedBill;
  const rangeMin = savedHome?.latestPrediction?.likelyRangeMin;
  const rangeMax = savedHome?.latestPrediction?.likelyRangeMax;
  const unitsPerDay = savedHome?.latestPrediction?.unitsPerDay;
  const projectedUnits = savedHome?.latestPrediction?.projectedUnits;

  // Usage so far in active cycle
  const unitsSoFar = useMemo(() => {
    if (savedHome?.currentReading && savedHome.lastReading && savedHome.currentReading >= savedHome.lastReading) {
      return savedHome.currentReading - savedHome.lastReading;
    }
    return projectedUnits || savedHome?.lastBillUnits || 0;
  }, [savedHome, projectedUnits]);

  // Baseline Evaluation (NO_BASELINE, LIMITED_BASELINE, ESTABLISHED_BASELINE)
  const baseline = useMemo(() => {
    return evaluatePersonalBaseline(history, savedHome?.billingCycle);
  }, [history, savedHome?.billingCycle]);

  // Bill Health Evaluation (HEALTHY, NEEDS_ATTENTION, UNUSUAL, INSUFFICIENT_HISTORY)
  const billHealth = useMemo(() => {
    if (!savedHome) return null;
    return evaluateBillHealth(
      {
        units: savedHome.lastBillUnits || 240,
        presentReading: savedHome.currentReading || savedHome.lastReading,
        previousReading: savedHome.lastReading,
        totalAmount: savedHome.lastBillAmount,
      },
      history
    );
  }, [savedHome, history]);

  // Prediction Learning (calibrated when >= 3 evaluations)
  const predictionLearning = useMemo(() => {
    return getPredictionLearning(history);
  }, [history]);

  // Prediction Confidence (human language: Early cycle / Good estimate / High confidence)
  const confidenceInfo = useMemo(() => {
    return getPredictionConfidence(cycleDaysElapsed, totalCycleDays);
  }, [cycleDaysElapsed, totalCycleDays]);

  // Pace deviation vs historical average
  const paceDeviation = useMemo(() => {
    if (baseline.averageUnits > 0 && projectedUnits) {
      return Math.round(((projectedUnits - baseline.averageUnits) / baseline.averageUnits) * 100);
    }
    return 0;
  }, [baseline, projectedUnits]);

  const paceDeviationText = useMemo(() => {
    if (baseline.status === 'NO_BASELINE' || baseline.status === 'LIMITED_BASELINE') {
      return lang === 'ml' ? 'ആദ്യ സൈക്കിൾ ട്രാക്കിംഗ്' : 'Initial cycle tracking';
    }
    if (Math.abs(paceDeviation) <= 5) {
      return lang === 'ml' ? 'സാധാരണ നിലയിൽ' : 'Within usual range';
    }
    const arrow = paceDeviation > 0 ? '↑' : '↓';
    return `${arrow} ${Math.abs(paceDeviation)}% ${lang === 'ml' ? 'സാധാരണയേക്കാൾ' : 'vs usual'}`;
  }, [baseline.status, paceDeviation, lang]);

  // Real-time Home Slab Status
  const homeSlabStatus = useMemo(() => {
    if (!projectedUnits) return null;
    if (savedHome?.billingCycle === 'monthly') {
      if (projectedUnits > 250) {
        return {
          type: 'danger' as const,
          label: lang === 'ml' ? 'നോൺ-ടെലിസ്കോപ്പിക്' : '>250u High Tier',
        };
      }
      if (projectedUnits > 125) {
        return {
          type: 'warning' as const,
          label: lang === 'ml' ? 'ഉയർന്ന സ്ലാബ്' : '>125u Next Slab',
        };
      }
    } else {
      if (projectedUnits > 500) {
        return {
          type: 'danger' as const,
          label: lang === 'ml' ? 'നോൺ-ടെലിസ്കോപ്പിക്' : '>500u Non-Telescopic',
        };
      }
      if (projectedUnits > 240) {
        return {
          type: 'warning' as const,
          label: lang === 'ml' ? '240u സബ്‌സിഡി കടന്നു' : '>240u Subsidy Cliff',
        };
      }
      if (projectedUnits >= 200 && projectedUnits <= 240) {
        return {
          type: 'success' as const,
          label: lang === 'ml' ? '240u പരിധിക്കുള്ളിൽ' : '<=240u Subsidized',
        };
      }
    }
    return null;
  }, [projectedUnits, savedHome?.billingCycle, lang]);

  // Determine canonical homepage lifecycle state (Section 2 & Section 48)
  const homeState: 'STATE_A_NEW' | 'STATE_B_FIRST_BILL' | 'STATE_C_ACTIVE_CYCLE' | 'STATE_D_ACTUAL_RECORDED' = useMemo(() => {
    if (!isClientLoaded) return 'STATE_A_NEW';
    if (!savedHome && history.length === 0) return 'STATE_A_NEW';
    if (savedHome?.lastReconciledComparison) return 'STATE_D_ACTUAL_RECORDED';
    if (
      savedHome?.latestPrediction ||
      (savedHome?.currentReading && savedHome.currentReading > (savedHome.lastReading || 0))
    ) {
      return 'STATE_C_ACTIVE_CYCLE';
    }
    return 'STATE_B_FIRST_BILL';
  }, [isClientLoaded, savedHome, history]);

  return (
    <div className="relative max-w-[430px] mx-auto px-4 pt-3 pb-6 space-y-5">
      {/* =========================================================
          STATE A: NEW USER (App Instrument Dashboard First)
         ========================================================= */}
      {homeState === 'STATE_A_NEW' && (
        <div className="space-y-4 pt-1 animate-fade-in">
          {/* Native App Top Status Bar */}
          <div className="flex items-center justify-between px-0.5">
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider block">
                {lang === 'ml' ? 'ഗാർഹിക വൈദ്യുതി' : 'Domestic LT-1A'}
              </span>
              <h1 className="text-[20px] font-bold text-[#17171C] tracking-tight">
                {lang === 'ml' ? 'വൈദ്യുതി മീറ്റർ' : 'Electricity Dashboard'}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#006FEE] bg-[#006FEE]/10 border border-[#006FEE]/20 px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#006FEE]/15 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'ml' ? 'സജ്ജീകരിക്കാം' : 'Setup Home'}</span>
            </button>
          </div>

          {/* Live Instrument Card — Always Alive & Interactive */}
          <div className="rounded-[26px] bg-white/95 backdrop-blur-md border border-black/[0.06] p-4 sm:p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02] space-y-4">
            <ProductPreviewCard interactive={true} />
          </div>

          {/* Native Action Buttons: Scan (Primary) & Enter Units (Secondary) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link
              href="/scan"
              onClick={() => {
                haptics.impact();
                analytics.track('flow_started', { flow: 'bill_ocr' });
              }}
              className="ios-btn-primary w-full h-13 px-3 flex items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold shadow-sm active:scale-[0.97]"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>{lang === 'ml' ? 'ബിൽ സ്കാൻ' : 'Scan bill'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
            </Link>

            <Link
              href="/manual"
              onClick={() => {
                haptics.impact();
                analytics.track('flow_started', { flow: 'direct_units' });
              }}
              className="ios-btn-secondary w-full h-13 px-3 flex items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold text-[#17171C] active:scale-[0.97]"
            >
              <Gauge className="w-4 h-4 shrink-0 text-[#71717A]" />
              <span>{lang === 'ml' ? 'യൂണിറ്റ് നൽകുക' : 'Enter units'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-[#71717A] opacity-70" />
            </Link>
          </div>

          {/* Privacy Guarantee Reassurance */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#71717A] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#17C964]" />
            <span>
              {lang === 'ml'
                ? 'ലോഗിൻ ആവശ്യമില്ല · നിങ്ങളുടെ വിവരങ്ങൾ ഈ ഫോണിൽ മാത്രം'
                : 'No login required · your bill stays on this device'}
            </span>
          </div>

          {/* Natural Language Assistant Bar */}
          <div className="pt-1">
            <ManglishQueryBar />
          </div>
        </div>
      )}

      {/* =========================================================
          STATE B: AFTER FIRST BILL (Saved Home Baseline Established)
         ========================================================= */}
      {homeState === 'STATE_B_FIRST_BILL' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider block">
                {greeting}
              </span>
              <h1 className="text-[20px] font-bold text-[#17171C] tracking-tight">
                {lang === 'ml' ? 'നിങ്ങളുടെ വീട്' : 'Your home'}
              </h1>
            </div>
            <span className="text-[11px] font-semibold text-[#006FEE] bg-[#006FEE]/10 border border-[#006FEE]/15 px-2.5 py-1 rounded-full">
              {savedHome?.providerShortName || 'KSEB'} · {savedHome?.tariff || 'LT-1A'}
            </span>
          </div>

          {/* Dominant Last Bill Card */}
          <div className="rounded-[26px] bg-white/95 backdrop-blur-md border border-black/[0.06] p-5 sm:p-6 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#006FEE]/[0.05] rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-1 relative">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                {lang === 'ml' ? 'കഴിഞ്ഞ ബിൽ' : 'Last bill'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[34px] font-bold text-[#17171C] num-tabular">
                  ₹{(savedHome?.lastBillAmount || 1148).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 text-[13px]">
                <span className="font-semibold text-[#17171C] num-tabular">
                  {savedHome?.lastBillUnits || 240} kWh
                </span>
                <span className="text-[#71717A]">·</span>
                <span
                  className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                    billHealth?.status === 'HEALTHY'
                      ? 'bg-[#17C964]/10 text-[#0E7036] border-[#17C964]/20'
                      : billHealth?.status === 'NEEDS_ATTENTION'
                      ? 'bg-[#F5A524]/12 text-[#935303] border-[#F5A524]/30'
                      : billHealth?.status === 'UNUSUAL'
                      ? 'bg-[#F31260]/10 text-[#900B37] border-[#F31260]/25'
                      : 'bg-[#17C964]/10 text-[#0E7036] border-[#17C964]/20'
                  )}
                >
                  {billHealth?.status === 'INSUFFICIENT_HISTORY'
                    ? lang === 'ml' ? 'ആദ്യ ബിൽ' : 'INITIAL BILL'
                    : billHealth?.status || 'NORMAL'}
                </span>
              </div>
            </div>

            {/* Baseline Context & Honest Intelligence */}
            {baseline.normalRangeMin && baseline.normalRangeMax ? (
              <div className="p-3 bg-black/[0.02] rounded-xl text-[12px] text-[#71717A] border border-black/[0.04]">
                <span className="font-semibold text-[#17171C] block">
                  {lang === 'ml' ? 'നിങ്ങളുടെ സാധാരണ പരിധി:' : 'Your usual range:'} {baseline.normalRangeMin}–{baseline.normalRangeMax} kWh
                </span>
                <span>
                  {lang === 'ml'
                    ? `കഴിഞ്ഞ സൈക്കിളിൽ ${savedHome?.lastBillUnits || 240} kWh ഉപയോഗിച്ചു.`
                    : `Last cycle was ${savedHome?.lastBillUnits || 240} kWh.`}
                </span>
              </div>
            ) : (
              <div className="p-3 bg-black/[0.02] rounded-xl text-[12px] text-[#71717A] border border-black/[0.04]">
                <span>{lang === 'ml' ? baseline.descriptionMl : baseline.descriptionEn}</span>
              </div>
            )}

            {/* Next Step Guidance */}
            <div className="pt-2 border-t border-black/[0.05] text-[12.5px]">
              <span className="font-semibold text-[#17171C] block">
                {lang === 'ml' ? 'അടുത്ത ഘട്ടം:' : 'Next step:'}
              </span>
              <p className="text-[12px] text-[#71717A] mt-0.5">
                {lang === 'ml'
                  ? 'പുതിയ കണക്ക് കാണാൻ മീറ്റർ നോക്കി റീഡിംഗ് നൽകുക.'
                  : 'Update your meter when you want a fresh estimate.'}
              </p>
            </div>
          </div>

          {/* ONE Obvious Primary Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowQuickUpdate(true)}
              className="ios-btn-primary w-full py-3.5 px-4 text-[15px] font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.97]"
            >
              <Gauge className="w-4 h-4 shrink-0" />
              <span>{lang === 'ml' ? 'മീറ്റർ അപ്ഡേറ്റ് ചെയ്യുക' : 'Update meter'}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <div className="flex items-center justify-between px-1 text-[13px]">
              <Link
                href="/history"
                className="text-[#006FEE] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>{lang === 'ml' ? 'ചരിത്രം കാണുക' : 'View history'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowActualBillModal(true)}
                className="text-[#71717A] hover:text-[#17171C] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{lang === 'ml' ? 'യഥാർത്ഥ ബിൽ നൽകാം' : 'Record actual bill'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          STATE C: ACTIVE CYCLE (Live Mid-Cycle Estimate Active)
         ========================================================= */}
      {homeState === 'STATE_C_ACTIVE_CYCLE' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header & Greeting */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider block">
                {greeting}
              </span>
              <h1 className="text-[20px] font-bold text-[#17171C] tracking-tight">
                {lang === 'ml' ? 'നിങ്ങളുടെ അടുത്ത ബിൽ' : 'Your next bill'}
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              {homeSlabStatus && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    homeSlabStatus.type === 'danger'
                      ? 'bg-[#F31260]/10 border-[#F31260]/25 text-[#900B37]'
                      : homeSlabStatus.type === 'warning'
                      ? 'bg-[#F5A524]/12 border-[#F5A524]/30 text-[#935303]'
                      : 'bg-[#17C964]/10 border-[#17C964]/25 text-[#0E7036]'
                  )}
                >
                  {homeSlabStatus.label}
                </span>
              )}
              <span className="text-[11px] font-semibold text-[#006FEE] bg-[#006FEE]/10 border border-[#006FEE]/15 px-2.5 py-1 rounded-full">
                {savedHome?.providerShortName || 'KSEB'} · {savedHome?.tariff || 'LT-1A'}
              </span>
            </div>
          </div>

          {/* Dominant Next Bill Card */}
          <div className="rounded-[26px] bg-white/95 backdrop-blur-md border border-black/[0.06] p-5 sm:p-6 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#006FEE]/[0.08] rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-1 relative">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                {lang === 'ml' ? 'അടുത്ത ബിൽ എസ്റ്റിമേറ്റ്' : 'Next bill estimate'}
              </span>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#71717A]">≈</span>
                <KsebOdometer value={estimatedBill || 1220} size="2xl" prefix="₹" />
                <span className="text-[14px] font-medium text-[#71717A]">
                  {lang === 'ml' ? 'പ്രതീക്ഷിക്കുന്നു' : 'estimated'}
                </span>
              </div>

              {rangeMin && rangeMax && (
                <p className="text-[12px] text-[#71717A] num-tabular mt-0.5 font-medium">
                  {lang === 'ml' ? 'സാധ്യതാ പരിധി:' : 'Likely range:'} ₹{rangeMin.toLocaleString('en-IN')} – ₹{rangeMax.toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Consumption Pace Row */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/[0.06] text-[13px]">
              <div>
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'ഇതുവരെയുള്ള ഉപയോഗം' : 'Current usage'}
                </span>
                <span className="font-bold text-[#17171C] num-tabular text-[14px]">
                  {unitsSoFar} kWh so far
                </span>
                {unitsPerDay ? (
                  <span className="text-[11px] text-[#71717A] block">
                    (~{unitsPerDay} u/day · ~{projectedUnits} projected)
                  </span>
                ) : projectedUnits ? (
                  <span className="text-[11px] text-[#71717A] block">
                    (~{projectedUnits} projected)
                  </span>
                ) : null}
              </div>

              <div>
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'സാധാരണയുമായി' : 'vs usual'}
                </span>
                <span className={cn('font-bold num-tabular text-[14px]', paceDeviation > 0 ? 'text-[#B45309]' : 'text-[#0E7036]')}>
                  {paceDeviationText}
                </span>
                {baseline.averageUnits > 0 && (
                  <span className="text-[11px] text-[#71717A] block num-tabular">
                    (~{baseline.averageUnits} avg)
                  </span>
                )}
              </div>
            </div>

            {/* Lightweight Cycle Timeline (Section 16) */}
            <CycleTimeline
              daysElapsed={cycleDaysElapsed}
              totalCycleDays={totalCycleDays}
              confidenceLabel={lang === 'ml' ? confidenceInfo.labelMl : confidenceInfo.labelEn}
            />
          </div>

          {/* ONE Primary Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowQuickUpdate(true)}
              className="ios-btn-primary w-full py-3.5 px-4 text-[15px] font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.97]"
            >
              <Gauge className="w-4 h-4 shrink-0" />
              <span>{lang === 'ml' ? 'റീഡിംഗ് അപ്ഡേറ്റ് ചെയ്യുക' : 'Update reading'}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <div className="flex items-center justify-between px-1 text-[13px]">
              <Link
                href="/history"
                className="text-[#006FEE] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>{lang === 'ml' ? 'ചരിത്രം കാണുക' : 'View history'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowActualBillModal(true)}
                className="text-[#71717A] hover:text-[#17171C] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{lang === 'ml' ? 'യഥാർത്ഥ ബിൽ നൽകാം' : 'Record actual bill'}</span>
              </button>
            </div>
          </div>

          {/* "What Changed?" Recent Cycle Comparison */}
          {recentComparison && (
            <div className="pt-1">
              <CycleComparisonCard comparison={recentComparison} />
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          STATE D: BILL ARRIVAL (Actual vs Estimate Reconciled)
         ========================================================= */}
      {homeState === 'STATE_D_ACTUAL_RECORDED' && savedHome?.lastReconciledComparison && (
        <div className="space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider block">
                {lang === 'ml' ? 'ബിൽ താരതമ്യം' : 'Estimate vs Actual'}
              </span>
              <h1 className="text-[20px] font-bold text-[#17171C] tracking-tight">
                {lang === 'ml' ? 'ബിൽ വന്നു കഴിഞ്ഞു' : 'Bill arrived'}
              </h1>
            </div>
            <span className="text-[11px] font-semibold text-[#006FEE] bg-[#006FEE]/10 border border-[#006FEE]/15 px-2.5 py-1 rounded-full">
              {savedHome.providerShortName || 'KSEB'} · {savedHome.tariff || 'LT-1A'}
            </span>
          </div>

          {/* Dominant Reconciled Card */}
          <div className="rounded-[26px] bg-white/95 backdrop-blur-md border border-black/[0.06] p-5 sm:p-6 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02]">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'ഞങ്ങളുടെ കണക്കുകൂട്ടൽ' : 'Your estimate'}
                </span>
                <span className="text-2xl font-bold text-[#17171C] num-tabular">
                  ₹{savedHome.lastReconciledComparison.predictedBill.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'യഥാർത്ഥ ബിൽ' : 'Your actual bill'}
                </span>
                <span className="text-2xl font-bold text-[#006FEE] num-tabular">
                  ₹{savedHome.lastReconciledComparison.actualBill.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Difference & Explanation */}
            <div className="p-3.5 bg-black/[0.02] rounded-xl space-y-1.5 border border-black/[0.04]">
              <span className="font-bold text-[14px] text-[#17171C] block">
                {savedHome.lastReconciledComparison.diff === 0
                  ? 'BILLWISE was an exact match.'
                  : savedHome.lastReconciledComparison.diff < 0
                  ? `BILLWISE was ₹${Math.abs(savedHome.lastReconciledComparison.diff)} high.`
                  : `BILLWISE was ₹${Math.abs(savedHome.lastReconciledComparison.diff)} low.`}
              </span>
              <p className="text-[12px] text-[#71717A] leading-relaxed">
                {lang === 'ml'
                  ? savedHome.lastReconciledComparison.dominantReasonMl
                  : savedHome.lastReconciledComparison.dominantReasonEn}
              </p>
            </div>

            {/* Prediction Learning if 3+ records */}
            {predictionLearning.hasSufficientData && (
              <div className="pt-2 border-t border-black/[0.05] text-[12px] text-[#71717A]">
                <span>{lang === 'ml' ? predictionLearning.learningStatementMl : predictionLearning.learningStatementEn}</span>
              </div>
            )}
          </div>

          {/* ONE Primary Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowQuickUpdate(true)}
              className="ios-btn-primary w-full py-3.5 px-4 text-[15px] font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.97]"
            >
              <Gauge className="w-4 h-4 shrink-0" />
              <span>{lang === 'ml' ? 'പുതിയ സൈക്കിൾ റീഡിംഗ് നൽകാം' : 'Update meter for new cycle'}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <div className="flex items-center justify-between px-1 text-[13px]">
              <Link
                href="/history"
                className="text-[#006FEE] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>{lang === 'ml' ? 'മുഴുവൻ ചരിത്രം കാണുക' : 'View full history'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  storageManager.clearReconciledComparison();
                  loadData();
                }}
                className="text-[#71717A] hover:text-[#17171C] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{lang === 'ml' ? 'മാറ്റിനിർത്തുക' : 'Dismiss'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Natural Language / Manglish Assistant for all states */}
      <div className="pt-1">
        <ManglishQueryBar />
      </div>

      {/* ---------------------------------------------------------
          MODALS: QUICK UPDATE, ACTUAL BILL & ONBOARDING
         --------------------------------------------------------- */}
      {showQuickUpdate && savedHome && (
        <QuickMeterUpdateModal
          home={savedHome}
          onClose={() => setShowQuickUpdate(false)}
          onSuccess={(updated) => {
            setSavedHome(updated);
            loadData();
          }}
        />
      )}

      {showActualBillModal && savedHome && (
        <ActualBillModal
          home={savedHome}
          onClose={() => setShowActualBillModal(false)}
          onReconciled={() => {
            loadData();
          }}
        />
      )}

      <OnboardingWizardModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(newHome) => {
          setSavedHome(newHome);
          loadData();
        }}
      />
    </div>
  );
}
