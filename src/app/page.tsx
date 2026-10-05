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
import { KsebOdometer } from '@/components/ui/KsebOdometer';
import { cn } from '@/lib/cn';

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
          lastReading: 10295,
          lastReadingDate: new Date(Date.now() - 14 * 86400000).toISOString(),
          lastBillAmount: 1148,
          lastBillUnits: 240,
          latestPrediction: {
            estimatedBill: 1284,
            likelyRangeMin: 1210,
            likelyRangeMax: 1360,
            projectedUnits: 258,
            unitsPerDay: 3.8,
            daysElapsed: 14,
            daysRemaining: 46,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
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
  const cycleDaysElapsed = savedHome?.latestPrediction?.daysElapsed || (daysSinceCheck ? Math.min(60, daysSinceCheck) : 25);
  const totalCycleDays = savedHome?.billingCycle === 'monthly' ? 30 : 60;
  const cycleDaysRemaining = Math.max(0, totalCycleDays - cycleDaysElapsed);

  // Cycle comparison if 2+ records exist in history
  const recentComparison: CycleComparisonDetail | null = useMemo(() => {
    if (history.length >= 2) {
      return storageManager.compareTwoCycles(history[1], history[0]);
    }
    return null;
  }, [history]);

  // Check if returning user or new user
  const isReturningUser = isClientLoaded && (!!savedHome || history.length > 0);

  // Estimated bill and range
  const estimatedBill = savedHome?.latestPrediction?.estimatedBill;
  const rangeMin = savedHome?.latestPrediction?.likelyRangeMin;
  const rangeMax = savedHome?.latestPrediction?.likelyRangeMax;
  const unitsPerDay = savedHome?.latestPrediction?.unitsPerDay;
  const projectedUnits = savedHome?.latestPrediction?.projectedUnits;

  // Last bill difference
  const lastBillAmount = savedHome?.lastBillAmount;
  const billDiff = estimatedBill && lastBillAmount ? estimatedBill - lastBillAmount : null;

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

  return (
    <div className="relative max-w-[430px] mx-auto px-4 pt-3 pb-6 space-y-5">
      {/* ---------------------------------------------------------
          EXPERIENCE A: RETURNING USER ("MY ELECTRICITY")
         --------------------------------------------------------- */}
      {isReturningUser ? (
        <div className="space-y-4 animate-fade-in">
          {/* Header & Greeting */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wider block">
                {greeting}
              </span>
              <h1 className="text-[20px] font-bold text-[#17171C] tracking-tight">
                {lang === 'ml' ? 'നിങ്ങളുടെ വൈദ്യുതി' : 'Your electricity'}
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

          {/* -- Dominant Next Bill Card (iOS Utility Clean) -- */}
          <div className="rounded-[24px] bg-white border border-black/[0.06] p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                {lang === 'ml' ? 'അടുത്ത ബിൽ' : 'Next bill'}
              </span>

              {estimatedBill ? (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <KsebOdometer value={estimatedBill} size="2xl" prefix="₹" />
                    <span className="text-[14px] font-medium text-[#71717A]">
                      {lang === 'ml' ? 'ഏകദേശം' : 'estimated'}
                    </span>
                  </div>

                  {rangeMin && rangeMax && (
                    <p className="text-[12px] text-[#71717A] num-tabular mt-1 font-medium">
                      {lang === 'ml' ? 'സാധ്യതാ പരിധി:' : 'Likely range:'} ₹{rangeMin.toLocaleString('en-IN')} – ₹{rangeMax.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <span className="text-[22px] font-bold text-[#17171C] block">
                    {lang === 'ml' ? 'റീഡിംഗ് നൽകാൻ തയ്യാറാണ്' : 'Ready for your next reading.'}
                  </span>
                  <p className="text-[12px] text-[#71717A] mt-0.5">
                    {lang === 'ml' ? 'മീറ്റർ നോക്കി പുതിയ കണക്ക് കാണാം.' : 'Update your meter to view your projected bill.'}
                  </p>
                </div>
              )}
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/[0.06] text-[13px]">
              <div>
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'നിലവിലെ ഉപയോഗം' : 'Current usage'}
                </span>
                <span className="font-bold text-[#17171C] num-tabular text-[14px]">
                  {unitsPerDay ? `${unitsPerDay} units/day` : '—'}
                </span>
                {projectedUnits && (
                  <span className="text-[11px] text-[#71717A] block">
                    (~{projectedUnits} {lang === 'ml' ? 'ആകെ' : 'projected'})
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-[#71717A] block font-medium">
                  {lang === 'ml' ? 'കഴിഞ്ഞ ബില്ലുമായി' : 'vs last bill'}
                </span>
                {billDiff !== null ? (
                  <span
                    className={`font-bold num-tabular text-[14px] ${
                      billDiff > 0
                        ? 'text-[#B45309]'
                        : billDiff < 0
                        ? 'text-[#0E7036]'
                        : 'text-[#71717A]'
                    }`}
                  >
                    {billDiff > 0
                      ? `+₹${billDiff}`
                      : billDiff < 0
                      ? `−₹${Math.abs(billDiff)}`
                      : '₹0'}
                  </span>
                ) : (
                  <span className="text-[13px] text-[#71717A] font-medium">—</span>
                )}
                {lastBillAmount && (
                  <span className="text-[11px] text-[#71717A] block num-tabular">
                    (₹{lastBillAmount} {lang === 'ml' ? 'കഴിഞ്ഞ തവണ' : 'last cycle'})
                  </span>
                )}
              </div>
            </div>

            {/* Meter Status / Cycle Tracker */}
            <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between text-[12px] text-[#71717A]">
              <span>
                {daysSinceCheck !== null && daysSinceCheck >= 0
                  ? lang === 'ml'
                    ? `മീറ്റർ പരിശോധിച്ചത്: ${daysSinceCheck} ദിവസം മുൻപ്`
                    : `Last checked: ${daysSinceCheck === 0 ? 'Today' : `${daysSinceCheck}d ago`}`
                  : lang === 'ml' ? 'മീറ്റർ റീഡിംഗ് രേഖപ്പെടുത്തിയിട്ടുണ്ട്' : 'Meter reading on record'}
              </span>
              <span className="num-tabular font-medium text-[#17171C]">
                {cycleDaysElapsed}d elapsed · {cycleDaysRemaining}d left
              </span>
            </div>
          </div>

          {/* -- Primary Action: Update Reading (Key Retention Flow) -- */}
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

          {/* -- "What Changed?" Recent Cycle Comparison (if available) -- */}
          {recentComparison && (
            <div className="pt-1">
              <CycleComparisonCard comparison={recentComparison} />
            </div>
          )}

          {/* -- Natural Language / Manglish Assistant --------------- */}
          <div className="pt-1">
            <ManglishQueryBar />
          </div>
        </div>
      ) : (
        /* ---------------------------------------------------------
           EXPERIENCE B: FIRST-TIME USER (NEW VISITOR)
           --------------------------------------------------------- */
        <div className="space-y-5 animate-fade-in">
          {/* Header Metadata & Confident Headline */}
          <div className="space-y-2 pt-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006FEE]/10 text-[#006FEE] border border-[#006FEE]/15 text-[11px] font-semibold tracking-wide uppercase mx-auto sm:mx-0 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#006FEE]" />
              <span>{lang === 'ml' ? 'KSEB · കേരളം' : 'KSEB Kerala · Domestic LT-1A'}</span>
            </div>

            <h1 className="text-[34px] sm:text-[38px] font-bold tracking-tight text-[#111116] leading-[1.12]">
              {lang === 'ml' ? (
                <>ബിൽ വരുന്നതിനു<br />മുൻപ് അറിയൂ.</>
              ) : (
                <>Know your bill<br />before it arrives.</>
              )}
            </h1>

            <p className="text-[14px] text-[#71717A] leading-relaxed max-w-sm mx-auto sm:mx-0">
              {lang === 'ml'
                ? 'ഒരു തവണ നോക്കൂ. എത്ര തുക വരുമെന്ന് മുൻകൂട്ടി അറിയാം.'
                : "One quick check. Know what you're likely to pay."}
            </p>
          </div>

          {/* Quick Setup Card for First-Time Users */}
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-br from-[#006FEE]/10 via-[#006FEE]/5 to-transparent border border-[#006FEE]/25 hover:border-[#006FEE]/50 transition-all cursor-pointer shadow-2xs group flex items-center justify-between active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#006FEE] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[14px] font-bold text-[#17171C] block">
                  {lang === 'ml' ? '30 സെക്കൻഡിൽ വീട് സജ്ജീകരിക്കാം' : 'Set up your home in 30s'}
                </span>
                <span className="text-[12px] text-[#71717A] block">
                  {lang === 'ml' ? 'താരിഫും ആദ്യ റീഡിംഗും ചേർക്കുക' : 'Guided setup for first-time visitors'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#006FEE] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Primary & Secondary Native Actions */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
            <Link
              href="/scan"
              onClick={() => analytics.track('flow_started', { flow: 'bill_ocr' })}
              className="ios-btn-primary w-full h-12 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 rounded-2xl text-[13.5px] sm:text-[14px] font-semibold shadow-sm active:scale-[0.97] whitespace-nowrap"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>{lang === 'ml' ? 'ബിൽ സ്കാൻ' : 'Scan bill'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
            </Link>

            <Link
              href="/manual"
              onClick={() => analytics.track('flow_started', { flow: 'direct_units' })}
              className="ios-btn-secondary w-full h-12 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 rounded-2xl text-[13.5px] sm:text-[14px] font-semibold text-[#17171C] active:scale-[0.97] whitespace-nowrap"
            >
              <Gauge className="w-4 h-4 shrink-0 text-[#71717A]" />
              <span>{lang === 'ml' ? 'യൂണിറ്റ് നൽകുക' : 'Enter units'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#71717A] opacity-70" />
            </Link>
          </div>

          {/* Privacy Guarantee Reassurance */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#71717A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#17C964]" />
            <span>
              {lang === 'ml'
                ? 'ലോഗിൻ ആവശ്യമില്ല · നിങ്ങളുടെ വിവരങ്ങൾ ഈ ഫോണിൽ മാത്രം'
                : 'No login required · your bill stays on this device'}
            </span>
          </div>

          {/* -- Clean Example Mode (Separated from real experience) -- */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowExamplePreview((prev) => !prev)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-black/[0.06] text-[13px] text-[#71717A] hover:text-[#17171C] cursor-pointer shadow-2xs"
            >
              <span className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#006FEE]" />
                {lang === 'ml' ? 'ഒരു മാതൃക കാണണോ? (240 യൂണിറ്റ്)' : 'See an example estimate'}
              </span>
              {showExamplePreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showExamplePreview && (
              <div className="mt-2.5 p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.05]">
                  <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                    {lang === 'ml' ? 'മാതൃക കണക്ക്' : 'Example estimate'}
                  </span>
                  <span className="text-[11px] text-[#71717A] bg-black/[0.04] px-2 py-0.5 rounded-full">
                    Sample Data
                  </span>
                </div>
                <ProductPreviewCard interactive={true} />
              </div>
            )}
          </div>

          {/* Natural Language / Manglish Assistant */}
          <div className="pt-1">
            <ManglishQueryBar />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          MODALS: QUICK UPDATE & ACTUAL BILL RECORDING
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

      {/* Onboarding Wizard Modal for First-Time Users */}
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
