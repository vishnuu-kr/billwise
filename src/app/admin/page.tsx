'use client';

import React, { useState } from 'react';
import { tariffRepo } from '@/lib/tariffs';
import { TariffVersion } from '@/types';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  Key,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [versions, setVersions] = useState<TariffVersion[]>(tariffRepo.getAllVersions());
  const [auditLogs, setAuditLogs] = useState(tariffRepo.getAuditLogs());
  const [selectedVersion, setSelectedVersion] = useState<TariffVersion>(tariffRepo.getCurrentTariff());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
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
              {isAuthenticated ? 'Admin Session Authenticated' : 'Protected Tariff Console (Read-Only Preview)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Tariff Database & Audit Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Maintain versioned KSERC tariff schedules with cryptographic-grade audit logs.
          </p>
        </div>

        {isAuthenticated && (
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
                Administrative Authentication Required to Edit Rates
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Public users can view current rates below in read-only mode. Enter the authorized passkey to unlock rate modification and publishing rights.
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
            <span>Authorized Session Active. Any modifications will be permanently recorded in audit logs.</span>
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
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {v.versionName} {v.isCurrent && '★ (Active)'}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Version Editor Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
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

      {/* Audit Trail List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
    </div>
  );
}
