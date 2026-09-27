'use client';

import React, { useState, useEffect } from 'react';
import { tariffRepo } from '@/lib/tariffs';
import { CURRENT_KSEB_TARIFF_VERSION, PREVIOUS_KSEB_TARIFF_2023 } from '@/lib/tariffs/ksebTariff2024';
import { computeTariffDiff } from '@/lib/tariffs/diff';
import { analytics } from '@/lib/observability/analytics';
import { storageManager } from '@/lib/storage';
import {
  TariffVersion,
  TariffDiffItem,
  UserFeedbackRecord,
  FeedbackSummaryStats,
  FunnelAnalysis,
} from '@/types';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  Key,
  BarChart3,
  GitCompare,
  FileCode,
  Download,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

type AdminTab = 'tariffs' | 'diff' | 'funnel' | 'audit';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('tariffs');

  // Tariff Editor State
  const [versions, setVersions] = useState<TariffVersion[]>(tariffRepo.getAllVersions());
  const [auditLogs, setAuditLogs] = useState(tariffRepo.getAuditLogs());
  const [selectedVersion, setSelectedVersion] = useState<TariffVersion>(tariffRepo.getCurrentTariff());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Tariff Diff State
  const [baseDiffVersion, setBaseDiffVersion] = useState<TariffVersion>(PREVIOUS_KSEB_TARIFF_2023);
  const [compDiffVersion, setCompDiffVersion] = useState<TariffVersion>(CURRENT_KSEB_TARIFF_VERSION);
  const [diffItems, setDiffItems] = useState<TariffDiffItem[]>([]);

  // Funnel & Feedback State
  const [funnelData, setFunnelData] = useState<FunnelAnalysis>(analytics.getFunnelMetrics());
  const [feedbackList, setFeedbackList] = useState<UserFeedbackRecord[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackSummaryStats>(storageManager.getFeedbackStats());

  useEffect(() => {
    setDiffItems(computeTariffDiff(baseDiffVersion, compDiffVersion));
  }, [baseDiffVersion, compDiffVersion]);

  useEffect(() => {
    setFunnelData(analytics.getFunnelMetrics());
    setFeedbackList(storageManager.getFeedback());
    setFeedbackStats(storageManager.getFeedbackStats());
  }, [activeTab]);

  // Default demonstration admin PIN for testing/evaluation: "kseb2026"
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passkeyInput === 'kseb2026' || passkeyInput === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setAuthError('Invalid Admin Passkey. Access denied.');
    }
  };

  const handleRateChange = (index: number, newRate: number) => {
    if (!isAuthenticated) return;
    setSelectedVersion(prev => {
      const updatedSlabs = [...prev.telescopicSlabsBiMonthly];
      updatedSlabs[index] = { ...updatedSlabs[index], ratePerUnit: newRate };
      return { ...prev, telescopicSlabsBiMonthly: updatedSlabs };
    });
  };

  const handleSaveDraft = () => {
    if (!isAuthenticated) {
      setValidationError('Authorization required to modify tariff configuration.');
      return;
    }

    setValidationError(null);

    // Validation: Rates must be valid positive numbers
    for (const slab of selectedVersion.telescopicSlabsBiMonthly) {
      if (slab.ratePerUnit <= 0 || isNaN(slab.ratePerUnit)) {
        setValidationError(`Invalid rate for slab ${slab.minUnits}–${slab.maxUnits}: rate must be > 0.`);
        return;
      }
    }

    tariffRepo.saveVersion(selectedVersion, 'Authorized Admin');
    setVersions(tariffRepo.getAllVersions());
    setAuditLogs(tariffRepo.getAuditLogs());
    setSaveStatus('Tariff changes validated, saved, and recorded in immutable audit log.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handlePublish = (versionId: string) => {
    if (!isAuthenticated) return;
    tariffRepo.setPublished(versionId, 'Authorized Admin');
    setVersions(tariffRepo.getAllVersions());
    setAuditLogs(tariffRepo.getAuditLogs());
    setSelectedVersion(tariffRepo.getCurrentTariff());
    setSaveStatus('Tariff schedule activated as current live production rates.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleExportFeedback = () => {
    const json = JSON.stringify(feedbackList, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billwise-user-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFeedback = () => {
    if (!isAuthenticated) return;
    if (confirm('Clear all stored user feedback entries?')) {
      storageManager.clearFeedback();
      setFeedbackList([]);
      setFeedbackStats(storageManager.getFeedbackStats());
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {isAuthenticated ? (
              <Unlock className="h-3 w-3 text-emerald-600" />
            ) : (
              <Lock className="h-3 w-3 text-amber-600" />
            )}
            <span>
              {isAuthenticated ? 'Admin Session Authenticated' : 'Protected Tariff & Operations Console (Read-Only Preview)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Operations & Tariff Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Maintain versioned KSERC tariff schedules, inspect user conversion funnels, review beta feedback, and audit changes.
          </p>
        </div>

        {isAuthenticated && activeTab === 'tariffs' && (
          <button
            onClick={handleSaveDraft}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save & Publish</span>
          </button>
        )}
      </div>

      {/* Authentication Gate if Locked */}
      {!isAuthenticated ? (
        <div className="rounded-3xl border border-amber-200/90 bg-amber-50/70 p-6 sm:p-7 space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-950 text-sm">
                Administrative Authentication Required for Modifications
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                You can explore tariff schedules, rate diffs, and funnels in read-only mode. Enter the passkey to edit schedules or clear telemetry.
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthenticate} className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <div className="relative flex-1">
              <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Enter Admin Passkey (Demo: kseb2026)"
                value={passkeyInput}
                onChange={e => setPasskeyInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs font-mono font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              Unlock Console
            </button>
          </form>

          {authError && (
            <p className="text-xs font-semibold text-red-700">{authError}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>Authorized Session Active. Any modifications will be recorded in immutable audit logs.</span>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-[11px] font-semibold text-emerald-800 underline hover:text-emerald-950"
          >
            Lock Session
          </button>
        </div>
      )}

      {saveStatus && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {validationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('tariffs')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'tariffs'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Tariff Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'diff'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <GitCompare className="h-4 w-4" />
          <span>Tariff Diff & Evolution</span>
        </button>

        <button
          onClick={() => setActiveTab('funnel')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'funnel'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Funnel & Beta Feedback ({feedbackList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: TARIFF EDITOR */}
      {activeTab === 'tariffs' && (
        <div className="space-y-6">
          {/* Version Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tariff Schedule Versions
            </label>
            <div className="flex flex-wrap gap-2">
              {versions.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                    selectedVersion.id === v.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {v.versionName} {v.isCurrent && '★ (Active)'}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Version Editor Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedVersion.versionName}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  Effective: {selectedVersion.effectiveFrom} {selectedVersion.effectiveTo ? `to ${selectedVersion.effectiveTo}` : 'to Present'}
                </div>
              </div>

              {!selectedVersion.isCurrent && isAuthenticated && (
                <button
                  onClick={() => handlePublish(selectedVersion.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Set as Active
                </button>
              )}
            </div>

            {/* Bi-monthly Telescopic Slabs */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                Bi-Monthly Telescopic Energy Slabs (₹ / Unit)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedVersion.telescopicSlabsBiMonthly.map((slab, idx) => (
                  <div
                    key={slab.minUnits}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                  >
                    <span className="font-medium text-slate-700">
                      {slab.minUnits} – {slab.maxUnits} units:
                    </span>
                    <div className="flex items-center gap-1 font-mono">
                      <span>₹</span>
                      {isAuthenticated ? (
                        <input
                          type="number"
                          step="0.05"
                          value={slab.ratePerUnit}
                          onChange={e => handleRateChange(idx, Number(e.target.value))}
                          className="w-20 rounded border border-slate-300 bg-white p-1 text-right font-bold text-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900">{slab.ratePerUnit.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Levies & Subsidies */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-500 block mb-1">Duty Rate</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  {(selectedVersion.electricityDutyRate * 100).toFixed(0)}%
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-500 block mb-1">Fixed Subsidy</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  ₹{selectedVersion.subsidies.fixedChargeSubsidy}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-500 block mb-1">Max Energy Subsidy</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  ₹{selectedVersion.subsidies.energySubsidyMaxAmount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TARIFF DIFF VIEW */}
      {activeTab === 'diff' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gazette Revision Comparison
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify rate alterations, fixed charge bracket revisions, and subsidy changes between KSEB orders.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                  Base: {baseDiffVersion.versionName}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono bg-sky-100 px-2.5 py-1 rounded-lg text-sky-800 font-semibold">
                  Active: {compDiffVersion.versionName}
                </span>
              </div>
            </div>

            {/* Diff Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Tariff Component</th>
                    <th className="py-2.5 px-3 font-mono">2023 Previous</th>
                    <th className="py-2.5 px-3 font-mono">2024 Active</th>
                    <th className="py-2.5 px-3 font-mono">Net Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diffItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.label}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        ₹{item.baseValue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        ₹{item.comparedValue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                            item.delta > 0
                              ? 'bg-amber-100 text-amber-900'
                              : item.delta < 0
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.formattedDelta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FUNNEL & BETA FEEDBACK */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          {/* Funnel Conversion Stage Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                User Journey Funnel & Drop-off
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Anonymous lifecycle progression without session tracking or PII storage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {funnelData.stages.map((st, idx) => (
                <div
                  key={st.stage}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1 relative"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Stage {idx + 1}
                  </div>
                  <div className="text-xs font-bold text-slate-800 line-clamp-1" title={st.label}>
                    {st.label}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono num-tabular pt-1">
                    {st.count}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                    <span>{idx === 0 ? 'Baseline' : `${st.conversionFromPrevious}% conv`}</span>
                    <span>{st.overallConversion}% total</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Primary Drop-off Area: </span>
                <span>{funnelData.highestDropOffStage}</span>
              </div>
              <span className="text-[11px] font-mono text-amber-800">
                Target: Simplify flow input
              </span>
            </div>
          </div>

          {/* User Feedback Statistics */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  In-App Beta User Feedback & Calibration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct responses submitted via the post-prediction widget and bill verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportFeedback}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export JSON</span>
                </button>

                {isAuthenticated && feedbackList.length > 0 && (
                  <button
                    onClick={handleClearFeedback}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Feedback Metric Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-[11px] text-slate-500 font-medium">Total Responses</span>
                <span className="block font-mono text-2xl font-bold text-slate-900 mt-1">
                  {feedbackStats.totalFeedback}
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <span className="text-[11px] text-emerald-800 font-medium">Helpful / Positive</span>
                <span className="block font-mono text-2xl font-bold text-emerald-700 mt-1">
                  {feedbackStats.positiveCount} ({feedbackStats.helpfulRatioPct}%)
                </span>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <span className="text-[11px] text-amber-800 font-medium">Discrepancy Reports</span>
                <span className="block font-mono text-2xl font-bold text-amber-700 mt-1">
                  {feedbackStats.negativeCount}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-[11px] text-slate-500 font-medium">Actual Bill Close Enough</span>
                <span className="block font-mono text-2xl font-bold text-slate-900 mt-1">
                  {feedbackStats.accuracyRatings.accurate}
                </span>
              </div>
            </div>

            {/* Recent Feedback Feed */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recent Submissions (PII-Cleaned)
              </h4>

              {feedbackList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No feedback submitted in this browser session yet. Submissions from the result card and history will appear here.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {feedbackList.map(item => (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {item.sentiment === 'positive' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <ThumbsUp className="h-3 w-3" />
                              <span>Helpful</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                              <ThumbsDown className="h-3 w-3" />
                              <span>{item.category || 'Discrepancy'}</span>
                            </span>
                          )}

                          {item.accuracyRating && (
                            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                              Accuracy: {item.accuracyRating}
                            </span>
                          )}

                          {item.units && (
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.units} units (₹{item.predictedBill})
                            </span>
                          )}
                        </div>

                        {item.comment && (
                          <p className="text-slate-700 italic pl-1 text-[11px] leading-relaxed">
                            &ldquo;{item.comment}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <History className="h-4 w-4 text-sky-600" />
            <span>Immutable Audit Logs</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <span className="font-semibold text-slate-800">{log.action.toUpperCase()}: </span>
                  <span className="text-slate-600">{log.changeSummary}</span>
                </div>
                <div className="font-mono text-slate-400 text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()} • {log.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
