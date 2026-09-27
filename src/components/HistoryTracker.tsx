'use client';

import React, { useState, useEffect } from 'react';
import { HistoryRecord } from '@/types';
import { storageManager } from '@/lib/storage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Clock,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Check,
  X,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryTracker() {
  const { lang, t } = useLanguage();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [viewMode, setViewMode] = useState<'units' | 'bill'>('units');
  const [stats, setStats] = useState(storageManager.getUsageTrendStats());
  const [accuracyStats, setAccuracyStats] = useState(storageManager.getPredictionAccuracyStats());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  
  // State for recording actual bill inline
  const [editingActualId, setEditingActualId] = useState<string | null>(null);
  const [actualInputVal, setActualInputVal] = useState<string>('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const list = storageManager.getHistory();
    setHistory(list);
    setStats(storageManager.getUsageTrendStats());
    setAccuracyStats(storageManager.getPredictionAccuracyStats());
  };

  const handleExport = () => {
    const json = storageManager.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billwise-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const success = storageManager.importData(content);
      if (success) {
        setImportStatus(lang === 'ml' ? 'വിവരങ്ങൾ വിജയകരമായി ചേർത്തു!' : 'Data imported successfully!');
        refreshData();
      } else {
        setImportStatus(lang === 'ml' ? 'ഡാറ്റ ചേർക്കാനായില്ല: ഫയൽ ഫോർമാറ്റ് പരിശോധിക്കുക.' : 'Failed to import: invalid JSON format.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    const confirmMsg = lang === 'ml'
      ? 'നിങ്ങളുടെ സേവ് ചെയ്ത മുൻകാല വിവരങ്ങളും ബജറ്റും പൂർണ്ണമായി ഒഴിവാക്കണോ?'
      : 'Are you sure you want to clear your local history and saved budget?';
    if (confirm(confirmMsg)) {
      storageManager.clearAllData();
      refreshData();
    }
  };

  const handleLoadSample = () => {
    storageManager.loadSampleData();
    refreshData();
  };

  const handleSaveActualBill = (recordId: string) => {
    const parsed = parseFloat(actualInputVal);
    if (!isNaN(parsed) && parsed >= 0) {
      storageManager.recordActualBill(recordId, Math.round(parsed));
      setEditingActualId(null);
      setActualInputVal('');
      refreshData();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Title & Import/Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {lang === 'ml' ? 'ഉപയോഗ ചരിത്രം' : 'Your History'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            {lang === 'ml' ? 'വൈദ്യുതി ഉപയോഗം' : 'Your Electricity'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              title="Export JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{lang === 'ml' ? 'ഡൗൺലോഡ്' : 'Export'}</span>
            </button>
          )}

          <label className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            <span>{lang === 'ml' ? 'അപ്‌ലോഡ്' : 'Import'}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs text-sky-800">
          {importStatus}
        </div>
      )}

      {/* Empty State when no history exists */}
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-2xs">
            <Calendar className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'ml' ? 'ചരിത്ര വിവരങ്ങൾ ഇതുവരെ ചേർത്തിട്ടില്ല' : 'No saved readings yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {lang === 'ml'
                ? 'നിങ്ങളുടെ റീഡിംഗുകളും ബിൽ പ്രവചനങ്ങളും നിങ്ങളുടെ ഫോണിൽ മാത്രം സുരക്ഷിതമായി സൂക്ഷിക്കപ്പെടും.'
                : 'Your readings, bill predictions, and targets stay securely stored on this device in private local storage.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/predict"
              className="w-full sm:w-auto rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
            >
              {lang === 'ml' ? 'റീഡിംഗ് നൽകി പ്രവചിക്കാം' : 'Predict Current Bill'}
            </Link>

            <button
              type="button"
              onClick={handleLoadSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>{lang === 'ml' ? 'ഡെമോ വിവരങ്ങൾ കാണാം' : 'Load Sample History'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Prediction Accuracy Calibration Banner */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sky-950">
              <Target className="h-4 w-4 text-sky-600" />
              <span>{lang === 'ml' ? 'കൃത്യതാ കാലിബ്രേഷൻ' : 'Prediction Accuracy Calibration'}</span>
            </div>
            <p className="text-sky-900 leading-relaxed">
              {accuracyStats.accuracyStatement}
            </p>
            {accuracyStats.totalEvaluated === 0 && (
              <p className="text-[11px] text-sky-700 pt-0.5">
                {lang === 'ml'
                  ? 'യഥാർത്ഥ KSEB ബിൽ വരുമ്പോൾ താഴെ "യഥാർത്ഥ ബിൽ രേഖപ്പെടുത്തുക" ക്ലിക്ക് ചെയ്ത് തുക നൽകുക.'
                  : 'Click "Record actual bill" below when your KSEB bill arrives to compare and calibrate.'}
              </p>
            )}
          </div>

          {/* Hero Stat: Average Units / Cycle */}
          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                {t.averageUsageHero}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 num-tabular">
                  {stats.averageUnits}
                </span>
                <span className="text-xs font-semibold text-slate-500">{t.units}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">
                {lang === 'ml' ? 'ശരാശരി ബിൽ' : 'Average Bill'}
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-sky-700 num-tabular">
                ₹{stats.averageBill.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Primary Trend Insight Statement */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
            <TrendingUp className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              {stats.trendStatement}
            </p>
          </div>

          {/* Chart View Toggle (Units vs Bill) */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 text-sm">
              {lang === 'ml'
                ? (viewMode === 'units' ? 'ഉപയോഗ പ്രവണത' : 'ബിൽ തുക പ്രവണത')
                : (viewMode === 'units' ? 'Consumption Trend' : 'Bill Amount Trend')}
            </h4>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
              <button
                onClick={() => setViewMode('units')}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  viewMode === 'units' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.units}
              </button>
              <button
                onClick={() => setViewMode('bill')}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  viewMode === 'bill' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ml' ? 'രൂപ (₹)' : 'Rupees (₹)'}
              </button>
            </div>
          </div>

          {/* Minimal Visual Bar Chart */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 pt-6">
            <div className="flex items-end justify-around gap-2 h-44 border-b border-slate-200 pb-2">
              {history.slice(0, 6).reverse().map(record => {
                const val = viewMode === 'units' ? record.consumedUnits : (record.actualBill ?? record.predictedBill);
                const maxVal = viewMode === 'units' ? 400 : 2500;
                const barHeightPct = Math.min(100, Math.max(12, Math.round((val / maxVal) * 100)));

                return (
                  <div key={record.id} className="flex flex-col items-center gap-1.5 flex-1 max-w-[50px] group">
                    <span className="text-[10px] font-mono font-bold text-slate-700 num-tabular opacity-90 group-hover:scale-110 transition-transform">
                      {viewMode === 'units' ? `${val}u` : `₹${val}`}
                    </span>
                    <div className="w-full rounded-t-lg bg-sky-200 group-hover:bg-sky-600 transition-colors relative" style={{ height: `${barHeightPct}%` }}>
                      <div className="w-full h-full rounded-t-lg bg-sky-600 opacity-80" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {record.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Records List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>{lang === 'ml' ? 'ബില്ലിംഗ് വിവരങ്ങൾ' : 'Billing Records'}</span>
              <span>{history.length} {lang === 'ml' ? 'തവണകൾ' : 'cycles'}</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden">
              {history.map(record => (
                <div key={record.id} className="p-3.5 space-y-2 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {record.dateLabel}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {record.meterReading
                            ? `${lang === 'ml' ? 'റീഡിംഗ്:' : 'Reading:'} ${record.meterReading.toLocaleString()}`
                            : record.notes}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-slate-900 num-tabular">
                        {record.consumedUnits} {t.units}
                      </div>
                      <div className="font-mono text-xs font-medium text-slate-500 num-tabular">
                        Est: ₹{record.predictedBill.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Actual Bill Verification Sub-Row */}
                  <div className="pl-11 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/60 text-xs">
                    {record.actualBill !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Actual: ₹{record.actualBill.toLocaleString('en-IN')}</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          (Δ ₹{Math.abs(record.actualBill - record.predictedBill)})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActualId(record.id);
                            setActualInputVal(String(record.actualBill));
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                        >
                          edit
                        </button>
                      </div>
                    ) : editingActualId === record.id ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="text-[11px] text-slate-600">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="Actual bill amount"
                          value={actualInputVal}
                          onChange={e => setActualInputVal(e.target.value)}
                          className="w-28 rounded-lg border border-sky-400 px-2 py-1 text-xs font-mono font-bold focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveActualBill(record.id)}
                          className="rounded-lg bg-sky-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-sky-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActualId(null);
                            setActualInputVal('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingActualId(record.id);
                          setActualInputVal('');
                        }}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                      >
                        + {lang === 'ml' ? 'യഥാർത്ഥ KSEB ബിൽ രേഖപ്പെടുത്തുക' : 'Record actual KSEB bill'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/predict"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 touch-target"
        >
          <Plus className="h-4 w-4" />
          <span>{lang === 'ml' ? 'പുതിയ റീഡിംഗ് നൽകാം' : 'Add new reading'}</span>
        </Link>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[11px] text-slate-400 hover:text-red-500 transition-colors touch-target py-2 px-1"
          >
            {lang === 'ml' ? 'ചരിത്രം ഒഴിവാക്കുക' : 'Clear local history'}
          </button>
        )}
      </div>
    </div>
  );
}
