'use client';

import React, { useState } from 'react';
import { tariffRepo } from '@/lib/tariffs';
import { TariffVersion } from '@/types';
import {
  ShieldAlert,
  Save,
  CheckCircle2,
  Clock,
  Layers,
  History,
  Lock,
  Plus,
} from 'lucide-react';

export default function AdminPage() {
  const [versions, setVersions] = useState<TariffVersion[]>(tariffRepo.getAllVersions());
  const [auditLogs, setAuditLogs] = useState(tariffRepo.getAuditLogs());
  const [selectedVersion, setSelectedVersion] = useState<TariffVersion>(tariffRepo.getCurrentTariff());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleRateChange = (index: number, newRate: number) => {
    setSelectedVersion(prev => {
      const updatedSlabs = [...prev.telescopicSlabsBiMonthly];
      updatedSlabs[index] = { ...updatedSlabs[index], ratePerUnit: newRate };
      return { ...prev, telescopicSlabsBiMonthly: updatedSlabs };
    });
  };

  const handleSaveDraft = () => {
    tariffRepo.saveVersion(selectedVersion, 'Admin');
    setVersions(tariffRepo.getAllVersions());
    setAuditLogs(tariffRepo.getAuditLogs());
    setSaveStatus('Tariff changes saved and logged in audit trail.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handlePublish = (versionId: string) => {
    tariffRepo.setPublished(versionId, 'Admin');
    setVersions(tariffRepo.getAllVersions());
    setAuditLogs(tariffRepo.getAuditLogs());
    setSelectedVersion(tariffRepo.getCurrentTariff());
    setSaveStatus('Tariff version published as the active schedule.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Lock className="h-3 w-3 text-slate-500" />
            <span>Admin Interface • Private Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Tariff Database & Audit Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage versioned KSERC tariff orders with immutable audit logs.
          </p>
        </div>

        <button
          onClick={handleSaveDraft}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveStatus && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Version Selector Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Tariff Versions
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

          {!selectedVersion.isCurrent && (
            <button
              onClick={() => handlePublish(selectedVersion.id)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Set as Active
            </button>
          )}
        </div>

        {/* Bi-monthly Telescopic Slabs Editor */}
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
                  <input
                    type="number"
                    step="0.05"
                    value={slab.ratePerUnit}
                    onChange={e => handleRateChange(idx, Number(e.target.value))}
                    className="w-20 rounded border border-slate-300 bg-white p-1 text-right font-bold text-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Levies & Subsidies Settings */}
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
