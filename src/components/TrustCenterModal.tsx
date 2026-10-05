'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  X,
  Scale,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  CompleteBillEvidenceModel,
  CalculationTrace,
  BillReconciliationReport,
} from '@/lib/trust/types';

interface TrustCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: CompleteBillEvidenceModel;
  trace?: CalculationTrace;
  reconciliation?: BillReconciliationReport;
}

export default function TrustCenterModal({
  isOpen,
  onClose,
  evidence,
  trace,
  reconciliation,
}: TrustCenterModalProps) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'evidence' | 'reconciliation' | 'trace' | 'source'>('evidence');

  if (!isOpen) return null;

  const assessment = evidence.assessment;
  const fields = Object.values(evidence.fields);

  // Group fields by knowledge category
  const knownFields = fields.filter((f) => f.kind === 'KNOWN');
  const calculatedFields = fields.filter((f) => f.kind === 'CALCULATED');
  const estimatedFields = fields.filter((f) => f.kind === 'ESTIMATED');
  const uncertainFields = fields.filter((f) => f.kind === 'UNCERTAIN');

  // Trust badge visual style
  const getBadgeStyle = () => {
    switch (assessment.grade) {
      case 'HIGH_CONFIDENCE':
        return {
          bg: 'bg-[#17C964]/10',
          border: 'border-[#17C964]/20',
          text: 'text-[#0E7036]',
          icon: <ShieldCheck className="w-5 h-5 text-[#17C964]" />,
          label: lang === 'ml' ? 'ഉയർന്ന വിശ്വാസ്യത' : 'High Confidence',
        };
      case 'GOOD_CONFIDENCE':
        return {
          bg: 'bg-[#006FEE]/10',
          border: 'border-[#006FEE]/20',
          text: 'text-[#006FEE]',
          icon: <ShieldCheck className="w-5 h-5 text-[#006FEE]" />,
          label: lang === 'ml' ? 'നല്ല വിശ്വാസ്യത' : 'Good Confidence',
        };
      case 'LIMITED_CONFIDENCE':
        return {
          bg: 'bg-[#F5A524]/10',
          border: 'border-[#F5A524]/30',
          text: 'text-[#935303]',
          icon: <ShieldAlert className="w-5 h-5 text-[#F5A524]" />,
          label: lang === 'ml' ? 'പരിമിത വിശ്വാസ്യത' : 'Limited Confidence',
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          label: lang === 'ml' ? 'പരിശോധന ആവശ്യമാണ്' : 'Verification Required',
        };
    }
  };

  const badge = getBadgeStyle();
  const activeTrace = trace || evidence.trace;
  const activeReconciliation = reconciliation || evidence.reconciliation;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trust-center-title"
        className="fixed inset-0 z-50 flex flex-col justify-end"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/45 backdrop-blur-sm -z-10"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sheet Content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 340, mass: 0.8 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="ios-sheet max-h-[88vh] overflow-y-auto p-5 pb-10 space-y-4"
        >
          {/* Grab Handle */}
          <div className="flex justify-center pb-1">
            <div className="ios-sheet-handle cursor-grab active:cursor-grabbing" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-black/[0.04]">
                <FileCheck className="w-5 h-5 text-[#17171C]" />
              </div>
              <div>
                <h3 id="trust-center-title" className="text-[17px] font-semibold text-[#17171C]">
                  {lang === 'ml' ? 'വിശ്വാസ്യതയും വിവരങ്ങളും' : 'Trust Center & Evidence'}
                </h3>
                <p className="text-[12px] text-[#71717A]">
                  {lang === 'ml' ? 'ഓരോ ഫലവും എങ്ങനെ കണക്കാക്കി എന്ന് അറിയാം' : 'Transparent breakdown of facts, calculations & sources'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-[#71717A] hover:text-[#17171C] active:scale-95 transition-transform cursor-pointer rounded-full"
              aria-label="Close Trust Center"
            >
              <span className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center">
                <X className="w-4 h-4" />
              </span>
            </button>
          </div>

          {/* Trust Assessment Hero Banner */}
          <div className={`rounded-2xl border p-4 ${badge.bg} ${badge.border} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {badge.icon}
                <span className={`text-[14px] font-bold ${badge.text}`}>{badge.label}</span>
              </div>
              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-black/5 text-[#17171C] num-tabular">
                {(assessment.overallConfidenceScore * 100).toFixed(0)}% verification index
              </span>
            </div>
            <p className="text-[13px] text-[#17171C]/80 leading-relaxed">{assessment.explanation}</p>

            {assessment.warnings.length > 0 && (
              <div className="pt-2 border-t border-black/5 space-y-1">
                {assessment.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[12px] text-[#935303]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-black/[0.06] text-[13px] font-medium gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeTab === 'evidence'
                  ? 'border-b-2 border-[#17171C] text-[#17171C] font-semibold'
                  : 'text-[#71717A] hover:text-[#17171C]'
              }`}
            >
              {lang === 'ml' ? 'വിവരങ്ങൾ (4 ഘട്ടങ്ങൾ)' : 'Evidence Model'}
            </button>

            {activeReconciliation && (
              <button
                type="button"
                onClick={() => setActiveTab('reconciliation')}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === 'reconciliation'
                    ? 'border-b-2 border-[#17171C] text-[#17171C] font-semibold'
                    : 'text-[#71717A] hover:text-[#17171C]'
                }`}
              >
                {lang === 'ml' ? 'ബിൽ താരതമ്യം' : 'Reconciliation'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('trace')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeTab === 'trace'
                  ? 'border-b-2 border-[#17171C] text-[#17171C] font-semibold'
                  : 'text-[#71717A] hover:text-[#17171C]'
              }`}
            >
              {lang === 'ml' ? 'ഘട്ടം ഘട്ടമായുള്ള രേഖ' : 'Calculation Trace'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('source')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeTab === 'source'
                  ? 'border-b-2 border-[#17171C] text-[#17171C] font-semibold'
                  : 'text-[#71717A] hover:text-[#17171C]'
              }`}
            >
              {lang === 'ml' ? 'ഉത്തരവ് രേഖ' : 'Tariff Order'}
            </button>
          </div>

          {/* TAB 1: EVIDENCE MODEL (4 KNOWLEDGE CATEGORIES) */}
          {activeTab === 'evidence' && (
            <div className="space-y-4 pt-1">
              {/* 1. What We Know (KNOWN) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0E7036] uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ml' ? 'സ്ഥിരീകരിച്ച കാര്യങ്ങൾ (Known Facts)' : 'What We Know (Facts)'}</span>
                </div>
                <div className="rounded-xl bg-[#F4F4F2] p-3 space-y-2 text-[13px]">
                  {knownFields.length > 0 ? (
                    knownFields.map((f) => (
                      <div key={f.name} className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-medium text-[#17171C] block">{f.label}</span>
                          <span className="text-[11px] text-[#71717A]">{f.source}</span>
                        </div>
                        <span className="font-semibold text-[#17171C] num-tabular">
                          {String(f.value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#71717A]">No direct bill facts recorded yet.</span>
                  )}
                </div>
              </div>

              {/* 2. What We Calculated (CALCULATED) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#006FEE] uppercase tracking-wide">
                  <Scale className="w-3.5 h-3.5" />
                  <span>{lang === 'ml' ? 'കണക്കുകൂട്ടിയവ (Calculated via Tariff)' : 'What We Calculated (Derived)'}</span>
                </div>
                <div className="rounded-xl bg-[#F4F4F2] p-3 space-y-2 text-[13px]">
                  {calculatedFields.map((f) => (
                    <div key={f.name} className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-medium text-[#17171C] block">{f.label}</span>
                        <span className="text-[11px] text-[#71717A]">{f.notes || 'Tariff formula'}</span>
                      </div>
                      <span className="font-semibold text-[#17171C] num-tabular">
                        {typeof f.value === 'number' ? `₹${f.value.toFixed(2)}` : String(f.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. What We Estimated (ESTIMATED) */}
              {estimatedFields.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#935303] uppercase tracking-wide">
                    <Info className="w-3.5 h-3.5" />
                    <span>{lang === 'ml' ? 'പ്രവചിച്ചവ (Estimated Projections)' : 'What We Estimated (Projected)'}</span>
                  </div>
                  <div className="rounded-xl bg-[#F4F4F2] p-3 space-y-2 text-[13px]">
                    {estimatedFields.map((f) => (
                      <div key={f.name} className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-medium text-[#17171C] block">{f.label}</span>
                          <span className="text-[11px] text-[#71717A]">{f.notes}</span>
                        </div>
                        <span className="font-semibold text-[#17171C] num-tabular">
                          {typeof f.value === 'number' ? `₹${f.value.toLocaleString('en-IN')}` : String(f.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. What Was Uncertain (UNCERTAIN) */}
              {uncertainFields.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-red-600 uppercase tracking-wide">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{lang === 'ml' ? 'അനുമാനിച്ചവ (Assumptions & Inferences)' : 'What Was Uncertain'}</span>
                  </div>
                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-3 space-y-2 text-[13px]">
                    {uncertainFields.map((f) => (
                      <div key={f.name} className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-medium text-[#17171C] block">{f.label}</span>
                          <span className="text-[11px] text-red-700/80">{f.notes}</span>
                        </div>
                        <span className="font-semibold text-[#17171C] num-tabular">
                          {String(f.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECONCILIATION */}
          {activeTab === 'reconciliation' && activeReconciliation && (
            <div className="space-y-3 pt-1">
              <div className="rounded-xl bg-black/[0.03] p-3 space-y-1">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#71717A]">Calculated Total:</span>
                  <span className="font-bold text-[#17171C] num-tabular">
                    ₹{activeReconciliation.calculatedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#71717A]">Official Bill Total:</span>
                  <span className="font-bold text-[#17171C] num-tabular">
                    ₹{activeReconciliation.officialTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-black/[0.06] pt-1.5 flex justify-between items-center text-[13px]">
                  <span className="font-medium text-[#71717A]">Difference:</span>
                  <span
                    className={`font-bold num-tabular ${
                      Math.abs(activeReconciliation.totalDifference) <= 1.0 ? 'text-[#0E7036]' : 'text-[#B45309]'
                    }`}
                  >
                    {activeReconciliation.totalDifference > 0 ? '+' : ''}
                    ₹{activeReconciliation.totalDifference.toFixed(2)}
                  </span>
                </div>
              </div>

              {activeReconciliation.dominantExplanation && (
                <div className="text-[12px] bg-[#006FEE]/5 border border-[#006FEE]/15 rounded-xl p-3 text-[#006FEE]">
                  <span className="font-semibold block mb-0.5">Root Cause Attribution:</span>
                  <span>{activeReconciliation.dominantExplanation}</span>
                </div>
              )}

              {/* Table of items */}
              <div className="bg-[#F4F4F2] rounded-xl overflow-hidden">
                <table className="w-full text-left text-[12px]">
                  <thead className="border-b border-black/[0.06] text-[#71717A]">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Component</th>
                      <th className="py-2 px-2 font-semibold text-right">Calculated</th>
                      <th className="py-2 px-2 font-semibold text-right">Official</th>
                      <th className="py-2 px-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] num-tabular">
                    {activeReconciliation.items.map((it) => (
                      <tr key={it.componentId}>
                        <td className="py-2 px-3 text-[#17171C] font-medium">{it.componentName}</td>
                        <td className="py-2 px-2 text-right text-[#71717A]">
                          {it.calculatedAmount !== null ? `₹${it.calculatedAmount.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2 px-2 text-right text-[#71717A]">
                          {it.officialAmount !== null ? `₹${it.officialAmount.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              it.status === 'MATCH'
                                ? 'bg-[#17C964]/15 text-[#0E7036]'
                                : it.status === 'NEAR_MATCH'
                                ? 'bg-[#006FEE]/15 text-[#006FEE]'
                                : it.status === 'DIFFERENCE'
                                ? 'bg-[#F5A524]/15 text-[#935303]'
                                : 'bg-black/5 text-[#71717A]'
                            }`}
                          >
                            {it.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CALCULATION TRACE */}
          {activeTab === 'trace' && (
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-[12px] text-[#71717A]">
                <span>Engine Version: {activeTrace.engineVersion}</span>
                <span className="num-tabular">Trace ID: {activeTrace.traceId.slice(0, 14)}...</span>
              </div>

              <div className="bg-[#F4F4F2] rounded-xl p-3 space-y-2 text-[12px]">
                <div className="flex items-center justify-between font-semibold text-[#17171C]">
                  <span>Deterministic Execution Path</span>
                  <span className="text-[11px] text-[#0E7036] bg-[#17C964]/10 px-2 py-0.5 rounded-full">
                    Bit-for-Bit Replayable
                  </span>
                </div>
                <div className="space-y-2 pt-1 divide-y divide-black/[0.04]">
                  {activeTrace.steps.map((st) => (
                    <div key={st.step} className="pt-2 first:pt-0 flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-bold text-[#17171C]">
                            {st.step}
                          </span>
                          <span className="font-semibold text-[#17171C]">{st.label}</span>
                        </div>
                        <p className="text-[11px] text-[#71717A] pl-5">{st.inputDescription}</p>
                      </div>
                      <div className="text-right num-tabular">
                        <span className="font-semibold text-[#17171C]">
                          {st.isDeduction ? `−₹${st.stepAmount.toFixed(2)}` : `₹${st.stepAmount.toFixed(2)}`}
                        </span>
                        <span className="block text-[10px] text-[#71717A]">
                          tot: ₹{st.runningTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TARIFF ORDER REFERENCE */}
          {activeTab === 'source' && (
            <div className="space-y-3 pt-1">
              <div className="rounded-xl bg-[#F4F4F2] p-4 space-y-3 text-[13px]">
                <div>
                  <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                    Regulatory Authority
                  </span>
                  <p className="font-semibold text-[#17171C] mt-0.5">
                    Kerala State Electricity Regulatory Commission (KSERC)
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                    Tariff Order Reference
                  </span>
                  <p className="font-medium text-[#17171C] mt-0.5">
                    {activeTrace.tariffOrderReference}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block">
                    Effective Period
                  </span>
                  <p className="font-medium text-[#17171C] mt-0.5">
                    November 2023 – Present (Validated for 2024–2026 cycles)
                  </p>
                </div>

                <div className="pt-2 border-t border-black/[0.06]">
                  <a
                    href="https://erckerala.org"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#006FEE] hover:underline"
                  >
                    <span>View Regulatory Order Archive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={onClose}
            className="ios-btn-primary w-full active:scale-[0.98] cursor-pointer mt-2"
          >
            {lang === 'ml' ? 'ശരി' : 'Done'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
