'use client';

import React, { useState, useEffect } from 'react';
import { HistoryRecord } from '@/types';
import { storageManager } from '@/lib/storage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Plus,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { HoldToDeleteButton } from '@/components/ui/HoldToDeleteButton';
import { UndoToast } from '@/components/ui/UndoToast';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { Range } from '@/components/ui/DateRangePicker';
import { short } from '@/components/ui/DateRangePicker';
import { BarChart } from '@/components/ui/BarChart';
import CycleComparisonCard from '@/components/CycleComparisonCard';

const DateRangePicker = dynamic(
  () => import('@/components/ui/DateRangePicker').then((m) => m.DateRangePicker),
  { ssr: false }
);

export default function HistoryTracker() {
  const { lang } = useLanguage();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [hasSavedHome, setHasSavedHome] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'units' | 'bill'>('units');
  const [stats, setStats] = useState(storageManager.getUsageTrendStats());
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<Range | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

  const [editingActualId, setEditingActualId] = useState<string | null>(null);
  const [actualInputVal, setActualInputVal] = useState<string>('');

  const refreshData = () => {
    const list = storageManager.getHistory();
    setHistory(list);
    setHasSavedHome(storageManager.hasSavedHome());
    setStats(storageManager.getUsageTrendStats());
    if (list.length > 0) {
      setSelectedPointIndex(list.length - 1);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    refreshData();
  }, []);

  const handleSaveActualBill = (recordId: string) => {
    const num = parseFloat(actualInputVal);
    if (!isNaN(num) && num > 0) {
      storageManager.recordActualBill(recordId, num);
      setEditingActualId(null);
      setActualInputVal('');
      refreshData();
    }
  };

  const [showUndoToast, setShowUndoToast] = useState(false);
  const deletedBackupRef = React.useRef<HistoryRecord[]>([]);

  const handleClear = () => {
    deletedBackupRef.current = storageManager.getHistory();
    storageManager.clearAllData();
    refreshData();
    setShowUndoToast(true);
  };

  const handleUndo = () => {
    if (deletedBackupRef.current.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('billwise_history_v1', JSON.stringify(deletedBackupRef.current));
      }
      refreshData();
      setShowUndoToast(false);
    }
  };

  const handleLoadSample = () => {
    storageManager.loadSampleData();
    refreshData();
  };

  const filteredHistory = React.useMemo(() => {
    const base = !dateRange
      ? history
      : history.filter((r) => {
          const d = r.timestamp.slice(0, 10);
          return d >= dateRange.start && d <= dateRange.end;
        });
    return [...base].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, dateRange]);

  // EMPTY STATE (Point 42: Clean, calm, human)
  if (history.length === 0) {
    return (
      <div className="w-full space-y-4 pt-1">
        <div className="rounded-2xl bg-white border border-black/[0.06] p-6 sm:p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE] mx-auto">
            <Clock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111116]">
              {lang === 'ml' ? 'നിങ്ങളുടെ വൈദ്യുതി ചരിത്രം ഇവിടെ ആരംഭിക്കുന്നു' : 'Your electricity history starts here.'}
            </h1>
            <p className="text-[14px] text-[#71717A] max-w-xs mx-auto leading-relaxed">
              {lang === 'ml'
                ? 'ഉപയോഗം ട്രാക്ക് ചെയ്യാൻ ആദ്യ റീഡിംഗ് നൽകുക.'
                : 'Add your first reading to start tracking your usage.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5 max-w-sm mx-auto w-full">
            <Link
              href="/predict"
              className="ios-btn-primary w-full h-12 px-4 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold shadow-sm active:scale-[0.98] whitespace-nowrap"
            >
              <span>{lang === 'ml' ? 'റീഡിംഗ് ചേർക്കുക' : 'Add reading'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>

            {isMounted && !hasSavedHome && (
              <Link
                href="/"
                className="ios-btn-secondary w-full h-12 px-4 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-semibold text-[#006FEE] border border-[#006FEE]/20 hover:bg-[#006FEE]/5 active:scale-[0.98] whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#006FEE] shrink-0" />
                <span>{lang === 'ml' ? 'വീട് സജ്ജീകരിക്കാം (30s)' : 'Complete 30-sec home setup'}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLoadSample}
              className="ios-btn-secondary w-full h-11 px-4 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-medium text-[#71717A] hover:text-[#17171C] active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
              <span>{lang === 'ml' ? 'മാതൃകാ വിവരങ്ങൾ കാണുക' : 'Try sample data'}</span>
            </button>
          </div>
        </div>

        {/* Informational feature preview */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold text-[#71717A] block px-1 uppercase tracking-wider">
            {lang === 'ml' ? 'ട്രാക്കിംഗിന്റെ നേട്ടങ്ങൾ' : 'What you can track'}
          </span>
          <div className="glass-card divide-y divide-black/[0.04] overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#006FEE]/10 flex items-center justify-center text-[#006FEE] shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-semibold text-[#17171C] block">
                  {lang === 'ml' ? 'സ്ലാബ് പരിധി നിരീക്ഷണം' : 'Subsidy Tier Protection'}
                </span>
                <span className="text-[12px] text-[#71717A] leading-relaxed">
                  {lang === 'ml'
                    ? '240 യൂണിറ്റ് സബ്‌സിഡി പരിധി കടക്കാതെ തുക നിയന്ത്രിക്കാം.'
                    : 'Monitor bi-monthly units to avoid accidentally exceeding the 240-unit subsidy threshold.'}
                </span>
              </div>
            </div>

            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#17C964]/10 flex items-center justify-center text-[#17C964] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-semibold text-[#17171C] block">
                  {lang === 'ml' ? 'പ്രവചനവും യഥാർത്ഥ ബില്ലും' : 'Prediction vs Actual Bill'}
                </span>
                <span className="text-[12px] text-[#71717A] leading-relaxed">
                  {lang === 'ml'
                    ? 'മീറ്റർ റീഡർ നൽകിയ ബില്ലുമായി കണക്കുകൂട്ടലുകൾ ഒത്തുനോക്കാം.'
                    : 'Record your official KSEB bill amount once it arrives to calibrate prediction accuracy.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // POPULATED STATE
  const chartData = filteredHistory.slice(0, 6).reverse();
  const maxUnits = Math.max(...(chartData.length ? chartData.map(d => d.consumedUnits) : [300]), 300);
  const maxBill = Math.max(...(chartData.length ? chartData.map(d => d.actualBill ?? d.predictedBill) : [1500]), 1500);
  const selectedRecord = selectedPointIndex !== null && chartData[selectedPointIndex] ? chartData[selectedPointIndex] : chartData[chartData.length - 1];

  return (
    <div className="w-full space-y-5">
      {/* -- Long-term Summary Metrics (Points 19 & 20) -------- */}
      <div className="rounded-2xl bg-white border border-black/[0.06] p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#006FEE]" />
            <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
              {lang === 'ml' ? 'ശരാശരി ഉപയോഗം' : 'Your electricity trend'}
            </span>
          </div>
          <HoldToDeleteButton
            onDelete={handleClear}
            label={lang === 'ml' ? 'ഡാറ്റ മായ്ക്കുക' : 'Clear history'}
            confirmingLabel={lang === 'ml' ? 'മായ്ക്കുന്നു...' : 'Clearing...'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <span className="text-[11px] text-[#71717A] block font-medium">
              {lang === 'ml' ? 'ശരാശരി' : 'Average / cycle'}
            </span>
            <span className="font-bold text-[#17171C] text-lg num-tabular">
              {stats.averageUnits} <span className="text-[12px] font-normal text-[#71717A]">units</span>
            </span>
            <span className="text-[11px] text-[#71717A] block num-tabular">
              ~₹{stats.averageBill.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#71717A] block font-medium">
              {lang === 'ml' ? 'ഏറ്റവും കൂടുതൽ' : 'Highest vs Lowest'}
            </span>
            <span className="text-[12px] font-semibold text-[#17171C] block num-tabular">
              ▲ {stats.highestRecord ? `${stats.highestRecord.dateLabel}: ${stats.highestRecord.consumedUnits}u` : '—'}
            </span>
            <span className="text-[11px] text-[#71717A] block num-tabular">
              ▼ {stats.lowestRecord ? `${stats.lowestRecord.dateLabel}: ${stats.lowestRecord.consumedUnits}u` : '—'}
            </span>
          </div>
        </div>

        <p className="text-[12px] text-[#71717A] pt-1 border-t border-black/[0.05] leading-relaxed">
          {stats.trendStatement}
        </p>
      </div>

      {/* -- What Changed? Recent Cycle Comparison (Point 18) -- */}
      {history.length >= 2 && (
        <CycleComparisonCard
          comparison={storageManager.compareTwoCycles(history[1], history[0])}
          prevLabel={history[1].dateLabel}
          currLabel={history[0].dateLabel}
        />
      )}

      {/* -- Finance Style Trend Chart Card -------------------- */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#17171C]">
              {lang === 'ml' ? 'ഉപയോഗ ഗതി' : 'Cycle Progression'}
            </span>
            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors border cursor-pointer ${
                dateRange
                  ? 'bg-[#006FEE]/10 text-[#006FEE] border-[#006FEE]/30 font-semibold'
                  : 'bg-black/[0.04] text-[#71717A] border-black/[0.06] hover:bg-black/[0.08]'
              }`}
            >
              <Calendar className="w-3 h-3 text-[#006FEE]" />
              <span>{dateRange ? `${short(dateRange.start, false)} - ${short(dateRange.end, false)}` : (lang === 'ml' ? 'ഫിൽട്ടർ' : 'Filter')}</span>
            </button>
          </div>

          {/* Segmented Mode Selector */}
          <SegmentedControl
            options={[
              { value: 'units' as const, label: lang === 'ml' ? 'യൂണിറ്റ്' : 'Units' },
              { value: 'bill' as const, label: lang === 'ml' ? 'തുക (₹)' : 'Bill (₹)' },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as 'units' | 'bill')}
            size="sm"
          />
        </div>

        {/* Active Filter Pill */}
        {dateRange && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#006FEE]/10 border border-[#006FEE]/20 text-[12px]">
            <span className="text-[#006FEE] font-medium">
              🗓️ {short(dateRange.start, false)} → {short(dateRange.end, false)} · {filteredHistory.length} {filteredHistory.length === 1 ? 'cycle' : 'cycles'}
            </span>
            <button
              type="button"
              onClick={() => setDateRange(null)}
              className="text-[#006FEE]/80 hover:text-[#006FEE] font-semibold text-[11px] cursor-pointer"
            >
              {lang === 'ml' ? 'എല്ലാം' : 'Clear filter'}
            </button>
          </div>
        )}

        {/* Selected Data Tooltip */}
        {selectedRecord && (
          <div className="text-[12px] text-[#71717A] flex items-center justify-between pb-1 border-b border-black/[0.04]">
            <span>{selectedRecord.dateLabel}</span>
            <span className="num-tabular font-semibold text-[#17171C]">
              {viewMode === 'units'
                ? `${selectedRecord.consumedUnits} units`
                : `₹${(selectedRecord.actualBill ?? selectedRecord.predictedBill).toLocaleString('en-IN')}`}
            </span>
          </div>
        )}

        {/* Bar/Trend Visualization or Filter Empty */}
        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-[13px] text-[#71717A]">
              {lang === 'ml' ? 'ഈ തീയതികളിൽ റീഡിംഗുകൾ ഇല്ല' : 'No cycles found in this date range.'}
            </p>
            <button
              type="button"
              onClick={() => setDateRange(null)}
              className="text-[12px] text-[#006FEE] font-semibold hover:underline cursor-pointer"
            >
              {lang === 'ml' ? 'എല്ലാ റീഡിംഗുകളും കാണുക' : 'Show all cycles'}
            </button>
          </div>
        ) : (
          <div className="pt-2 pb-1 flex justify-center">
            <BarChart
              data={chartData.map((record) => ({
                label: record.dateLabel.split(' ')[0],
                value: viewMode === 'units' ? record.consumedUnits : (record.actualBill ?? record.predictedBill),
              }))}
              max={viewMode === 'units' ? Math.max(maxUnits, 300) : Math.max(maxBill, 1500)}
              ticks={
                viewMode === 'units'
                  ? [0, 150, 300]
                  : [0, 1000, 2000]
              }
              unit={viewMode === 'units' ? 'units' : 'rupees'}
              suffix={viewMode === 'units' ? 'u' : '₹'}
              label={lang === 'ml' ? 'വൈദ്യുതി ഉപയോഗ ഗതി' : 'Electricity cycle progression'}
              barColor="bg-[#006FEE]"
              onSelectIndex={(idx) => setSelectedPointIndex(idx)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* -- Record List --------------------------------------- */}
      <div className="glass-card divide-y divide-black/[0.04] overflow-hidden">
        {filteredHistory.map(record => (
          <div key={record.id} className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[14px] font-semibold text-[#17171C] block">
                {record.dateLabel}
              </span>
              <span className="text-[12px] text-[#71717A] num-tabular">
                {record.consumedUnits} units · {record.billingCycle}
              </span>
            </div>

            <div className="text-right">
              {editingActualId === record.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={actualInputVal}
                    onChange={e => setActualInputVal(e.target.value)}
                    placeholder="₹"
                    className="w-20 h-8 px-2 text-right text-[13px] font-semibold rounded-lg border border-[#006FEE] outline-none"
                  />
                  <button
                    onClick={() => handleSaveActualBill(record.id)}
                    className="w-7 h-7 rounded-lg bg-[#006FEE] text-white flex items-center justify-center cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingActualId(null)}
                    className="w-7 h-7 rounded-lg bg-black/[0.06] text-[#71717A] flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <span className="text-[15px] font-bold text-[#17171C] num-tabular block">
                    ₹{(record.actualBill ?? record.predictedBill).toLocaleString('en-IN')}
                  </span>
                  {!record.actualBill ? (
                    <button
                      onClick={() => {
                        setEditingActualId(record.id);
                        setActualInputVal(String(record.predictedBill));
                      }}
                      className="text-[11px] text-[#006FEE] font-medium hover:underline cursor-pointer"
                    >
                      + Add actual
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#17C964] font-medium">Actual</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1">
        <Link
          href="/predict"
          className="ios-btn-primary w-full"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ml' ? 'പുതിയ റീഡിംഗ് രേഖപ്പെടുത്തുക' : 'Record new reading'}</span>
        </Link>
      </div>

      {/* Date Range Picker Modal */}
      {showCalendarModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCalendarModal(false);
          }}
        >
          <div className="relative w-full max-w-[580px] bg-white rounded-[28px] shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#17171C]">
                  {lang === 'ml' ? 'ചരിത്രം ഫിൽട്ടർ ചെയ്യുക' : 'Filter Usage Cycles'}
                </h3>
                <p className="text-[12px] text-[#71717A]">
                  {lang === 'ml'
                    ? 'പ്രത്യേക തീയതികളിലെ സൈക്കിളുകൾ മാത്രം കാണുക'
                    : 'Select a custom date range or preset to inspect cycles'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.1] text-[#71717A] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close date picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center">
              <DateRangePicker
                value={dateRange}
                onApply={(range) => {
                  setDateRange(range);
                  setShowCalendarModal(false);
                }}
                className="w-full shadow-none border-none p-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast Notification */}
      <UndoToast
        isOpen={showUndoToast}
        message={lang === 'ml' ? 'ചരിത്രം ഒഴിവാക്കി' : 'Usage history cleared'}
        onUndo={handleUndo}
        onClose={() => setShowUndoToast(false)}
      />
    </div>
  );
}
