'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ElectricityProvider, CoverageStatus } from '@/lib/electricity/types';
import { getAllProviders, searchProviders, getProvidersByState } from '@/lib/electricity/providers';

interface ProviderSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: ElectricityProvider) => void;
  selectedProviderId?: string;
}

const POPULAR_STATES = [
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
  'Punjab',
];

export const ProviderSelectModal: React.FC<ProviderSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectProvider,
  selectedProviderId,
}) => {
  const [query, setQuery] = useState('');
  const [activeState, setActiveState] = useState('All');
  const [showRequestSubmitted, setShowRequestSubmitted] = useState(false);
  const [requestedName, setRequestedName] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredProviders = useMemo(() => {
    let list: ElectricityProvider[];
    if (query.trim()) {
      list = searchProviders(query);
      if (activeState !== 'All') {
        list = list.filter(p => p.state.toLowerCase() === activeState.toLowerCase());
      }
    } else if (activeState !== 'All') {
      list = getProvidersByState(activeState);
    } else {
      list = getAllProviders();
    }
    return list;
  }, [query, activeState]);

  if (!isOpen) return null;

  const handleSelect = (provider: ElectricityProvider) => {
    onSelectProvider(provider);
    onClose();
  };

  const handleRequestProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedName.trim()) return;
    setShowRequestSubmitted(true);
    setTimeout(() => {
      setShowRequestSubmitted(false);
      setRequestedName('');
    }, 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 id="provider-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
              Select Electricity Provider
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tariffs and calculations adapt to your state DISCOM or licensee
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search provider, city, or state (e.g. BESCOM, Mumbai, Kerala)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all min-h-[44px]"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* State Pills */}
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {POPULAR_STATES.map(st => (
              <button
                key={st}
                onClick={() => setActiveState(st)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
                  activeState === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Provider List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-slate-100">
          {filteredProviders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-700">No matching providers found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                We are rapidly adding distribution licensees across India. Request coverage below.
              </p>
            </div>
          ) : (
            filteredProviders.map(provider => {
              const isSelected = provider.id === selectedProviderId;
              return (
                <button
                  key={provider.id}
                  onClick={() => handleSelect(provider)}
                  className={`w-full text-left py-3.5 px-3 rounded-xl transition-all flex items-start justify-between gap-3 group ${
                    isSelected
                      ? 'bg-amber-50/80 border border-amber-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                        {provider.displayName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600">
                        {provider.state}
                      </span>
                      {provider.coverageStatus === 'FULL' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          FULL SUPPORT
                        </span>
                      )}
                      {provider.coverageStatus === 'PARTIAL' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                          VERIFIED RATES
                        </span>
                      )}
                      {provider.coverageStatus === 'CALCULATOR_ONLY' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                          CALCULATOR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-1">
                      {provider.legalName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Areas: {provider.serviceAreas.slice(0, 3).join(', ')}
                      {provider.serviceAreas.length > 3 && ` +${provider.serviceAreas.length - 3} more`}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-amber-600 text-sm font-bold flex items-center pt-1">
                      ✓ Active
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer: Request Provider */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          {showRequestSubmitted ? (
            <span className="text-emerald-600 font-medium">
              ✓ Request submitted! Our regulatory team will review this provider.
            </span>
          ) : (
            <form onSubmit={handleRequestProvider} className="w-full flex items-center gap-2">
              <span className="text-slate-600 whitespace-nowrap font-medium">Missing provider?</span>
              <input
                type="text"
                value={requestedName}
                onChange={e => setRequestedName(e.target.value)}
                placeholder="Provider or town name..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors whitespace-nowrap min-h-[32px]"
              >
                Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
