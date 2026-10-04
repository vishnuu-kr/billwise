'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PredictionResult } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Share2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Wallet,
  Tv,
  X,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ChevronLeft,
} from 'lucide-react';
import { motion, useSpring, useTransform, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import FeedbackWidget from './FeedbackWidget';
import { KsebSlabStorageMeter } from '@/components/ui/KsebSlabStorageMeter';
import { DynamicIslandBanner } from '@/components/ui/DynamicIslandBanner';
import { ConfettiButton } from '@/components/ui/ConfettiButton';

const ShareModal = dynamic(() => import('./ShareModal'), { ssr: false });
const ThermalBillReceipt = dynamic(
  () => import('@/components/ui/ThermalBillReceipt').then((m) => m.ThermalBillReceipt),
  { ssr: false }
);
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import SaveHomePrompt from './SaveHomePrompt';

/** Spring count-up number for hero bill amount */
function SpringAmount({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(0, { stiffness: 90, damping: 18, mass: 1.0 });
  const displayValue = useTransform(spring, (v) => `₹${Math.round(v).toLocaleString('en-IN')}`);
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span className={className}>{displayValue}</motion.span>;
}

interface ResultCardProps {
  prediction: PredictionResult;
  previousBillAmount?: number;
  hideBackLink?: boolean;
}

export default function ResultCard({
  prediction,
  previousBillAmount,
  hideBackLink = false,
}: ResultCardProps) {
  const { lang } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBreakdownSheet, setShowBreakdownSheet] = useState(false);
  const [isSlabsExpanded, setIsSlabsExpanded] = useState(false);
  const [viewFormat, setViewFormat] = useState<'card' | 'receipt'>('card');

  const hasPreviousBill = typeof previousBillAmount === 'number' && previousBillAmount > 0;
  const billDiff = hasPreviousBill ? prediction.estimatedBill - previousBillAmount : 0;
  const isHigher = billDiff > 0;
  const diffPercent = hasPreviousBill ? Math.round((Math.abs(billDiff) / previousBillAmount) * 100) : 0;

  const rangeSpan = Math.max(1, prediction.likelyRangeMax - prediction.likelyRangeMin);
  const dotPercent = Math.max(
    10,
    Math.min(90, Math.round(((prediction.estimatedBill - prediction.likelyRangeMin) / rangeSpan) * 100))
  );

  const calc = prediction.calculatedBillResult;
  const totalPayable = calc.total;

  const energyRupees = Math.max(0, calc.grossEnergyCharge - calc.energySubsidy);
  const fixedRupees = calc.netFixedCharge;
  const dutyRupees = calc.electricityDuty;
  const fuelRupees = calc.fuelAdjustment;
  const meterRupees = calc.meterRent;
  const subsidyRupees = calc.totalSubsidies;

  // Proportional shares
  const grossSum = calc.grossEnergyCharge + calc.grossFixedCharge + calc.electricityDuty;
  const energySharePct = Math.round((calc.grossEnergyCharge / (grossSum || 1)) * 100);
  const fixedSharePct = Math.round((calc.grossFixedCharge / (grossSum || 1)) * 100);
  const dutySharePct = Math.round((calc.electricityDuty / (grossSum || 1)) * 100);

  return (
    <div className="w-full space-y-5">
      {/* -- Dynamic Island Slab Warning Pill ----------------- */}
      <DynamicIslandBanner units={prediction.projectedUnits} />

      {/* -- Top Bar: Back / Status, View Mode Toggle & Confetti Share --- */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {!hideBackLink ? (
          <Link
            href="/predict"
            className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-medium text-[#71717A] hover:text-[#17171C] active:opacity-60 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">{lang === 'ml' ? 'റീഡിംഗ് മാറ്റൂ' : 'Change reading'}</span>
            <span className="inline xs:hidden">{lang === 'ml' ? 'മാറ്റൂ' : 'Back'}</span>
          </Link>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#17C964]/10 text-[#17C964] text-[11px] font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#17C964] animate-pulse" />
            <span>{lang === 'ml' ? 'ഫലം തയ്യാർ' : 'Estimate ready'}</span>
          </div>
        )}

        {/* View Mode Toggle using SegmentedControl */}
        <div className="shrink-0">
          <SegmentedControl
            options={[
              { value: 'card' as const, label: lang === 'ml' ? 'പാസ്' : 'Digital' },
              { value: 'receipt' as const, label: lang === 'ml' ? 'ബിൽ' : 'Receipt' },
            ]}
            value={viewFormat}
            onChange={(v) => setViewFormat(v as 'card' | 'receipt')}
            size="sm"
          />
        </div>

        <ConfettiButton
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-semibold text-[#006FEE] bg-[#006FEE]/10 px-2.5 sm:px-3 py-1.5 rounded-full active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">{lang === 'ml' ? 'പങ്കുവെക്കൂ' : 'Share'}</span>
        </ConfettiButton>
      </div>

      {/* Conditional: Thermal Receipt View vs Digital Pass Card */}
      {viewFormat === 'receipt' ? (
        <ThermalBillReceipt
          billData={{
            consumerNo: '1155-DOM-2026',
            sectionName: 'KSEB Section Office',
            billingCycle: 'Bi-Monthly (60 Days)',
            units: prediction.projectedUnits,
            energyCharge: calc.grossEnergyCharge,
            fixedCharge: calc.netFixedCharge,
            duty: calc.electricityDuty,
            fuelSurcharge: calc.fuelAdjustment,
            meterRent: calc.meterRent,
            subsidyAmount: calc.totalSubsidies,
            totalAmount: calc.total,
            phase: calc.phase === 'three' ? 'Three Phase' : 'Single Phase',
          }}
        />
      ) : (
        <>
          {/* -- 1. Digital Pass Hero Card with Spotlight Tilt ---- */}
          <SpotlightCard className="p-5 sm:p-6 space-y-4 relative overflow-hidden">
            {/* Subtle top aura */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#006FEE] via-[#38BDF8] to-[#17C964]" />

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#17C964] animate-pulse" />
                <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                  {lang === 'ml' ? 'അടുത്ത ബിൽ പ്രവചനം' : 'Next Electricity Bill Estimate'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#71717A] bg-black/[0.04] px-2.5 py-0.5 rounded-full border border-black/[0.04]">
                {calc.phase === 'three' ? '3-Phase' : '1-Phase'} · {calc.billingCycle === 'bi-monthly' ? 'Bi-monthly' : 'Monthly'}
              </span>
            </div>

            {/* Hero Figure with Mechanical Odometer */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <SpringAmount
                  value={prediction.estimatedBill}
                  className="text-[48px] sm:text-[56px] font-bold tracking-tight text-[#17171C] num-tabular leading-none"
                />
                <span className="text-[14px] font-medium text-[#71717A]">
                  {lang === 'ml' ? 'ഏകദേശ തുക' : 'estimated'}
                </span>
              </div>

              {/* Visual Range Spectrum */}
              <div className="pt-2 space-y-1.5">
                <div className="relative h-[4px] bg-black/[0.06] rounded-full overflow-visible">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#006FEE] ring-2 ring-white shadow-xs transition-all"
                    style={{ left: `${dotPercent}%`, transform: 'translate(-50%, -50%)' }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#71717A] num-tabular font-medium">
                  <span>₹{prediction.likelyRangeMin.toLocaleString('en-IN')} {lang === 'ml' ? 'കുറഞ്ഞത്' : 'min'}</span>
                  <span className="text-[#17171C] font-semibold">₹{prediction.estimatedBill.toLocaleString('en-IN')} {lang === 'ml' ? 'സാധ്യത' : 'likely'}</span>
                  <span>₹{prediction.likelyRangeMax.toLocaleString('en-IN')} {lang === 'ml' ? 'കൂടിയത്' : 'max'}</span>
                </div>
              </div>
            </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/[0.05] text-[13px]">
          <div>
            <span className="text-[11px] text-[#71717A] block font-medium">
              {lang === 'ml' ? 'പ്രതിദിന വേഗത' : 'Daily pace'}
            </span>
            <span className="font-semibold text-[#17171C] num-tabular">
              {prediction.unitsPerDay} <span className="text-[11px] font-normal text-[#71717A]">{lang === 'ml' ? 'യൂ/ദി' : 'u/day'}</span>
            </span>
            <span className="text-[11px] text-[#71717A] block">
              ({prediction.projectedUnits} {lang === 'ml' ? 'ആകെ' : 'projected'})
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#71717A] block font-medium">
              {hasPreviousBill ? (lang === 'ml' ? 'മുൻ ബില്ലുമായി' : 'vs Last bill') : (lang === 'ml' ? 'സൈക്കിൾ' : 'Billing cycle')}
            </span>
            {hasPreviousBill ? (
              <span className={`font-semibold num-tabular ${isHigher ? 'text-[#B45309]' : 'text-[#0E7036]'}`}>
                {isHigher ? `+₹${Math.abs(billDiff).toLocaleString('en-IN')}` : `−₹${Math.abs(billDiff).toLocaleString('en-IN')}`}
                <span className="text-[11px] font-normal text-[#71717A] ml-1">
                  ({isHigher ? `+${diffPercent}%` : `−${diffPercent}%`})
                </span>
              </span>
            ) : (
              <span className="font-semibold text-[#17171C]">
                {calc.billingCycle === 'monthly'
                  ? (lang === 'ml' ? '30 ദിവസം (പ്രതിമാസം)' : '30 days (Monthly)')
                  : (lang === 'ml' ? '60 ദിവസം (2 മാസം)' : '60 days (Bi-monthly)')}
              </span>
            )}
          </div>
        </div>

        {/* Subsidy Highlight Badge */}
        {subsidyRupees > 0 && (
          <div className="rounded-xl bg-[#17C964]/10 border border-[#17C964]/20 p-3 text-[12px] flex items-center justify-between text-[#0E7036]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#17C964] shrink-0" />
              <span className="font-semibold">
                {lang === 'ml' ? 'സർക്കാർ സബ്‌സിഡി ലഭ്യമായി' : 'Govt Tariff Subsidy Applied'}
              </span>
            </div>
            <span className="font-bold num-tabular">
              −₹{subsidyRupees.toFixed(2)}
            </span>
          </div>
        )}

        {/* Approaching Slab Warning */}
        {prediction.approachingSlab && prediction.approachingSlab.unitsRemainingInSlab > 0 && (
          <div className="rounded-xl bg-[#F5A524]/10 border border-[#F5A524]/30 p-3 text-[12px] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#F5A524] shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#935303]">
                  {lang === 'ml' ? 'അടുത്ത സ്ലാബ് പരിധി അടുക്കുന്നു' : 'Approaching next pricing band'}
                </span>
                {typeof prediction.approachingSlab.estimatedDaysRemaining === 'number' && prediction.approachingSlab.estimatedDaysRemaining > 0 && (
                  <span className="text-[11px] font-medium text-[#935303] num-tabular ml-2">
                    ~{prediction.approachingSlab.estimatedDaysRemaining}d left
                  </span>
                )}
              </div>
              <p className="text-[#935303]/90 mt-0.5 leading-relaxed">
                {prediction.approachingSlab.unitsRemainingInSlab} units remaining before crossing. {prediction.approachingSlab.warningMessage}
              </p>
            </div>
          </div>
        )}
      </SpotlightCard>

          {/* -- Telescopic Slab Quota Meter ---------------------- */}
          <KsebSlabStorageMeter units={prediction.projectedUnits} maxScale={500} />

      {/* -- 2. Itemized Receipt Card (No clipping!) ----------- */}
      <div className="glass-card p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#006FEE]" />
            <h3 className="text-[14px] font-semibold text-[#17171C]">
              {lang === 'ml' ? 'തുക വിഭജനം' : 'Where your money goes'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowBreakdownSheet(true)}
            className="text-[12px] font-semibold text-[#006FEE] hover:underline cursor-pointer"
          >
            {lang === 'ml' ? 'കണക്കുകൂട്ടിയ രീതി' : 'See how we calculated it'}
          </button>
        </div>

        {/* Proportional breakdown bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-black/[0.04]">
          <div
            className="bg-[#006FEE] transition-all duration-500"
            style={{ width: `${energySharePct}%` }}
            title="Energy Charges"
          />
          <div
            className="bg-[#17171C] transition-all duration-500"
            style={{ width: `${fixedSharePct}%` }}
            title="Fixed Charges"
          />
          <div
            className="bg-[#F5A524] transition-all duration-500"
            style={{ width: `${dutySharePct}%` }}
            title="Electricity Duty"
          />
        </div>

        {/* Itemized Rows */}
        <div className="space-y-2 text-[13px] pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#006FEE]" />
              <span className="text-[#17171C] font-medium">
                {lang === 'ml' ? 'ഊർജ്ജ ചാർജ്ജ്' : 'Energy charge'}
              </span>
              <span className="text-[11px] text-[#A1A1AA]">({energySharePct}%)</span>
            </div>
            <span className="num-tabular font-semibold text-[#17171C]">
              ₹{energyRupees.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#17171C]" />
              <span className="text-[#17171C] font-medium">
                {lang === 'ml' ? 'ഫിക്സഡ് ചാർജ്ജ്' : 'Fixed charge'}
              </span>
              <span className="text-[11px] text-[#A1A1AA]">({fixedSharePct}%)</span>
            </div>
            <span className="num-tabular font-semibold text-[#17171C]">
              ₹{fixedRupees.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F5A524]" />
              <span className="text-[#17171C] font-medium">
                {lang === 'ml' ? 'വൈദ്യുതി ഡ്യൂട്ടി (10%)' : 'Electricity duty (10%)'}
              </span>
              <span className="text-[11px] text-[#A1A1AA]">({dutySharePct}%)</span>
            </div>
            <span className="num-tabular font-semibold text-[#17171C]">
              ₹{dutyRupees.toFixed(2)}
            </span>
          </div>

          {(fuelRupees > 0 || meterRupees > 0) && (
            <div className="flex items-center justify-between text-[#71717A]">
              <span>{lang === 'ml' ? 'FAC & മീറ്റർ വാടക' : 'Fuel surcharge & meter rent'}</span>
              <span className="num-tabular font-medium">
                ₹{(fuelRupees + meterRupees).toFixed(2)}
              </span>
            </div>
          )}

          {subsidyRupees > 0 && (
            <div className="flex items-center justify-between text-[#0E7036] font-medium">
              <span>{lang === 'ml' ? 'സർക്കാർ സബ്സിഡി' : 'State subsidy benefit'}</span>
              <span className="num-tabular">−₹{subsidyRupees.toFixed(2)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[15px] font-bold text-[#17171C]">
            <span>{lang === 'ml' ? 'ആകെ കണക്കാക്കിയ തുക' : 'Total estimated bill'}</span>
            <span className="num-tabular">₹{totalPayable.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Expandable Slab Breakdown Accordion */}
        <div className="pt-1 border-t border-black/[0.04]">
          <button
            type="button"
            onClick={() => setIsSlabsExpanded(prev => !prev)}
            className="w-full flex items-center justify-between py-1 text-[12px] font-medium text-[#71717A] hover:text-[#17171C] cursor-pointer"
          >
            <span>{lang === 'ml' ? 'സ്ലാബ് തിരിച്ചുള്ള വിവരങ്ങൾ' : 'Telescopic slab breakdown'}</span>
            {isSlabsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isSlabsExpanded && (
            <div className="pt-2 space-y-1.5 text-[12px] bg-black/[0.02] rounded-xl p-3 mt-1 num-tabular">
              {calc.slabBreakdown.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center text-[#71717A]">
                  <span>{s.label} ({s.unitsBilled}u @ ₹{s.ratePerUnit.toFixed(2)})</span>
                  <span className="font-semibold text-[#17171C]">₹{s.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* -- Next Action Guidance Card -------------------------- */}
      <div className="rounded-2xl bg-white border border-black/[0.06] p-4 sm:p-5 space-y-2 shadow-2xs">
        <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
          {lang === 'ml' ? 'അടുത്ത നടപടി' : 'Your next action'}
        </span>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-[#17171C]">
            {lang === 'ml'
              ? 'ഏകദേശം 7 ദിവസത്തിനകം മീറ്റർ വീണ്ടും പരിശോധിക്കുക.'
              : 'Update your meter in ~7 days.'}
          </p>
          <span className="text-[12px] font-medium text-[#006FEE] bg-[#006FEE]/10 px-2.5 py-1 rounded-full shrink-0">
            {prediction.daysRemaining}d {lang === 'ml' ? 'ബാക്കി' : 'left'}
          </span>
        </div>
        <p className="text-[12px] text-[#71717A] leading-relaxed">
          {lang === 'ml'
            ? 'ഇടയ്ക്കിടെയുള്ള റീഡിംഗുകൾ നിങ്ങളുടെ ബിൽ പ്രവചനങ്ങളെ കൂടുതൽ കൃത്യതയുള്ളതാക്കുന്നു.'
            : 'Periodic meter checks calibrate your daily pace and protect against unexpected slab jumps.'}
        </p>
      </div>

      {/* -- Save Home Prompt (if not already saved) ----------- */}
      <SaveHomePrompt
        prediction={prediction}
        lastBillAmount={previousBillAmount}
        phase={calc.phase}
        billingCycle={calc.billingCycle}
        connectedLoadWatts={calc.connectedLoadWatts}
      />

      {/* -- 3. Quick Action Hub -------------------------------- */}
      <div className="space-y-2">
        <span className="text-[12px] font-medium text-[#71717A] block px-1">
          {lang === 'ml' ? 'അടുത്ത നടപടികൾ' : 'Smart utilities'}
        </span>
        <div className="glass-card divide-y divide-black/[0.04] overflow-hidden">
          <Link
            href={`/what-if?units=${prediction.projectedUnits}`}
            className="ios-row text-inherit no-underline"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE]">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[14px] font-semibold text-[#17171C] block">
                  {lang === 'ml' ? 'What-If സിമുലേറ്റർ' : 'What-if simulator'}
                </span>
                <span className="text-[12px] text-[#71717A]">
                  {lang === 'ml' ? 'ഉപയോഗ മാറ്റങ്ങൾ പരീക്ഷിക്കുക' : 'Preview impact of usage shifts'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
          </Link>

          <Link
            href="/budget"
            className="ios-row text-inherit no-underline"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#17C964]/10 flex items-center justify-center text-[#17C964]">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[14px] font-semibold text-[#17171C] block">
                  {lang === 'ml' ? 'ബജറ്റ് ലക്ഷ്യം വെക്കുക' : 'Set a budget target'}
                </span>
                <span className="text-[12px] text-[#71717A]">
                  {lang === 'ml' ? 'തുക ഇതിൽ താഴെ നിർത്താം' : 'Keep bill under a ceiling'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
          </Link>

          <Link
            href="/appliances"
            className="ios-row text-inherit no-underline"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5A524]/10 flex items-center justify-center text-[#F5A524]">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[14px] font-semibold text-[#17171C] block">
                  {lang === 'ml' ? 'ഉപകരണങ്ങളുടെ ചെലവ്' : 'Appliance power audit'}
                </span>
                <span className="text-[12px] text-[#71717A]">
                  {lang === 'ml' ? 'ഏറ്റവും കൂടുതൽ കറണ്ട് എടുക്കുന്നവ' : 'Find power-hungry devices'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
          </Link>
        </div>
      </div>

      {/* -- 4. Feedback Widget -------------------------------- */}
      <div className="pt-1">
        <FeedbackWidget
          context="prediction_result"
          units={prediction.projectedUnits}
          predictedBill={prediction.estimatedBill}
        />
      </div>

      {/* -- 5. Full Breakdown Bottom Sheet -------------------- */}
      <AnimatePresence>
        {showBreakdownSheet && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex flex-col justify-end"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm -z-10"
              onClick={() => setShowBreakdownSheet(false)}
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
                  setShowBreakdownSheet(false);
                }
              }}
              className="ios-sheet max-h-[85vh] overflow-y-auto p-5 pb-10 space-y-5"
            >
              {/* Grab Handle */}
              <div className="flex justify-center pb-1">
                <div className="ios-sheet-handle cursor-grab active:cursor-grabbing" />
              </div>

              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#17171C]">
                    {lang === 'ml' ? 'പൂർണ്ണ കണക്കുകൂട്ടൽ' : 'Official KSEB Tariff Breakdown'}
                  </h3>
                  <p className="text-[12px] text-[#71717A]">
                    {calc.isTelescopicApplied ? 'Telescopic LT-1A Domestic' : 'Non-Telescopic (>500u)'} · {calc.effectiveTariffVersion}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBreakdownSheet(false)}
                  className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-[#71717A] hover:text-[#17171C] active:scale-[0.96] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] rounded-full"
                  aria-label="Close tariff breakdown"
                >
                  <span className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center">
                    <X className="w-4 h-4" aria-hidden="true" />
                  </span>
                </button>
              </div>

              {/* Itemized Table */}
              <div className="bg-[#F4F4F2] rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#71717A]">{lang === 'ml' ? 'ഊർജ്ജ ചാർജ്ജ്' : 'Energy charge'}</span>
                  <span className="num-tabular font-medium text-[#17171C]">₹{energyRupees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#71717A]">{lang === 'ml' ? 'ഫിക്സഡ് ചാർജ്ജ്' : 'Fixed charge'}</span>
                  <span className="num-tabular font-medium text-[#17171C]">₹{fixedRupees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#71717A]">{lang === 'ml' ? 'വൈദ്യുതി ഡ്യൂട്ടി (10%)' : 'Electricity duty (10%)'}</span>
                  <span className="num-tabular font-medium text-[#17171C]">₹{dutyRupees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#71717A]">{lang === 'ml' ? 'ഇന്ധന സർചാർജ്ജ് (FAC)' : 'Fuel adjustment (FAC)'}</span>
                  <span className="num-tabular font-medium text-[#17171C]">₹{fuelRupees.toFixed(2)}</span>
                </div>
                {meterRupees > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#71717A]">{lang === 'ml' ? 'മീറ്റർ വാടക' : 'Meter rent'}</span>
                    <span className="num-tabular font-medium text-[#17171C]">₹{meterRupees.toFixed(2)}</span>
                  </div>
                )}
                {subsidyRupees > 0 && (
                  <div className="flex justify-between text-[13px] pt-1 text-[#0E7036]">
                    <span>{lang === 'ml' ? 'സർക്കാർ സബ്സിഡി' : 'State subsidy'}</span>
                    <span className="num-tabular font-medium">−₹{subsidyRupees.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-black/[0.08] pt-2.5 flex justify-between text-[15px] font-bold text-[#17171C]">
                  <span>{lang === 'ml' ? 'ആകെ തുക' : 'Total estimated bill'}</span>
                  <span className="num-tabular">₹{totalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Slab Table */}
              <div>
                <span className="text-[12px] font-semibold text-[#71717A] block mb-2 px-1">
                  {lang === 'ml' ? 'സ്ലാബ് വിവരണം' : 'Slab breakdown'}
                </span>
                <div className="bg-[#F4F4F2] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b border-black/[0.06] text-[#71717A]">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Slab</th>
                        <th className="py-2.5 px-3 font-semibold">Units</th>
                        <th className="py-2.5 px-3 font-semibold">Rate</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] num-tabular">
                      {calc.slabBreakdown.map((s, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-[#17171C] font-medium">{s.label}</td>
                          <td className="py-2 px-3 text-[#71717A]">{s.unitsBilled}</td>
                          <td className="py-2 px-3 text-[#71717A]">₹{s.ratePerUnit.toFixed(2)}</td>
                          <td className="py-2 px-3 text-[#17171C] font-semibold text-right">₹{s.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => setShowBreakdownSheet(false)}
                className="ios-btn-primary w-full active:scale-[0.97]"
              >
                {lang === 'ml' ? 'ശരി' : 'Done'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          prediction={prediction}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
