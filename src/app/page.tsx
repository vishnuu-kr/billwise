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

import BillAutopsyWidget from '@/components/BillAutopsyWidget';
import CliffRecoveryPlan from '@/components/CliffRecoveryPlan';
import CliffCalendarAlarm from '@/components/CliffCalendarAlarm';
import { calculateBill } from '@/lib/calculation/engine';

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

  // Danger Window vs Calm Zone calculations
  const isDangerWindow = cycleDaysElapsed >= 40 && cycleDaysElapsed <= 52;
  const isCalmZone = cycleDaysElapsed < 40;
  const daysUntilDangerWindow = Math.max(0, 42 - cycleDaysElapsed);

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
  const isCliffRisk = (projectedUnits || 0) > 240;

  // Last bill difference
  const lastBillAmount = savedHome?.lastBillAmount;
  const billDiff = estimatedBill && lastBillAmount ? estimatedBill - lastBillAmount : null;

  const handleRecoveryPlanApplied = (rescuedUnits: number) => {
    if (savedHome && savedHome.latestPrediction) {
      const recalculated = calculateBill({
        units: rescuedUnits,
        phase: savedHome.phase,
        billingCycle: savedHome.billingCycle,
      });
      const updated: SavedHomeProfile = {
        ...savedHome,
        latestPrediction: {
          ...savedHome.latestPrediction,
          projectedUnits: rescuedUnits,
          estimatedBill: recalculated.total,
          likelyRangeMin: Math.round(recalculated.total * 0.96),
          likelyRangeMax: Math.round(recalculated.total * 1.05),
        },
      };
      storageManager.saveHome(updated);
      setSavedHome(updated);
    }
  };

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
            <span className="text-[11px] font-semibold text-[#006FEE] bg-[#006FEE]/10 border border-[#006FEE]/15 px-2.5 py-1 rounded-full">
              {savedHome?.providerShortName || 'KSEB'} · {savedHome?.tariff || 'LT-1A'}
            </span>
          </div>

          {/* -- High Urgency Danger Window Banner -- */}
          {isDangerWindow && (
            <div className="p-4 rounded-2xl bg-[#E11D48]/10 border border-[#E11D48]/25 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#E11D48] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-ping" />
                  {lang === 'ml' ? 'ഡെയ്ഞ്ചർ വിൻഡോ സജീവം (ഡേ 42)' : '⚠️ Danger Window Active (Day 42)'}
                </span>
                <span className="text-[11px] font-semibold text-[#E11D48] num-tabular">
                  {cycleDaysRemaining}d remaining
                </span>
              </div>
              <p className="text-[12px] text-[#17171C] leading-relaxed">
                {lang === 'ml'
                  ? `സൈക്കിൾ തീരാൻ ${cycleDaysRemaining} ദിവസം മാത്രം. 240 യൂണിറ്റ് സബ്സിഡി നഷ്ടപ്പെടാതിരിക്കാൻ ഇപ്പോൾ മീറ്റർ റീഡിംഗ് രേഖപ്പെടുത്തൂ.`
                  : `Only ${cycleDaysRemaining} days left in your cycle. Update your meter now to protect your ₹148 subsidy before it's too late.`}
              </p>
              <button
                type="button"
                onClick={() => setShowQuickUpdate(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#E11D48] hover:bg-[#c9143c] text-white text-[13px] font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <Gauge className="w-4 h-4 shrink-0" />
                <span>{lang === 'ml' ? 'റീഡിംഗ് നൽകി സബ്സിഡി സംരക്ഷിക്കാം' : 'Check Reading in 5s →'}</span>
              </button>
            </div>
          )}

          {/* -- Safe Zone Status (No checks needed) -- */}
          {isCalmZone && (
            <div className="p-3.5 rounded-2xl bg-[#17C964]/10 border border-[#17C964]/20 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0E7036] shrink-0" />
                <div>
                  <span className="font-bold text-[#0E7036] block">
                    {lang === 'ml' ? 'സുരക്ഷിതമായ സമയം — മീറ്റർ നോക്കേണ്ടതില്ല' : 'Safe Zone — No checks needed'}
                  </span>
                  <span className="text-[#71717A] text-[11px]">
                    {lang === 'ml'
                      ? `ഡെയ്ഞ്ചർ വിൻഡോയിലേക്ക് ഇനിയും ${daysUntilDangerWindow} ദിവസമുണ്ട്.`
                      : `Next check in ${daysUntilDangerWindow} days (Day 42).`}
                  </span>
                </div>
              </div>
              <CliffCalendarAlarm compact cycleStartDate={savedHome?.lastReadingDate ? new Date(savedHome.lastReadingDate) : undefined} />
            </div>
          )}

          {/* -- Dominant Next Bill Card (iOS Utility Clean) -- */}
          <div className="rounded-[24px] bg-white border border-black/[0.06] p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                {lang === 'ml' ? 'അടുത്ത ബിൽ' : 'Next bill'}
              </span>

              {estimatedBill ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <KsebOdometer value={estimatedBill} size="2xl" prefix="₹" />
                    <span className="text-[14px] font-medium text-[#71717A] ml-1">
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
                      billDiff > 0 ? 'text-[#B45309]' : 'text-[#0E7036]'
                    }`}
                  >
                    {billDiff > 0 ? `+₹${billDiff}` : `−₹${Math.abs(billDiff)}`}
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

          {/* -- Prescriptive Cliff Recovery Plan (If trending over 240u) -- */}
          {isCliffRisk && projectedUnits && (
            <div className="pt-1">
              <CliffRecoveryPlan
                currentProjectedUnits={projectedUnits}
                daysRemaining={cycleDaysRemaining}
                phase={savedHome?.phase}
                onPlanApplied={handleRecoveryPlanApplied}
              />
            </div>
          )}

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
          {/* Day-1 Instant Hook: Bill Autopsy & Cliff Protection */}
          <BillAutopsyWidget onProtected={() => loadData()} />

          {/* Alternative Quick Actions */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[12px] font-bold text-[#71717A] uppercase tracking-wider block px-1">
              {lang === 'ml' ? 'മറ്റ് വഴികൾ' : 'Alternative Options'}
            </span>

            {/* Quick Setup Card */}
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="w-full text-left p-3.5 rounded-2xl bg-white border border-black/[0.08] hover:border-[#006FEE]/40 transition-all cursor-pointer shadow-2xs group flex items-center justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE] group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-[#17171C] block">
                    {lang === 'ml' ? '30 സെക്കൻഡിൽ വീട് സജ്ജീകരിക്കാം' : 'Full Guided Home Setup'}
                  </span>
                  <span className="text-[11px] text-[#71717A] block">
                    {lang === 'ml' ? 'താരിഫും ആദ്യ റീഡിംഗും ചേർക്കുക' : 'Configure tariff, phase, and initial meter reading'}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-[#006FEE] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Scan or Enter Units */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/scan"
                onClick={() => analytics.track('flow_started', { flow: 'bill_ocr' })}
                className="ios-btn-secondary w-full py-3 px-3 flex items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold text-[#17171C] border border-black/[0.08] shadow-2xs active:scale-[0.97]"
              >
                <Camera className="w-4 h-4 shrink-0 text-[#71717A]" />
                <span>{lang === 'ml' ? 'ബിൽ സ്കാൻ ചെയ്യാം' : 'Scan Bill →'}</span>
              </Link>

              <Link
                href="/manual"
                onClick={() => analytics.track('flow_started', { flow: 'direct_units' })}
                className="ios-btn-secondary w-full py-3 px-3 flex items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold text-[#17171C] border border-black/[0.08] shadow-2xs active:scale-[0.97]"
              >
                <Gauge className="w-4 h-4 shrink-0 text-[#71717A]" />
                <span>{lang === 'ml' ? 'യൂണിറ്റ് നൽകുക' : 'Enter Units →'}</span>
              </Link>
            </div>
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
