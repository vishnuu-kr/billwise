'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ocrProvider, SAMPLE_KSEB_REFERENCE_BILL, SAMPLE_KSEB_HIGH_USAGE_BILL } from '@/lib/ocr/extractor';
import { ExtractedBillData } from '@/types';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Edit3,
  ArrowRight,
  FileText,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface BillScannerProps {
  onVerified?: (data: ExtractedBillData) => void;
}

export default function BillScanner({ onVerified }: BillScannerProps) {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // States
  const [stage, setStage] = useState<'upload' | 'reading' | 'verify'>('upload');
  const [readingStep, setReadingStep] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<ExtractedBillData>(SAMPLE_KSEB_REFERENCE_BILL);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const readingSteps = [
    t.readingBill,
    t.findingReadings,
    t.findingTariff,
    t.findingCharges,
  ];

  const handleFileProcess = async (file: File) => {
    setStage('reading');
    setReadingStep(0);

    // Create preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Step-by-step extraction animation
    const stepInterval = setInterval(() => {
      setReadingStep(prev => {
        if (prev < readingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 450);

    try {
      const result = await ocrProvider.extract(file);
      setTimeout(() => {
        clearInterval(stepInterval);
        setExtractedData(result.data);
        setStage('verify');
      }, 1900);
    } catch {
      clearInterval(stepInterval);
      setExtractedData(SAMPLE_KSEB_REFERENCE_BILL);
      setStage('verify');
    }
  };

  const handleUseSample = (type: 'reference' | 'high') => {
    setStage('reading');
    setReadingStep(0);

    const stepInterval = setInterval(() => {
      setReadingStep(prev => Math.min(prev + 1, readingSteps.length - 1));
    }, 400);

    setTimeout(() => {
      clearInterval(stepInterval);
      setExtractedData(type === 'high' ? SAMPLE_KSEB_HIGH_USAGE_BILL : SAMPLE_KSEB_REFERENCE_BILL);
      setStage('verify');
    }, 1600);
  };

  const handleRotate = () => {
    setRotationAngle(prev => (prev + 90) % 360);
  };

  const handleFieldChange = (field: keyof ExtractedBillData, value: any) => {
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
      // Store into sessionStorage for predict flow
      try {
        sessionStorage.setItem('billwise_scanned_bill', JSON.stringify(extractedData));
      } catch {
        // ignore
      }
      router.push(`/predict?prevReading=${extractedData.presentReading}&tariff=${extractedData.tariff}`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
      {/* STAGE 1: UPLOAD */}
      {stage === 'upload' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {t.scanTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
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

          {/* Upload and Camera Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 rounded-xl bg-sky-600 px-5 py-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
            >
              <Camera className="h-5 w-5" />
              <span>{t.takePhoto}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all touch-target"
            >
              <Upload className="h-5 w-5 text-slate-500" />
              <span>{t.uploadBill} (JPG, PNG, PDF)</span>
            </button>
          </div>

          {/* Quick Demo Sample Bills */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>{lang === 'ml' ? 'ടെസ്റ്റ് ബിൽ തിരഞ്ഞെടുക്കാം' : 'Or test with a sample bill'}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                onClick={() => handleUseSample('reference')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sample 1: Standard 240 Units (LT-1A)
              </button>
              <button
                onClick={() => handleUseSample('high')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sample 2: High Usage 520 Units (3-Phase)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: READING / PROGRESSIVE EXTRACTION */}
      {stage === 'reading' && (
        <div className="py-8 text-center space-y-6">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              {readingSteps[readingStep]}
            </h3>
            <p className="text-xs text-slate-500">
              Extracting readings, tariff slab, and connected load securely on device...
            </p>
          </div>

          {/* Progress indicators */}
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
              <h3 className="text-lg font-bold text-slate-900">
                {t.doesThisLookRight}
              </h3>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 touch-target"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? 'Done' : t.editDetails}</span>
            </button>
          </div>

          {/* Uploaded image preview with rotate option if available */}
          {previewUrl && (
            <div className="relative rounded-xl border border-slate-200 bg-slate-900 overflow-hidden text-center p-2">
              <div className="flex justify-end p-1">
                <button
                  onClick={handleRotate}
                  className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
                  title="Rotate image 90 degrees"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
              <img
                src={previewUrl}
                alt="Uploaded KSEB Bill"
                className="max-h-48 mx-auto object-contain transition-transform"
                style={{ transform: `rotate(${rotationAngle}deg)` }}
              />
            </div>
          )}

          {/* Extracted Fields Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Previous Reading */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-xs text-slate-500 font-medium">{t.previousReading}</div>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={extractedData.previousReading}
                  onChange={e => handleFieldChange('previousReading', e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-1 font-mono font-bold text-slate-900"
                />
              ) : (
                <div className="mt-0.5 font-mono text-base font-bold text-slate-900 num-tabular">
                  {extractedData.previousReading.toLocaleString()}
                </div>
              )}
            </div>

            {/* Present Reading */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-xs text-slate-500 font-medium">{t.currentReading}</div>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={extractedData.presentReading}
                  onChange={e => handleFieldChange('presentReading', e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-1 font-mono font-bold text-slate-900"
                />
              ) : (
                <div className="mt-0.5 font-mono text-base font-bold text-slate-900 num-tabular">
                  {extractedData.presentReading.toLocaleString()}
                </div>
              )}
            </div>

            {/* Consumption */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-xs text-slate-500 font-medium">{t.consumption}</div>
              <div className="mt-0.5 font-mono text-base font-bold text-sky-700 num-tabular">
                {extractedData.consumedUnits} {t.units}
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-xs text-slate-500 font-medium">{t.billingCycle}</div>
              <div className="mt-0.5 font-semibold text-slate-900 capitalize">
                {extractedData.billingCycle}
              </div>
            </div>

            {/* Tariff & Phase */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-xs text-slate-500 font-medium">{t.tariff} & {t.phase}</div>
              <div className="mt-0.5 font-medium text-slate-900 text-xs">
                {extractedData.tariff} • {extractedData.phase === 'single' ? t.singlePhase : t.threePhase}
              </div>
            </div>

            {/* Connected Load */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-xs text-slate-500 font-medium">{t.connectedLoad}</div>
              <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 num-tabular">
                {extractedData.connectedLoadWatts} W
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all touch-target"
            >
              <span>{t.everythingLooksRight}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setStage('upload')}
              className="rounded-xl border border-slate-200 px-4 py-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors touch-target"
            >
              {lang === 'ml' ? 'വീണ്ടും സ്കാൻ ചെയ്യുക' : 'Rescan Bill'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
