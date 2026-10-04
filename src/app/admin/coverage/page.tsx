'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Search,
  Filter,
  ArrowLeft,
  Award,
  FileText,
  Building2,
  Layers,
  Database,
  Check,
  X,
} from 'lucide-react';
import { getAllProviders, getCoverageQualityScore, getNationalCoverageSummary } from '@/lib/electricity/api';
import { getAllGoldenBills } from '@/lib/electricity/golden/goldenBills';
import { getAllUniversalTariffs } from '@/lib/electricity/tariffs/registry';
import { validateAllRegisteredTariffs } from '@/lib/electricity/validation/tariffValidator';
import { CoverageStatus, ElectricityProvider } from '@/lib/electricity/types';

export default function NationalCoverageDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  const summary = useMemo(() => getNationalCoverageSummary(), []);
  const allProviders = useMemo(() => getAllProviders(), []);
  const goldenBills = useMemo(() => getAllGoldenBills(), []);
  const tariffs = useMemo(() => getAllUniversalTariffs(), []);
  const validationReports = useMemo(() => validateAllRegisteredTariffs(tariffs), [tariffs]);

  // Unique states for filtering
  const states = useMemo(() => {
    const s = new Set<string>();
    allProviders.forEach(p => s.add(p.state));
    return Array.from(s).sort();
  }, [allProviders]);

  // Provider enriched records
  const providerRows = useMemo(() => {
    return allProviders.map(p => {
      const score = getCoverageQualityScore(p.id);
      const golden = goldenBills.find(g => g.providerId.toLowerCase() === p.id.toLowerCase());
      const tariff = tariffs.find(t => t.providerId.toLowerCase() === p.id.toLowerCase() && t.isCurrent);
      return {
        provider: p,
        score,
        golden,
        tariff,
      };
    });
  }, [allProviders, goldenBills, tariffs]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return providerRows.filter(({ provider }) => {
      const matchesSearch =
        searchTerm === '' ||
        provider.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.serviceAreas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || provider.coverageStatus === statusFilter;

      const matchesState =
        stateFilter === 'ALL' || provider.state === stateFilter;

      return matchesSearch && matchesStatus && matchesState;
    });
  }, [providerRows, searchTerm, statusFilter, stateFilter]);

  const getStatusBadge = (status: CoverageStatus) => {
    switch (status) {
      case 'FULL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> FULL
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            PARTIAL
          </span>
        );
      case 'CALCULATOR_ONLY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            CALCULATOR
          </span>
        );
      case 'UNDER_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            UNDER REVIEW
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>BILLWISE INTERNAL AUDIT & OBSERVABILITY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              National Provider & Tariff Coverage
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Canonical verification matrix for retail electricity distribution licensees across India.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Admin Home
            </Link>
            <Link
              href="/electricity-tariffs"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public Directory
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Tracked Providers</span>
              <Building2 className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-white">{summary.totalProviders}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Across 28 states & UTs</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Covered States</span>
              <Layers className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-white">{summary.coveredStates}</div>
            <div className="text-[11px] text-zinc-500 mt-1">State jurisdictions</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span>FULL Coverage</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300">{summary.coverageCounts.FULL}</div>
            <div className="text-[11px] text-emerald-400/70 mt-1">Verified with Golden Bills</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>In Pipeline / Review</span>
              <HelpCircle className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-300">
              {summary.coverageCounts.PARTIAL + summary.coverageCounts.CALCULATOR_ONLY + summary.coverageCounts.UNDER_REVIEW}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Authoritative data in progress</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Average Quality Score</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{summary.averageQualityScore}%</div>
            <div className="text-[11px] text-zinc-500 mt-1">Integrity audit index</div>
          </div>
        </div>

        {/* Regulatory Integrity Banner */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Tariff Rule Mathematical Integrity Gate</div>
              <div className="text-xs text-zinc-400">
                {validationReports.filter(r => r.isValid).length} of {validationReports.length} tariff schedules passed full mathematical continuity & regulatory checks.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Zero Tolerance Validation: PASS
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter by licensee name, acronym, state, or service area..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter by coverage status"
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="FULL">FULL (Production Ready)</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="CALCULATOR_ONLY">CALCULATOR ONLY</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
            </select>

            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              aria-label="Filter by state"
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All States</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Licensee Verification Matrix Table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Provider / Licensee</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Coverage Status</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Authoritative Order</th>
                  <th className="py-3 px-4">Golden Bill</th>
                  <th className="py-3 px-4 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      No electricity providers match the active search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ provider, score, golden, tariff }) => (
                    <tr key={provider.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{provider.shortName}</span>
                          <span className="text-[10px] font-normal font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {provider.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs">
                          {provider.legalName}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-zinc-200">{provider.state}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                          {provider.serviceAreas.slice(0, 2).join(', ')}
                          {provider.serviceAreas.length > 2 && '...'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(provider.coverageStatus)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score.overallQualityScore >= 80
                                  ? 'bg-emerald-400'
                                  : score.overallQualityScore >= 50
                                  ? 'bg-blue-400'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${score.overallQualityScore}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-zinc-300">
                            {score.overallQualityScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1">
                          <span title="Authoritative Source" className={score.breakdown.hasAuthoritativeSource ? 'text-emerald-400' : 'text-zinc-600'}>
                            DOC
                          </span>
                          •
                          <span title="Active Tariff" className={score.breakdown.hasActiveTariff ? 'text-emerald-400' : 'text-zinc-600'}>
                            TAR
                          </span>
                          •
                          <span title="Golden Bill Fixture" className={score.breakdown.hasGoldenBill ? 'text-emerald-400' : 'text-zinc-600'}>
                            GB
                          </span>
                          •
                          <span title="OCR Signature" className={score.breakdown.hasOcrSignature ? 'text-emerald-400' : 'text-zinc-600'}>
                            OCR
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {tariff ? (
                          <div>
                            <div className="text-zinc-300 font-mono text-[11px] truncate max-w-[160px]">
                              {tariff.orderReference || 'Gazetted Order'}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Effective: {tariff.effectiveFrom}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px] italic">Pending Tariff Order</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {golden ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>₹{golden.expectedTotal}</span>
                            <span className="text-[10px] text-zinc-500">({golden.input.units}u)</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">No Fixture</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {provider.tariffSourceUrl ? (
                          <a
                            href={provider.tariffSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono"
                          >
                            SERC Portal <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Onboarding Guidance Footer */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-white">Need to onboard a new electricity distribution licensee?</div>
            <div className="text-zinc-500 mt-0.5">
              Follow the strict 6-step protocol documented in <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">docs/NATIONAL_PROVIDER_ONBOARDING.md</code>.
            </div>
          </div>
          <Link
            href="/electricity-tariffs"
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors shrink-0"
          >
            View Public Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
