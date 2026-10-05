'use client';

import React, { useState, useMemo } from 'react';
import { ElectricityProvider, UniversalTariffVersion, SupplyPhase } from '@/lib/electricity/types';
import { calculateUniversalBill } from '@/lib/electricity/engine/universalEngine';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  provider: ElectricityProvider;
  tariff?: UniversalTariffVersion;
}

export default function ProviderCalculatorClient({ provider, tariff }: Props) {
  const [units, setUnits] = useState<number>(provider.billingCycles[0] === 'BIMONTHLY' ? 240 : 150);
  const [phase, setPhase] = useState<SupplyPhase>('single');
  const [connectedLoadKw, setConnectedLoadKw] = useState<number>(2);
  const [applyOptInSubsidies, setApplyOptInSubsidies] = useState<boolean>(false);
  const [isSlabsExpanded, setIsSlabsExpanded] = useState<boolean>(false);

  const result = useMemo(() => {
    if (!tariff) return null;
    return calculateUniversalBill({
      providerId: provider.id,
      units: Math.max(0, units),
      billingCycle: provider.billingCycles[0] || 'MONTHLY',
      phase,
      connectedLoadKw: Math.max(1, connectedLoadKw),
      applyOptInSubsidies,
    }, tariff);
  }, [provider, tariff, units, phase, connectedLoadKw, applyOptInSubsidies]);

  if (!tariff || !result) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center font-bold text-xl">
          ⏳
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {provider.displayName} Tariff Under Regulatory Review
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          BILLWISE never guesses tariff formulas. The official retail tariff schedule for {provider.shortName} ({provider.state}) is currently being verified against state regulatory commission orders.
        </p>
        <div className="pt-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            Coverage Status: {provider.coverageStatus}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {provider.shortName} Official Tariff Calculator
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
          {provider.billingCycles[0] === 'BIMONTHLY' ? 'Bi-monthly (60 Days)' : 'Monthly (30 Days)'}
        </span>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Consumed Electricity (Units / kWh)
          </label>
          <input
            type="number"
            min="0"
            max="10000"
            value={units}
            onChange={e => setUnits(Number(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 num-tabular"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Supply Phase
          </label>
          <select
            value={phase}
            onChange={e => setPhase(e.target.value as SupplyPhase)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="single">Single Phase (1-Phase)</option>
            <option value="three">Three Phase (3-Phase)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Connected Load (kW)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={connectedLoadKw}
            onChange={e => setConnectedLoadKw(Number(e.target.value) || 1)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 num-tabular"
          />
        </div>
      </div>

      {/* Opt-in Subsidy Toggle if applicable (e.g. Gruha Jyothi or Delhi Zero Bill) */}
      {tariff?.subsidies?.some(s => s.isOptIn) && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900">
              Apply {tariff.subsidies.find(s => s.isOptIn)?.name}?
            </span>
            <p className="text-amber-700 text-[11px]">
              {tariff.subsidies.find(s => s.isOptIn)?.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setApplyOptInSubsidies(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              applyOptInSubsidies
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {applyOptInSubsidies ? 'Applied ✓' : 'Enable'}
          </button>
        </div>
      )}

      {/* Bill Result Banner */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 space-y-2">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
              Total Payable Bill
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white num-tabular">
                ₹{result.total.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                (₹{result.effectiveCostPerUnit}/unit effective)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Daily Pace</span>
            <span className="text-base font-bold text-white num-tabular">
              {result.averageUnitsPerDay} units/day
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Itemized Components Breakdown */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Official Bill Components
        </h3>

        <div className="divide-y divide-slate-100 text-sm">
          {result.components.map(comp => (
            <div key={comp.id} className="py-2.5 flex items-center justify-between gap-4">
              <div>
                <span className={`font-semibold ${comp.isDeduction ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {comp.name}
                </span>
                {comp.details && (
                  <p className="text-xs text-slate-500">{comp.details}</p>
                )}
              </div>
              <span className={`font-bold num-tabular whitespace-nowrap ${comp.isDeduction ? 'text-emerald-600' : 'text-slate-900'}`}>
                {comp.isDeduction ? '−' : ''}₹{comp.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Slab Breakdown Accordion */}
      {result.explanation.slabBreakdown.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsSlabsExpanded(prev => !prev)}
            className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>View Tariff Slab Calculations</span>
            {isSlabsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isSlabsExpanded && (
            <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 divide-y divide-slate-200/60">
              {result.explanation.slabBreakdown.map((s, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                  <span>{s.label} ({s.units} units @ ₹{s.rate}/unit)</span>
                  <span className="font-semibold text-slate-900 num-tabular">₹{s.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
