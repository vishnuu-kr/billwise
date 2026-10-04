'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getAllProviders, searchProviders, getProvidersByState, getNationalCoverageStats } from '@/lib/electricity/providers';
import { REGULATOR_REGISTRY } from '@/lib/electricity/regulators';
import { CoverageStatus, ElectricityProvider } from '@/lib/electricity/types';
import { Search, MapPin, Building, ExternalLink, ShieldCheck, ChevronRight } from 'lucide-react';

const STATES = [
  'All',
  'Kerala',
  'Karnataka',
  'Maharashtra',
  'Delhi',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Gujarat',
  'Rajasthan',
  'Punjab',
  'Haryana',
  'Andhra Pradesh',
];

export default function ProvidersDirectoryPage() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const stats = useMemo(() => getNationalCoverageStats(), []);

  const providers = useMemo(() => {
    let list: ElectricityProvider[];
    if (query.trim()) {
      list = searchProviders(query);
      if (selectedState !== 'All') {
        list = list.filter(p => p.state.toLowerCase() === selectedState.toLowerCase());
      }
    } else if (selectedState !== 'All') {
      list = getProvidersByState(selectedState);
    } else {
      list = getAllProviders();
    }

    return list.sort((a, b) => {
      const order: Record<CoverageStatus, number> = {
        FULL: 1,
        PARTIAL: 2,
        CALCULATOR_ONLY: 3,
        PARSER_ONLY: 4,
        DETECTION_ONLY: 5,
        UNDER_REVIEW: 6,
        UNSUPPORTED: 7,
      };
      return order[a.coverageStatus] - order[b.coverageStatus];
    });
  }, [query, selectedState]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>National Coverage Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Supported Electricity Providers
        </h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
          BillWise connects directly to official state regulator orders (SERCs/JERCs) to model retail electricity distribution licensees across India.
        </p>

        {/* Coverage Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium block">Covered Providers</span>
            <span className="text-2xl font-bold text-slate-900 num-tabular">{stats.totalProviders}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium block">States & UTs</span>
            <span className="text-2xl font-bold text-slate-900 num-tabular">{stats.coveredStates}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium block">Full Support</span>
            <span className="text-2xl font-bold text-emerald-600 num-tabular">{stats.fullCoverageCount}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium block">Verified Rates</span>
            <span className="text-2xl font-bold text-amber-600 num-tabular">{stats.partialCoverageCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search provider, city, or state (e.g. BESCOM, Mumbai, Kerala)..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition-all"
          />
        </div>

        {/* State filter pills */}
        <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
          {STATES.map(st => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
                selectedState === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Providers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(provider => {
          const regulator = REGULATOR_REGISTRY[provider.regulatorId];
          return (
            <Link
              key={provider.id}
              href={`/providers/${provider.id}`}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-amber-400/80 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                        {provider.displayName}
                      </span>
                      {provider.coverageStatus === 'FULL' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          FULL SUPPORT
                        </span>
                      )}
                      {provider.coverageStatus === 'PARTIAL' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          VERIFIED RATES
                        </span>
                      )}
                      {provider.coverageStatus === 'CALCULATOR_ONLY' && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          CALCULATOR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {provider.legalName}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{provider.state} · {provider.serviceAreas.slice(0, 2).join(', ')}</span>
                  </div>
                  {regulator && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Regulator: {regulator.shortName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">
                <span>View Tariff & Calculator</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
