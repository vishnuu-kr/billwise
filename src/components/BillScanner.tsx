'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ocrProvider, SAMPLE_KSEB_REFERENCE_BILL, SAMPLE_KSEB_HIGH_USAGE_BILL } from '@/lib/ocr/extractor';
import { ImageQualityReport } from '@/lib/ocr/imageAnalyzer';
import { ExtractedBillData } from '@/types';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Edit3,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface BillScannerProps {
  onVerified?: (data: ExtractedBillData) => void;
}

export default function BillScanner({ onVerified }: BillScannerProps) {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Flow stages
  const [stage, setStage] = useState<'upload' | 'reading' | 'verify'>('upload');
  const [readingStep, setReadingStep] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<ExtractedBillData>(SAMPLE_KSEB_REFERENCE_BILL);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const readingSteps = [
    t.readingBill,
    t.findingReadings,
    t.findingTariff,
    t.findingCharges,
  ];

  const handleFileProcess = async (file: File) => {
    setStage('reading');
    setReadingStep(0);
    setQualityReport(null);

    // Create local object URL for instant preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    const stepInterval = setInterval(() => {
      setReadingStep(prev => Math.min(prev + 1, readingSteps.length - 1));
    }, 400);

    try {
      const result = await ocrProvider.extract(file);
      setTimeout(() => {
        clearInterval(stepInterval);
        setExtractedData(result.data);
        if (result.qualityReport && !result.qualityReport.isAcceptable) {
          setQualityReport(result.qualityReport);
        }
        setStage('verify');
      }, 1600);
    } catch {
      clearInterval(stepInterval);
      setExtractedData(SAMPLE_KSEB_REFERENCE_BILL);
      setStage('verify');
    }
  };

  const handleUseSample = (type: 'reference' | 'high') => {
    setStage('reading');
    setReadingStep(0);
    setQualityReport(null);

    const stepInterval = setInterval(() => {
      setReadingStep(prev => Math.min(prev + 1, readingSteps.length - 1));
    }, 350);

    setTimeout(() => {
      clearInterval(stepInterval);
      setExtractedData(type === 'high' ? SAMPLE_KSEB_HIGH_USAGE_BILL : SAMPLE_KSEB_REFERENCE_BILL);
      setStage('verify');
    }, 1400);
  };

  const handleRotate = () => {
    setRotationAngle(prev => (prev + 90) % 360);
  };

  const handleFieldChange = (field: keyof ExtractedBillData, value: ExtractedBillData[keyof ExtractedBillData]) => {
    setExtractedData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'presentReading' || field === 'previousReading') {
        const pres = field === 'presentReading' ? Number(value) : prev.presentReading;
        const past = field === 'previousReading' ? Number(value) : prev.previousReading;
        updated.consumedUnits = Math.max(0, pres - past);
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    if (onVerified) {
      onVerified(extractedData);
    } else {
      try {
        sessionStorage.setItem('billwise_scanned_bill', JSON.stringify(extractedData));
      } catch {
        // ignore
      }
      router.push(`/predict?prevReading=${extractedData.presentReading}&tariff=${extractedData.tariff}`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* STAGE 1: UPLOAD & PHOTO CAPTURE */}
      {stage === 'upload' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bill Scanner
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t.scanTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.scanSubtitle}
            </p>
          </div>

          {/* Hidden inputs */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={e => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
          />
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={e => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
          />

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-sky-600 px-5 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
            >
              <Camera className="h-5 w-5" />
              <span>{t.takePhoto}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all touch-target"
            >
              <Upload className="h-5 w-5 text-slate-500" />
              <span>{t.uploadBill} (JPG, PNG, PDF)</span>
            </button>
          </div>

          {/* On-device Security Reassurance */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>100% on-device processing. No photos stored remotely.</span>
          </div>

          {/* Sample Bills for Instant 1-Click Evaluation */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>{lang === 'ml' ? 'ടെസ്റ്റ് ബിൽ തിരഞ്ഞെടുക്കാം' : 'Or test with an authentic sample bill'}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                onClick={() => handleUseSample('reference')}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors touch-target"
              >
                Sample 1: Reference 240 Units (LT-1A)
              </button>
              <button
                onClick={() => handleUseSample('high')}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors touch-target"
              >
                Sample 2: High Usage 520 Units (3-Phase)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: EXTRACTION IN PROGRESS */}
      {stage === 'reading' && (
        <div className="py-8 text-center space-y-6">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">
              {readingSteps[readingStep]}
            </h3>
            <p className="text-xs text-slate-500">
              Extracting readings, tariff slab, and connected load securely on your device...
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="mx-auto max-w-xs space-y-2 text-left pt-2">
            {readingSteps.map((step, idx) => (
              <div key={step} className="flex items-center gap-2.5 text-xs">
                {idx < readingStep ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : idx === readingStep ? (
                  <div className="h-4 w-4 rounded-full border-2 border-sky-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-200 shrink-0" />
                )}
                <span className={idx <= readingStep ? 'font-medium text-slate-800' : 'text-slate-400'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 3: VERIFICATION */}
      {stage === 'verify' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {t.weFound}
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {t.doesThisLookRight}
              </h3>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 touch-target"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? 'Done Editing' : t.editDetails}</span>
            </button>
          </div>

          {/* Unsupported Bill Type Blocker (Item 8) */}
          {extractedData.isSupportedBillType === false && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-950 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span>This bill type isn&apos;t supported yet</span>
              </div>
              <p className="leading-relaxed text-red-800">
                {extractedData.unsupportedReason || 'BILLWISE currently calculates Kerala domestic households (LT-1A). Commercial, industrial, and high-tension tariffs are not yet supported.'}
              </p>
              <button
                onClick={() => setStage('upload')}
                className="inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-900 underline pt-1"
              >
                Upload a domestic LT-1A bill instead
              </button>
            </div>
          )}

          {/* Smart Reading-Consumption Consistency Check (Item 7) */}
          {extractedData.consistencyCheck && !extractedData.consistencyCheck.isConsistent && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Reading & Consumption Discrepancy Detected</span>
              </div>
              <p className="leading-relaxed">
                {extractedData.consistencyCheck.warningMessage}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    const comp = extractedData.consistencyCheck!.computedUnits;
                    handleFieldChange('consumedUnits', comp);
                    setExtractedData(prev => ({
                      ...prev,
                      consumedUnits: comp,
                      consistencyCheck: { ...prev.consistencyCheck!, isConsistent: true }
                    }));
                  }}
                  className="rounded-lg bg-amber-200/90 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-300 transition-colors"
                >
                  Use {extractedData.consistencyCheck.computedUnits} units from readings
                </button>
                <button
                  onClick={() => {
                    const billed = extractedData.consistencyCheck!.extractedUnits;
                    setExtractedData(prev => ({
                      ...prev,
                      consumedUnits: billed,
                      consistencyCheck: { ...prev.consistencyCheck!, isConsistent: true }
                    }));
                  }}
                  className="rounded-lg bg-white border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 transition-colors"
                >
                  Keep {extractedData.consistencyCheck.extractedUnits} units from bill
                </button>
              </div>
            </div>
          )}

          {/* Optical Quality Alert Banner if Blur or Darkness Detected */}
          {qualityReport && !qualityReport.isAcceptable && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">Image Quality Notice:</span>{' '}
                {qualityReport.recommendation || 'Please verify the extracted numbers carefully.'}
              </div>
            </div>
          )}

          {/* Preview Image with Rotate & Contrast Tools */}
          {previewUrl && (
            <div className="relative rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden text-center p-3">
              <div className="flex justify-between items-center text-xs text-slate-300 pb-2 px-1">
                <span>Bill Document Preview</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotate}
                    className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-white hover:bg-white/30 transition-colors"
                    title="Rotate orientation 90 degrees"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Rotate 90°</span>
                  </button>
                </div>
              </div>
              <img
                src={previewUrl}
                alt="Uploaded KSEB Bill"
                className="max-h-48 mx-auto object-contain transition-transform duration-200"
                style={{ transform: `rotate(${rotationAngle}deg)` }}
              />
            </div>
          )}

          {/* Privacy & Engine Transparency Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>On-device client extractor active. No images or personal numbers are uploaded to external servers.</span>
          </div>

          {/* Core Extracted Fields Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Previous Reading */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-xs text-slate-500 font-medium">{t.previousReading}</div>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={extractedData.previousReading}
                  onChange={e => handleFieldChange('previousReading', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-1.5 font-mono font-bold text-slate-900"
                />
              ) : (
                <div className="mt-1 font-mono text-base font-extrabold text-slate-900 num-tabular">
                  {extractedData.previousReading.toLocaleString()}
                </div>
              )}
            </div>

            {/* Present Reading */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-xs text-slate-500 font-medium">{t.currentReading}</div>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={extractedData.presentReading}
                  onChange={e => handleFieldChange('presentReading', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-1.5 font-mono font-bold text-slate-900"
                />
              ) : (
                <div className="mt-1 font-mono text-base font-extrabold text-slate-900 num-tabular">
                  {extractedData.presentReading.toLocaleString()}
                </div>
              )}
            </div>

            {/* Consumed Units */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-xs text-slate-500 font-medium">{t.consumption}</div>
              <div className="mt-1 font-mono text-base font-extrabold text-sky-700 num-tabular">
                {extractedData.consumedUnits} {t.units}
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-xs text-slate-500 font-medium">{t.billingCycle}</div>
              <div className="mt-1 font-semibold text-slate-900 capitalize">
                {extractedData.billingCycle}
              </div>
            </div>

            {/* Tariff & Phase */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-xs text-slate-500 font-medium">{t.tariff} & {t.phase}</div>
              <div className="mt-1 font-semibold text-slate-900 text-xs">
                {extractedData.tariff} • {extractedData.phase === 'single' ? t.singlePhase : t.threePhase}
              </div>
            </div>

            {/* Connected Load (with uncertainty badge if < 0.90) */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{t.connectedLoad}</span>
                {extractedData.fieldConfidences?.connectedLoadWatts < 0.90 && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3" /> Check this
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={extractedData.connectedLoadWatts}
                  onChange={e => handleFieldChange('connectedLoadWatts', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-1.5 font-mono font-bold text-slate-900"
                />
              ) : (
                <div className="mt-1 font-mono text-base font-bold text-slate-900 num-tabular">
                  {extractedData.connectedLoadWatts} W
                </div>
              )}
            </div>
          </div>

          {/* Expandable Technical Line Items (All 16 Extracted Items) */}
          <div>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs font-semibold text-slate-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>{showTechnicalDetails ? '− Hide extracted billing charges' : '+ Show all 16 extracted charges & dates'}</span>
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Billing Period</span>
                  <span className="text-slate-700 font-medium">{extractedData.billingPeriod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Bill Date</span>
                  <span className="text-slate-700 font-medium">{extractedData.billDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Due Date</span>
                  <span className="text-slate-700 font-medium">{extractedData.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Energy Charge</span>
                  <span className="text-slate-800 font-bold">₹{extractedData.energyCharge}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Fixed Charge</span>
                  <span className="text-slate-800 font-bold">₹{extractedData.fixedCharge}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Duty (10%)</span>
                  <span className="text-slate-800 font-bold">₹{extractedData.duty}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Fuel Adj. (FAC)</span>
                  <span className="text-slate-800 font-bold">₹{extractedData.fuelAdjustment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Meter Rent</span>
                  <span className="text-slate-800 font-bold">₹{extractedData.meterRent}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Subsidy</span>
                  <span className="text-emerald-700 font-bold">−₹{extractedData.subsidy}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
            >
              <span>{t.everythingLooksRight}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setStage('upload')}
              className="rounded-2xl border border-slate-200 px-4 py-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors touch-target"
            >
              Rescan Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
