'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  ocrProvider,
  SAMPLE_KSEB_REFERENCE_BILL,
  SAMPLE_KSEB_HIGH_USAGE_BILL,
  SAMPLE_BESCOM_REFERENCE_BILL,
  SAMPLE_MSEDCL_REFERENCE_BILL,
} from '@/lib/ocr/extractor';
import { ImageQualityReport } from '@/lib/ocr/imageAnalyzer';
import { ExtractedBillData } from '@/types';
import { detectProviderFromBillText } from '@/lib/electricity/detection/providerDetector';
import { ElectricityProvider } from '@/lib/electricity/types';
import { NATIONAL_PROVIDER_REGISTRY } from '@/lib/electricity/providers';
import { ProviderSelectModal } from './ProviderSelectModal';
import {
  Camera,
  Upload,
  RotateCw,
  Edit3,
  ArrowRight,
  X,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { TextScramble } from '@/components/ui/TextScramble';
import { RubberStamp } from '@/components/ui/RubberStamp';
import { PixelLoader } from '@/components/ui/PixelLoader';
import { LensReveal } from '@/components/ui/LensReveal';
import { Spinner } from '@/components/ui/LoaderSet';

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
  const [activeProvider, setActiveProvider] = useState<ElectricityProvider>(NATIONAL_PROVIDER_REGISTRY['kseb']);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Revoke object URL on unmount to prevent image blob memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const readingSteps = [
    t.readingBill,
    t.findingReadings,
    t.findingTariff,
    t.findingCharges,
  ];

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setStage('reading');
    setReadingStep(0);
    setQualityReport(null);

    // Free previous preview blob if allocated
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    const stepInterval = setInterval(() => {
      setReadingStep(prev => Math.min(prev + 1, readingSteps.length - 1));
    }, 250);

    try {
      const result = await ocrProvider.extract(file);
      clearInterval(stepInterval);
      setExtractedData(result.data);
      if (result.rawText) {
        const detection = detectProviderFromBillText(result.rawText);
        if (detection.detectedProvider) {
          setActiveProvider(detection.detectedProvider);
        }
      }
      if (result.qualityReport && !result.qualityReport.isAcceptable) {
        setQualityReport(result.qualityReport);
      }
      setStage('verify');
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = (err as Error).message || (lang === 'ml'
        ? 'ബിൽ വായിക്കാൻ കഴിഞ്ഞില്ല. ചിത്രം വ്യക്തമാണെന്ന് ഉറപ്പാക്കുക അല്ലെങ്കിൽ നേരിട്ട് റീഡിംഗ് നൽകുക.'
        : 'Could not read bill from this file. Please take a clearer photo or enter readings manually.');
      setErrorMessage(msg);
      setStage('upload');
    }
  };

  const handleUseSample = (type: 'reference' | 'high' | 'bescom' | 'msedcl') => {
    // Instant sample fixture loading without artificial delays
    setQualityReport(null);
    if (type === 'high') {
      setExtractedData(SAMPLE_KSEB_HIGH_USAGE_BILL);
      setActiveProvider(NATIONAL_PROVIDER_REGISTRY['kseb']);
    } else if (type === 'bescom') {
      setExtractedData(SAMPLE_BESCOM_REFERENCE_BILL);
      setActiveProvider(NATIONAL_PROVIDER_REGISTRY['bescom']);
    } else if (type === 'msedcl') {
      setExtractedData(SAMPLE_MSEDCL_REFERENCE_BILL);
      setActiveProvider(NATIONAL_PROVIDER_REGISTRY['msedcl']);
    } else {
      setExtractedData(SAMPLE_KSEB_REFERENCE_BILL);
      setActiveProvider(NATIONAL_PROVIDER_REGISTRY['kseb']);
    }
    setStage('verify');
  };

  const handleRotate = () => {
    setRotationAngle(prev => (prev + 90) % 360);
  };

  const handleFieldChange = (field: keyof ExtractedBillData, value: string | number | boolean | undefined) => {
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
      router.push(
        `/predict?provider=${activeProvider.id}&prevReading=${extractedData.presentReading}&prevBill=${extractedData.totalAmount}&phase=${extractedData.phase}&load=${extractedData.connectedLoadWatts}`
      );
    }
  };

  return (
    <div className="w-full">
      {/* Hidden system file inputs */}
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

      {/* STAGE 1: CAMERA SCREEN (Section 31) */}
      {stage === 'upload' && (
        <div className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-[13px] text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="relative w-full rounded-3xl bg-[#121316] p-5 sm:p-6 flex flex-col text-white shadow-xl">
            {/* Instruction Overlay */}
            <div className="text-center pb-3">
              <p className="text-[15px] font-semibold text-white/95">
                {lang === 'ml' ? 'ബിൽ ഫ്രെയിമിനുള്ളിൽ വെയ്ക്കുക' : 'Place your bill inside the frame.'}
              </p>
            </div>

            {/* Dedicated Viewfinder Window with 4 Framed Corners */}
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center overflow-hidden my-1">
              {/* Corner Framing Guides strictly framing the scanning window */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-lg pointer-events-none" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-lg pointer-events-none" />

              {/* Center Guidance */}
              <div className="flex flex-col items-center justify-center gap-2 opacity-80">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Camera style={{ width: '24px', height: '24px' }} />
                </div>
                <span className="text-[12px] font-medium text-white/60">
                  {lang === 'ml' ? 'വെളിച്ചമുള്ളിടത്ത് പിടിക്കുക' : 'Ensure flat & well-lit'}
                </span>
              </div>
            </div>

            {/* Bottom Actions: Capture & Upload cleanly separated below */}
            <div className="space-y-2.5 pt-4">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full h-12 rounded-xl bg-white text-[#17171C] font-semibold text-[15px] flex items-center justify-center gap-2 shadow-sm hover:bg-white/90 active:scale-[0.96] transition-all touch-target"
              >
                <Camera style={{ width: '18px', height: '18px' }} />
                <span>{lang === 'ml' ? 'ഫോട്ടോ എടുക്കുക' : 'Capture'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-11 rounded-xl bg-white/10 text-white font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-white/15 active:scale-[0.96] transition-all touch-target border border-white/10"
              >
                <Upload style={{ width: '16px', height: '16px' }} />
                <span>{lang === 'ml' ? 'ഫയൽ അപ്‌ലോഡ് ചെയ്യുക' : 'Upload'}</span>
              </button>
            </div>
          </div>

          {/* Active Provider Selector Chip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {lang === 'ml' ? 'വൈദ്യുതി ബോർഡ്' : 'Electricity Provider'}
                </span>
                <span className="text-[13px] font-bold text-slate-900">
                  {activeProvider.displayName} ({activeProvider.state})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsProviderModalOpen(true)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition-colors min-h-[32px] flex items-center"
            >
              {lang === 'ml' ? 'മാറ്റുക' : 'Change'}
            </button>
          </div>

          {/* Interactive Marching Edge File Dropzone */}
          <FileDropzone
            onFileSelect={handleFileProcess}
            label={lang === 'ml' ? 'വൈദ്യുതി ബിൽ ഫോട്ടോ ഡ്രോപ്പ് ചെയ്യുക' : 'Drop electricity bill photo or PDF here'}
            sublabel={lang === 'ml' ? 'ഡിവൈസിൽ മാത്രം പ്രോസസ് ചെയ്യുന്നു · ഫയലുകൾ പുറത്തേക്ക് പോകുന്നില്ല' : 'On-device document reader · Files never leave your device'}
            accept="image/*,application/pdf"
          />

          {/* Privacy Note */}
          <p className="text-[11px] text-[var(--tertiary)] text-center">
            {lang === 'ml'
              ? 'ഫോട്ടോ ഡിവൈസിൽ മാത്രം പ്രോസസ് ചെയ്യുന്നു · ഒരിടത്തേക്കും അപ്‌ലോഡ് ചെയ്യുന്നില്ല'
              : 'Processed on your device · No photos sent to remote servers'}
          </p>

          {/* Quick Sample Bill Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-[12px] text-[var(--tertiary)]">
              {lang === 'ml' ? 'ടെസ്റ്റ് ചെയ്യാൻ:' : 'Or test sample:'}
            </span>
            <button
              type="button"
              onClick={() => handleUseSample('reference')}
              className="rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] px-3 py-1 text-[12px] font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              KSEB (240u)
            </button>
            <button
              type="button"
              onClick={() => handleUseSample('bescom')}
              className="rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] px-3 py-1 text-[12px] font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              BESCOM (150u)
            </button>
            <button
              type="button"
              onClick={() => handleUseSample('msedcl')}
              className="rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] px-3 py-1 text-[12px] font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              MSEDCL (200u)
            </button>
            <button
              type="button"
              onClick={() => handleUseSample('high')}
              className="rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] px-3 py-1 text-[12px] font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              KSEB (520u 3-Ph)
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: OCR IN PROGRESS */}
      {stage === 'reading' && (
        <div className="relative w-full aspect-[3/4] sm:min-h-[460px] rounded-[var(--radius-sheet)] bg-[#121316] p-6 flex flex-col justify-center items-center text-white overflow-hidden shadow-md">
          {/* PixelLoader wave matrix for high-tech OCR feel */}
          <PixelLoader size={6} label="" className="mb-0" />

          <h3 className="text-xl font-semibold tracking-tight text-white mb-1">
            <TextScramble text={readingSteps[readingStep]} />
          </h3>
          <p className="text-[13px] text-white/60 text-center max-w-xs mb-6">
            {lang === 'ml'
              ? 'ഡിവൈസിൽ വിവരങ്ങൾ വിശകലനം ചെയ്യുന്നു...'
              : 'Extracting meter readings and tariff on-device...'}
          </p>

          <div className="space-y-2 w-full max-w-xs text-left">
            {readingSteps.map((step, idx) => (
              <div key={step} className="flex items-center gap-2.5 text-[13px]">
                {idx < readingStep ? (
                  <Spinner done={true} className="size-4 shrink-0 text-emerald-400" />
                ) : idx === readingStep ? (
                  <Spinner className="size-4 shrink-0 text-[#006FEE]" />
                ) : (
                  <div className="size-4 rounded-full border border-white/20 shrink-0" />
                )}
                <span className={idx <= readingStep ? 'text-white font-medium' : 'text-white/40'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 3: OCR VERIFICATION (Section 32) */}
      {stage === 'verify' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <span className="text-[11px] font-semibold text-[var(--tertiary)] uppercase tracking-wider block">
                {lang === 'ml' ? 'കണ്ടെത്തിയ വിവരങ്ങൾ' : 'VERIFIED READINGS'}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                {lang === 'ml' ? 'വിവരങ്ങൾ ശരിയാണോ?' : 'Does this look right?'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {!previewUrl && extractedData.isSupportedBillType !== false && activeProvider.coverageStatus === 'FULL' && (
                <RubberStamp text={`${activeProvider.shortName} VERIFIED`} subtext="OCR MATCH" color="emerald" className="scale-90 origin-right" />
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[13px] font-medium text-[var(--accent)] flex items-center gap-1 active:opacity-60 transition-opacity"
              >
                <Edit3 style={{ width: '14px', height: '14px' }} />
                <span>{isEditing ? (lang === 'ml' ? 'പൂർത്തിയായി' : 'Done') : (lang === 'ml' ? 'മാറ്റുക' : 'Edit')}</span>
              </button>
            </div>
          </div>

          {/* Identified Provider Banner */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {lang === 'ml' ? 'കണ്ടെത്തിയ വൈദ്യുതി ബോർഡ്' : 'Identified Provider'}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {activeProvider.coverageStatus}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-slate-900">
                  {activeProvider.displayName} ({activeProvider.state})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsProviderModalOpen(true)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1.5 rounded-lg transition-colors min-h-[32px] flex items-center"
            >
              {lang === 'ml' ? 'മാറ്റുക' : 'Change'}
            </button>
          </div>

          {/* Image Quality Diagnostic Alert */}
          {qualityReport && !qualityReport.isAcceptable && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{qualityReport.recommendation || (lang === 'ml' ? 'ഫോട്ടോ വ്യക്തമല്ല. റീഡിംഗുകൾ പരിശോധിക്കുക.' : 'Low photo clarity. Please verify the readings carefully.')}</span>
            </div>
          )}

          {/* Document Preview Thumbnail */}
          {previewUrl && (
            <div className="relative rounded-[var(--radius-md)] bg-[var(--surface-secondary)] border border-[var(--border)] p-3 text-center overflow-hidden">
              {extractedData.isSupportedBillType !== false && activeProvider.coverageStatus === 'FULL' && (
                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                  <RubberStamp text={`${activeProvider.regulatorId.toUpperCase()} 24-25`} subtext="OCR VERIFIED" color="emerald" />
                </div>
              )}
              <div className="flex justify-between items-center text-[12px] text-[var(--secondary)] pb-1.5">
                <span>{lang === 'ml' ? 'ബിൽ ചിത്രം' : 'Bill image'}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRotate}
                    className="flex items-center gap-1 text-[12px] font-medium text-[var(--accent)]"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>Rotate</span>
                  </button>
                  <button
                    onClick={() => setStage('upload')}
                    className="flex items-center gap-1 text-[12px] font-medium text-[var(--secondary)]"
                  >
                    <X className="h-3 w-3" />
                    <span>Replace</span>
                  </button>
                </div>
              </div>
              {/* LensReveal interactive loupe for fine-print inspection */}
              <div style={{ transform: `rotate(${rotationAngle}deg)`, transition: 'transform 200ms ease' }}>
                <LensReveal
                  imageSrc={previewUrl!}
                  zoomLevel={2.5}
                  lensSize={130}
                  alt="Uploaded KSEB Bill"
                  annotations={[
                    { x: 25, y: 20, label: 'Consumer Number' },
                    { x: 70, y: 42, label: 'Present Reading' },
                    { x: 45, y: 75, label: 'Total Amount' },
                  ]}
                  className="max-h-44"
                />
              </div>
            </div>
          )}

          {/* Section 32: Clean Grouped Layout with Checkmarks */}
          <div className="ios-grouped-list">
            {/* Previous Reading */}
            <div className="ios-row">
              <span className="text-[14px] text-[var(--secondary)]">Previous reading</span>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={extractedData.previousReading}
                  onChange={e => handleFieldChange('previousReading', e.target.value)}
                  className="rounded-lg border border-[var(--border)] px-2 py-1 text-right font-medium text-[15px] num-tabular w-28"
                />
              ) : (
                <div className="flex items-center gap-1.5 font-semibold text-[15px] text-[var(--foreground)] num-tabular">
                  <span>{extractedData.previousReading.toLocaleString()}</span>
                  <span className="text-[var(--success)] font-bold text-[14px]">✓</span>
                </div>
              )}
            </div>

            {/* Current Reading */}
            <div className="ios-row">
              <span className="text-[14px] text-[var(--secondary)]">Current reading</span>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={extractedData.presentReading}
                  onChange={e => handleFieldChange('presentReading', e.target.value)}
                  className="rounded-lg border border-[var(--border)] px-2 py-1 text-right font-medium text-[15px] num-tabular w-28"
                />
              ) : (
                <div className="flex items-center gap-1.5 font-semibold text-[15px] text-[var(--foreground)] num-tabular">
                  <span>{extractedData.presentReading.toLocaleString()}</span>
                  <span className="text-[var(--success)] font-bold text-[14px]">✓</span>
                </div>
              )}
            </div>

            {/* Usage */}
            <div className="ios-row">
              <span className="text-[14px] text-[var(--secondary)]">Usage</span>
              <div className="flex items-center gap-1.5 font-semibold text-[15px] text-[var(--foreground)] num-tabular">
                <span>{extractedData.consumedUnits} units</span>
                <span className="text-[var(--success)] font-bold text-[14px]">✓</span>
              </div>
            </div>

            {/* Tariff */}
            <div className="ios-row">
              <span className="text-[14px] text-[var(--secondary)]">Tariff</span>
              <div className="flex items-center gap-1.5 font-semibold text-[15px] text-[var(--foreground)]">
                <span>{extractedData.tariff}</span>
                <span className="text-[var(--success)] font-bold text-[14px]">✓</span>
              </div>
            </div>

            {/* Billing */}
            <div className="ios-row">
              <span className="text-[14px] text-[var(--secondary)]">Billing</span>
              <div className="flex items-center gap-1.5 font-semibold text-[15px] text-[var(--foreground)]">
                <span>{extractedData.billingCycle === 'bi-monthly' ? 'Bi-monthly' : 'Monthly'}</span>
                <span className="text-[var(--success)] font-bold text-[14px]">✓</span>
              </div>
            </div>
          </div>

          {/* Unsupported tariff alert */}
          {extractedData.isSupportedBillType === false && (
            <div className="border-l-2 border-[var(--warning)] pl-3 py-1 text-[13px] text-[var(--warning-text)] space-y-1">
              <p className="font-semibold">
                {lang === 'ml' ? 'ഈ ബിൽ തരം നിലവിൽ ലഭ്യമല്ല' : "This bill type isn't supported yet."}
              </p>
              <p className="text-[12px] text-[var(--secondary)]">
                {extractedData.unsupportedReason || 'BILLWISE currently supports domestic LT-1A tariffs.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleConfirm}
              className="ios-btn-primary w-full"
            >
              <span>{lang === 'ml' ? 'സ്ഥിരീകരിച്ച് തുടരുക' : 'Confirm and predict'}</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>

            <button
              onClick={() => setStage('upload')}
              className="ios-btn-secondary w-full"
            >
              {lang === 'ml' ? 'വീണ്ടും സ്കാൻ ചെയ്യുക' : 'Scan another bill'}
            </button>
          </div>
        </div>
      )}

      {/* Provider Selection Sheet / Modal */}
      <ProviderSelectModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        onSelectProvider={(p) => {
          setActiveProvider(p);
          setExtractedData(prev => ({
            ...prev,
            tariff: p.supportedTariffCategories[0] || prev.tariff,
          }));
        }}
        selectedProviderId={activeProvider.id}
      />
    </div>
  );
}
