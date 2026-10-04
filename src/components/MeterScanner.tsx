'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { extractMeterReadingFromImage } from '@/lib/ocr/extractor';
import { MeterScanResult } from '@/types';
import {
  Camera,
  Upload,
  X,
  ArrowRight,
} from 'lucide-react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { TextScramble } from '@/components/ui/TextScramble';
import { WheelPicker } from '@/components/ui/WheelPicker';
import { PixelLoader } from '@/components/ui/PixelLoader';

interface MeterScannerProps {
  onReadingConfirmed: (reading: number) => void;
  onEnterManually?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function MeterScanner({
  onReadingConfirmed,
  onEnterManually,
  onClose,
  isModal = false,
}: MeterScannerProps) {
  const { lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<'idle' | 'scanning' | 'detected'>('idle');
  const [scanResult, setScanResult] = useState<MeterScanResult | null>(null);

  const processFile = async (file: File) => {
    setState('scanning');

    try {
      const res = await extractMeterReadingFromImage(file);
      setScanResult(res);
      setState('detected');
    } catch {
      setScanResult({
        detectedReading: null,
        confidence: 0,
        rawText: '',
        status: 'failed',
        message: 'Could not read meter display. Please enter digits manually.',
      });
      setState('detected');
    }
  };

  const handleUseSample = (val: number) => {
    setScanResult({
      detectedReading: val,
      confidence: 0.96,
      rawText: `${val} kWh`,
      status: 'success',
      message: `Detected reading: ${val.toLocaleString()}`,
    });
    setState('detected');
  };

  const handleConfirm = () => {
    if (scanResult?.detectedReading !== null && scanResult?.detectedReading !== undefined) {
      onReadingConfirmed(scanResult.detectedReading);
    }
  };

  const content = (
    <div className="w-full space-y-4">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
      />

      {/* VIEW 1: CAMERA FRAMING CANVAS (Section 33) */}
      {state === 'idle' && (
        <div className="space-y-4">
          <div className="relative w-full aspect-[4/3] rounded-[var(--radius-sheet)] bg-[#121316] p-6 flex flex-col justify-between text-white overflow-hidden shadow-md">
            {/* Viewfinder Bounding Box */}
            <div className="my-auto mx-auto w-4/5 h-20 rounded-xl border border-white/40 flex items-center justify-center relative">
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
              <span className="text-[12px] font-mono tracking-widest text-white/70 uppercase">
                kWh Reading Area
              </span>
            </div>

            <p className="text-[13px] text-white/80 text-center font-medium">
              {lang === 'ml' ? 'മീറ്ററിലെ kWh അക്കങ്ങൾ കണ്ടെത്തുക' : 'Find the kWh reading on your meter'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="ios-btn-primary w-full"
            >
              <Camera style={{ width: '18px', height: '18px' }} />
              <span>{lang === 'ml' ? 'ക്യാമറ തുറക്കൂ' : 'Capture meter'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="ios-btn-secondary w-full"
            >
              <Upload style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />
              <span>{lang === 'ml' ? 'ഫോട്ടോ നൽകൂ' : 'Upload photo'}</span>
            </button>
          </div>

          {/* Interactive Marching Edge File Dropzone */}
          <FileDropzone
            onFileSelect={processFile}
            label={lang === 'ml' ? 'മീറ്റർ ഫോട്ടോ ഇവിടെ ഡ്രോപ്പ് ചെയ്യുക' : 'Drag & drop meter photo here'}
            sublabel="PNG, JPG, or PDF camera capture"
          />

          {/* Test sample link */}
          <div className="flex items-center justify-between text-[12px] text-[var(--tertiary)] pt-1 px-1">
            <span>{lang === 'ml' ? 'ടെസ്റ്റ് റീഡിംഗ്:' : 'Test sample:'}</span>
            <button
              onClick={() => handleUseSample(10412)}
              className="text-[var(--accent)] font-medium hover:underline"
            >
              Use 10,412 kWh sample
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: SCANNING PROGRESS WITH PIXEL LOADER & TEXT SCRAMBLE */}
      {state === 'scanning' && (
        <div className="w-full aspect-[4/3] rounded-[var(--radius-sheet)] bg-[#121316] flex flex-col items-center justify-center text-white p-6 space-y-2 shadow-md">
          <PixelLoader size={6} label="" className="mb-1" />
          <p className="text-[15px] font-medium text-white">
            <TextScramble text={lang === 'ml' ? 'റീഡിംഗ് പരിശോധിക്കുന്നു...' : 'SCANNING KSEB METER DISPLAY...'} />
          </p>
          <p className="text-[12px] text-white/60">
            <TextScramble text={lang === 'ml' ? 'അക്കങ്ങൾ കണ്ടെത്തുന്നു' : 'DETECTING 5-DIGIT kWh REGISTER'} />
          </p>
        </div>
      )}

      {/* VIEW 3: DETECTED READING WITH 3D WHEEL PICKER */}
      {state === 'detected' && scanResult && (
        <div className="space-y-4">
          {scanResult.detectedReading !== null ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 text-center space-y-3 shadow-[var(--shadow-subtle)]">
              <span className="text-[12px] font-medium text-[var(--tertiary)] block">
                {lang === 'ml' ? 'കണ്ടെത്തിയ റീഡിംഗ് (മാറ്റാൻ തിരിച്ചറിയുക)' : 'Detected Reading (Rotate dials to adjust)'}
              </span>

              {/* 3D Wheel Picker for individual digit tweaking */}
              <div className="flex justify-center py-2">
                <WheelPicker
                  value={String(scanResult.detectedReading)}
                  length={5}
                  onChange={(newVal) =>
                    setScanResult((prev) => (prev ? { ...prev, detectedReading: Number(newVal) } : null))
                  }
                />
              </div>

              <p className="text-[12px] text-[var(--secondary)]">
                {lang === 'ml'
                  ? 'നിങ്ങളുടെ മീറ്റർ ഡിസ്പ്ലേയുമായി ഒത്തുനോക്കുക'
                  : 'Please check that this matches your meter dials'}
              </p>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleConfirm}
                  className="ios-btn-primary w-full"
                >
                  <span>{lang === 'ml' ? 'ഈ റീഡിംഗ് ഉപയോഗിക്കുക' : 'Confirm reading'}</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>

                {onEnterManually && (
                  <button
                    onClick={onEnterManually}
                    className="ios-btn-secondary w-full"
                  >
                    <span>{lang === 'ml' ? 'മാനുവലായി നൽകുക' : 'Enter manually'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 text-center space-y-3 shadow-[var(--shadow-subtle)]">
              <span className="text-[13px] font-medium text-[var(--warning-text)] block">
                {lang === 'ml' ? 'റീഡിംഗ് കണ്ടെത്താനായില്ല' : 'Could not read meter clearly'}
              </span>
              <p className="text-[12px] text-[var(--secondary)]">
                {scanResult.message || 'Please type your reading manually.'}
              </p>
              <div className="pt-2 space-y-2">
                {onEnterManually && (
                  <button
                    onClick={onEnterManually}
                    className="ios-btn-primary w-full"
                  >
                    <span>{lang === 'ml' ? 'മാനുവലായി നൽകുക' : 'Enter manually'}</span>
                  </button>
                )}
                <button
                  onClick={() => setState('idle')}
                  className="ios-btn-secondary w-full"
                >
                  <span>{lang === 'ml' ? 'വീണ്ടും ശ്രമിക്കുക' : 'Try again'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fade-in"
        style={{ background: 'rgba(0, 0, 0, 0.36)', backdropFilter: 'blur(4px)' }}
      >
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        <div className="relative z-10 w-full sm:max-w-md ios-sheet sm:rounded-3xl p-5 pb-8 sm:pb-6 space-y-4">
          <div className="sm:hidden flex justify-center pb-2">
            <div className="ios-sheet-handle" />
          </div>
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              {lang === 'ml' ? 'മീറ്റർ സ്കാൻ' : 'Scan meter'}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-black/[0.05] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--foreground)] active:scale-95 transition-all"
                aria-label="Close"
              >
                <X style={{ width: '15px', height: '15px' }} />
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
