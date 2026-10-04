'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getAllUniversalTariffs } from '@/lib/electricity/tariffs/registry';
import { getProviderById } from '@/lib/electricity/providers';
import { REGULATOR_REGISTRY } from '@/lib/electricity/regulators';
import { BookOpen, ExternalLink, ShieldCheck, ArrowRight, Building } from 'lucide-react';

export default function ElectricityTariffsPage() {
  const tariffs = getAllUniversalTariffs();
  const [selectedTariffId, setSelectedTariffId] = useState<string>(tariffs[0]?.id || '');

  const activeTariff = tariffs.find(t => t.id === selectedTariffId) || tariffs[0];
  const provider = activeTariff ? getProviderById(activeTariff.providerId) : undefined;
  const regulator = activeTariff ? REGULATOR_REGISTRY[activeTariff.regulatorId] : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Regulatory Tariff Schedules</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          National Electricity Tariffs
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Electricity tariffs across India are statutory schedules determined by State Electricity Regulatory Commissions (SERCs) and Joint Commissions (JERCs). Slabs, standing charges, and duties vary by state jurisdiction.
        </p>
      </div>

      {/* Tariff Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {tariffs.map(t => {
          const prov = getProviderById(t.providerId);
          const isSelected = t.id === selectedTariffId;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTariffId(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{prov?.shortName || t.providerId.toUpperCase()}</span>
              <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20' : 'bg-black/10'}`}>
                {t.categoryCode}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tariff Specification Sheet */}
      {activeTariff && provider && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Metadata Card */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
                {provider.state} · {regulator?.shortName || 'SERC'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {activeTariff.versionName}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Category: <strong className="text-slate-800">{activeTariff.categoryCode} ({activeTariff.categoryName})</strong> · Billing: <strong className="text-slate-800">{activeTariff.billingCycle}</strong>
              </p>
            </div>

            <Link
              href={`/providers/${provider.id}`}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>Open {provider.shortName} Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Slabs Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeTariff.energySlabType === 'MIXED' ? 'Telescopic & Non-Telescopic Energy Slabs' : 'Energy Slabs'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Slab Range</th>
                    <th className="py-2.5 px-3">Units Span</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Rate (₹ / Unit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeTariff.telescopicSlabs.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.label || `${s.minUnits}–${s.maxUnits ?? 'Above'}`}</td>
                      <td className="py-2.5 px-3 text-slate-500">{s.maxUnits !== null ? `${s.maxUnits - s.minUnits + 1} units` : 'Remaining units'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 num-tabular">₹{s.ratePerUnit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fixed Charges & Duties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Fixed & Standing Charges
              </span>
              <p className="text-xs text-slate-700">
                {activeTariff.fixedChargeRules[0]?.basis === 'PER_KW'
                  ? `₹${activeTariff.fixedChargeRules[0].amount} / kW per month`
                  : `₹${activeTariff.fixedChargeRules[0]?.amount || 0} base fixed charge per cycle`}
              </p>
              {activeTariff.wheelingChargePerUnit && (
                <p className="text-xs text-slate-600">
                  Wheeling Charge: <strong>₹{activeTariff.wheelingChargePerUnit}/unit</strong>
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Statutory Duty & Taxes
              </span>
              <p className="text-xs text-slate-700">
                {activeTariff.dutyRule.label}
              </p>
              {activeTariff.variableAdjustment && (
                <p className="text-xs text-slate-600">
                  {activeTariff.variableAdjustment.name}: <strong>₹{activeTariff.variableAdjustment.ratePerUnit}/unit</strong>
                </p>
              )}
            </div>
          </div>

          {/* Official Source & Verification */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-1.5 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Authoritative Regulatory Source</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Order: {activeTariff.orderReference} (Effective from {activeTariff.effectiveFrom}). Last verified on {activeTariff.verifiedAt}.
            </p>
            <a
              href={activeTariff.sourceDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-amber-900 hover:text-amber-700 inline-flex items-center gap-1 mt-1"
            >
              <span>View Regulatory Document</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
