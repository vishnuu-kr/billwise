'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CycleComparisonDetail } from '@/types';

interface CycleComparisonCardProps {
  comparison: CycleComparisonDetail;
  prevLabel?: string;
  currLabel?: string;
}

export default function CycleComparisonCard({
  comparison,
  prevLabel,
  currLabel,
}: CycleComparisonCardProps) {
  const { lang } = useLanguage();

  const isMoreUnits = comparison.unitsDiff > 0;
  const isMoreBill = comparison.billDiff > 0;

  return (
    <div className="rounded-2xl bg-white border border-black/[0.06] p-4 sm:p-5 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
          {lang === 'ml' ? 'എന്താണ് മാറിയത്?' : 'What changed?'}
        </span>
        <span className={`text-[12px] font-bold num-tabular ${isMoreUnits ? 'text-[#B45309]' : 'text-[#0E7036]'}`}>
          {isMoreUnits ? `+${comparison.unitsDiff} units` : `${comparison.unitsDiff} units`}
        </span>
      </div>

      {/* Cycle columns */}
      <div className="grid grid-cols-2 gap-3 text-center border-b border-black/[0.05] pb-3">
        <div className="p-2.5 rounded-xl bg-black/[0.02]">
          <span className="text-[11px] text-[#71717A] block font-medium">
            {prevLabel || (lang === 'ml' ? 'കഴിഞ്ഞ സൈക്കിൾ' : 'Last cycle')}
          </span>
          <span className="font-semibold text-[#17171C] text-[15px] num-tabular block mt-0.5">
            {comparison.prevUnits} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}
          </span>
          <span className="text-[12px] text-[#71717A] num-tabular">
            ₹{comparison.prevBill.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#006FEE]/5 border border-[#006FEE]/10">
          <span className="text-[11px] text-[#006FEE] block font-medium">
            {currLabel || (lang === 'ml' ? 'ഈ സൈക്കിൾ' : 'This cycle')}
          </span>
          <span className="font-bold text-[#17171C] text-[15px] num-tabular block mt-0.5">
            {comparison.currUnits} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}
          </span>
          <span className="text-[12px] font-semibold text-[#006FEE] num-tabular">
            ₹{comparison.currBill.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Explanatory Rupee Driver Breakdown */}
      <div className="space-y-1.5 text-[12px]">
        <div className="flex justify-between items-center text-[#71717A]">
          <span>{lang === 'ml' ? 'വൈദ്യുതി ഉപയോഗം (Energy)' : 'Electricity energy'}</span>
          <span className={`font-semibold num-tabular ${comparison.energyImpact > 0 ? 'text-[#B45309]' : 'text-[#0E7036]'}`}>
            {comparison.energyImpact >= 0 ? `+₹${comparison.energyImpact}` : `−₹${Math.abs(comparison.energyImpact)}`}
          </span>
        </div>

        <div className="flex justify-between items-center text-[#71717A]">
          <span>{lang === 'ml' ? 'വൈദ്യുതി ഡ്യൂട്ടി (10%)' : 'Electricity duty (10%)'}</span>
          <span className={`font-semibold num-tabular ${comparison.dutyImpact > 0 ? 'text-[#B45309]' : 'text-[#0E7036]'}`}>
            {comparison.dutyImpact >= 0 ? `+₹${comparison.dutyImpact}` : `−₹${Math.abs(comparison.dutyImpact)}`}
          </span>
        </div>

        {comparison.subsidyImpact !== 0 && (
          <div className="flex justify-between items-center text-[#71717A]">
            <span>{lang === 'ml' ? 'സർക്കാർ സബ്സിഡി വ്യത്യാസം' : 'Subsidy impact'}</span>
            <span className={`font-semibold num-tabular ${comparison.subsidyImpact > 0 ? 'text-[#0E7036]' : 'text-[#B45309]'}`}>
              {comparison.subsidyImpact >= 0 ? `+₹${comparison.subsidyImpact}` : `−₹${Math.abs(comparison.subsidyImpact)}`}
            </span>
          </div>
        )}

        {comparison.fixedImpact !== 0 && (
          <div className="flex justify-between items-center text-[#71717A]">
            <span>{lang === 'ml' ? 'ഫിക്സഡ് ചാർജ്ജ്' : 'Fixed charge'}</span>
            <span className={`font-semibold num-tabular ${comparison.fixedImpact > 0 ? 'text-[#B45309]' : 'text-[#0E7036]'}`}>
              {comparison.fixedImpact >= 0 ? `+₹${comparison.fixedImpact}` : `−₹${Math.abs(comparison.fixedImpact)}`}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-black/[0.06] flex justify-between items-center text-[13px] font-bold text-[#17171C]">
          <span>{lang === 'ml' ? 'ആകെ വ്യത്യാസം' : 'Net change'}</span>
          <span className={`num-tabular ${isMoreBill ? 'text-[#B45309]' : 'text-[#0E7036]'}`}>
            {isMoreBill ? `+₹${comparison.billDiff}` : `−₹${Math.abs(comparison.billDiff)}`} ({isMoreBill ? `+${comparison.percentageChange}%` : `−${comparison.percentageChange}%`})
          </span>
        </div>
      </div>
    </div>
  );
}
