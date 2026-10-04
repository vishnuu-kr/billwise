'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { performBillAutopsy, BillAutopsyReport } from '@/lib/billing/autopsy';
import { storageManager } from '@/lib/storage';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import CliffCalendarAlarm from './CliffCalendarAlarm';
import { analytics } from '@/lib/observability/analytics';

interface BillAutopsyWidgetProps {
  onProtected?: () => void;
}

export default function BillAutopsyWidget({ onProtected }: BillAutopsyWidgetProps) {
  const { lang } = useLanguage();
  const [inputType, setInputType] = useState<'amount' | 'units'>('amount');
  const [inputValue, setInputValue] = useState<string>('1850');
  const [phase, setPhase] = useState<'single' | 'three'>('single');
  const [showProtectionSetup, setShowProtectionSetup] = useState<boolean>(false);

  // Parse input
  const numericValue = useMemo(() => {
    const parsed = parseFloat(inputValue);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [inputValue]);

  // Autopsy calculation
  const report: BillAutopsyReport = useMemo(() => {
    if (inputType === 'amount') {
      return performBillAutopsy({ billAmount: numericValue, phase });
    } else {
      return performBillAutopsy({ units: numericValue, phase });
    }
  }, [inputType, numericValue, phase]);

  const handleProtectNextBill = () => {
    // Save to local storage as baseline home
    storageManager.saveHome({
      id: `home_${Date.now()}`,
      tariff: 'LT-1A',
      phase,
      billingCycle: 'bi-monthly',
      connectedLoadWatts: phase === 'single' ? 3000 : 6000,
      lastReading: 10000 + report.estimatedUnits,
      lastReadingDate: new Date().toISOString(),
      lastBillAmount: report.calculatedBill.total,
      lastBillUnits: report.estimatedUnits,
      latestPrediction: {
        estimatedBill: report.calculatedBill.total,
        likelyRangeMin: Math.round(report.calculatedBill.total * 0.95),
        likelyRangeMax: Math.round(report.calculatedBill.total * 1.08),
        projectedUnits: report.estimatedUnits,
        unitsPerDay: Number((report.estimatedUnits / 60).toFixed(1)),
        daysElapsed: 1,
        daysRemaining: 59,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    storageManager.setOnboardingCompleted();
    setShowProtectionSetup(true);
    analytics.track('autopsy_protected_clicked', {
      estimatedUnits: report.estimatedUnits,
      isCliffCrossed: report.isCliffCrossed,
    });
  };

  return (
    <div className="rounded-[24px] bg-white border border-black/[0.08] p-5 sm:p-6 space-y-5 shadow-sm relative overflow-hidden">
      {/* Top Tag & Title */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#006FEE]/10 text-[#006FEE] border border-[#006FEE]/15 text-[11px] font-semibold tracking-wide uppercase">
          <Sparkles className="w-3 h-3 text-[#006FEE]" />
          <span>{lang === 'ml' ? 'ബിൽ പരിശോധന' : 'Instant Bill Autopsy'}</span>
        </div>

        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#17171C] tracking-tight leading-snug">
          {lang === 'ml'
            ? 'കഴിഞ്ഞ ബില്ലിൽ നിങ്ങൾ അധിക തുക നൽകിയോ?'
            : 'Did KSEB overcharge you on your last bill?'}
        </h2>

        <p className="text-[13px] text-[#71717A] leading-relaxed">
          {lang === 'ml'
            ? 'കഴിഞ്ഞ ബിൽ തുക നൽകി പരിശോധിക്കൂ. 240 യൂണിറ്റ് സബ്സിഡി നഷ്ടപ്പെട്ടോ എന്ന് ഉടൻ അറിയാം.'
            : 'Enter your last bill amount to see if you lost your government subsidy or crossed expensive tariff cliffs.'}
        </p>
      </div>

      {/* Input Selector & Field */}
      <div className="space-y-3 bg-[#F4F4F5]/60 p-3.5 rounded-2xl border border-black/[0.04]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#71717A] uppercase tracking-wider">
            {lang === 'ml' ? 'കഴിഞ്ഞ ബിൽ വിവരങ്ങൾ' : 'Last Bill Input'}
          </span>

          <div className="flex items-center gap-1 bg-black/[0.05] p-0.5 rounded-lg text-[11px] font-medium">
            <button
              type="button"
              onClick={() => {
                setInputType('amount');
                if (inputValue === '260') setInputValue('1850');
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                inputType === 'amount' ? 'bg-white font-bold text-[#17171C] shadow-2xs' : 'text-[#71717A]'
              }`}
            >
              {lang === 'ml' ? 'രൂപ (₹)' : 'Rupees (₹)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setInputType('units');
                if (inputValue === '1850') setInputValue('260');
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                inputType === 'units' ? 'bg-white font-bold text-[#17171C] shadow-2xs' : 'text-[#71717A]'
              }`}
            >
              {lang === 'ml' ? 'യൂണിറ്റ്' : 'Units'}
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717A] font-bold text-[18px]">
            {inputType === 'amount' ? '₹' : '⚡'}
          </div>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputType === 'amount' ? '1850' : '260'}
            className="w-full pl-8 pr-4 py-3 bg-white border border-black/[0.08] rounded-xl text-[18px] font-bold text-[#17171C] focus:outline-none focus:ring-2 focus:ring-[#006FEE]/30 focus:border-[#006FEE] transition-all num-tabular"
          />
        </div>

        {/* Phase selector toggle */}
        <div className="flex items-center justify-between text-[11px] text-[#71717A] pt-1">
          <span>{lang === 'ml' ? 'വൈദ്യുതി കണക്ഷൻ:' : 'Connection type:'}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPhase('single')}
              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                phase === 'single'
                  ? 'bg-[#006FEE]/10 text-[#006FEE] border-[#006FEE]/30 font-semibold'
                  : 'border-transparent text-[#71717A]'
              }`}
            >
              Single Phase (1-Phase)
            </button>
            <button
              type="button"
              onClick={() => setPhase('three')}
              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                phase === 'three'
                  ? 'bg-[#006FEE]/10 text-[#006FEE] border-[#006FEE]/30 font-semibold'
                  : 'border-transparent text-[#71717A]'
              }`}
            >
              Three Phase (3-Phase)
            </button>
          </div>
        </div>
      </div>

      {/* Autopsy Result Card */}
      <div
        className={`p-4 rounded-2xl border transition-all space-y-3 ${
          report.isCliffCrossed
            ? 'bg-[#E11D48]/5 border-[#E11D48]/20'
            : 'bg-[#17C964]/5 border-[#17C964]/20'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              report.isCliffCrossed
                ? 'bg-[#E11D48]/15 text-[#E11D48]'
                : 'bg-[#17C964]/15 text-[#0E7036]'
            }`}
          >
            {report.isCliffCrossed ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                report.isCliffCrossed ? 'text-[#E11D48]' : 'text-[#0E7036]'
              }`}
            >
              {report.isCliffCrossed
                ? lang === 'ml' ? 'ക്ലിഫ് പിഴ ബാധിച്ചു' : 'Cliff Penalty Incurred'
                : lang === 'ml' ? 'സബ്സിഡി സുരക്ഷിതം' : 'Subsidy Captured'}
            </span>

            <h3 className="text-[16px] font-bold text-[#17171C] leading-snug">
              {lang === 'ml' ? report.headlineMal : report.headlineEng}
            </h3>

            <p className="text-[12px] text-[#71717A] leading-relaxed">
              {lang === 'ml' ? report.verdictMal : report.verdictEng}
            </p>
          </div>
        </div>

        {/* Quantitative Metrics Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.06] text-[12px]">
          <div className="bg-white/70 p-2.5 rounded-xl border border-black/[0.04]">
            <span className="text-[11px] text-[#71717A] block">
              {lang === 'ml' ? 'കണക്കാക്കിയ യൂണിറ്റ്' : 'Estimated Units'}
            </span>
            <span className="text-[15px] font-bold text-[#17171C] num-tabular">
              {report.estimatedUnits} units
            </span>
            <span className="text-[10px] text-[#71717A] block">
              {report.isCliffCrossed ? `+${report.estimatedUnits - 240}u over 240 cliff` : `${report.safeBufferUnits}u safe buffer`}
            </span>
          </div>

          <div className="bg-white/70 p-2.5 rounded-xl border border-black/[0.04]">
            <span className="text-[11px] text-[#71717A] block">
              {report.isCliffCrossed
                ? lang === 'ml' ? 'നഷ്ടപ്പെട്ട സബ്സിഡി' : 'Lost Subsidy'
                : lang === 'ml' ? 'ലഭിച്ച സബ്സിഡി' : 'Saved Subsidy'}
            </span>
            <span
              className={`text-[15px] font-bold num-tabular ${
                report.isCliffCrossed ? 'text-[#E11D48]' : 'text-[#0E7036]'
              }`}
            >
              ₹{report.isCliffCrossed ? report.lostSubsidyAmount : report.goldenBill240.totalSubsidies}
            </span>
            <span className="text-[10px] text-[#71717A] block">
              {report.isCliffCrossed ? 'Forfeited to KSEB' : 'Government rebate'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Hook Action */}
      {!showProtectionSetup ? (
        <button
          type="button"
          onClick={handleProtectNextBill}
          className="ios-btn-primary w-full py-4 px-4 text-[15px] font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>
            {lang === 'ml'
              ? 'അടുത്ത ബില്ലിൽ സബ്സിഡി സംരക്ഷിക്കാം →'
              : 'Protect My Next Bill from Cliffs →'}
          </span>
        </button>
      ) : (
        <div className="space-y-3 animate-fade-in">
          <div className="p-3 bg-[#17C964]/10 border border-[#17C964]/20 rounded-2xl flex items-center gap-2 text-[13px] text-[#0E7036] font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0E7036]" />
            <span>
              {lang === 'ml'
                ? 'നിങ്ങളുടെ വീട് രജിസ്റ്റർ ചെയ്തു! ഇനി 42-ാം ദിവസത്തെ അലർട്ട് സെറ്റ് ചെയ്യാം:'
                : 'Home configured! Now set your Day 42 cliff check:'}
            </span>
          </div>

          <CliffCalendarAlarm
            onAlarmSet={() => {
              if (onProtected) onProtected();
            }}
          />
        </div>
      )}
    </div>
  );
}
