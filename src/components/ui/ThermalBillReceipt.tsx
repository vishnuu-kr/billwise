'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Printer, Check } from 'lucide-react';
import { ReceiptPrinter, type ReceiptLine } from './ReceiptPrinter';

export interface ThermalBillReceiptProps {
  billData: {
    consumerNo?: string;
    sectionName?: string;
    billingCycle?: string;
    units: number;
    energyCharge: number;
    fixedCharge: number;
    meterRent?: number;
    fuelSurcharge?: number;
    duty: number;
    subsidyAmount?: number;
    totalAmount: number;
    tariffCode?: string;
    phase?: string;
  };
  className?: string;
}

export function ThermalBillReceipt({ billData, className }: ThermalBillReceiptProps) {
  const [downloaded, setDownloaded] = useState(false);

  const lines: ReceiptLine[] = useMemo(() => {
    return [
      { kind: 'title', text: 'KSEB INVOICE' },
      { kind: 'center', text: 'KERALA STATE ELEC. BOARD' },
      { kind: 'center', text: `${billData.billingCycle || 'Bi-Monthly (60 Days)'}` },
      { kind: 'rule' },
      { kind: 'row', left: 'Consumer No:', right: billData.consumerNo || '1155-DOM' },
      { kind: 'row', left: 'Section:', right: billData.sectionName || 'KSEB Office' },
      { kind: 'row', left: 'Tariff / Phase:', right: `${billData.tariffCode || 'LT-1A'} · ${billData.phase?.toLowerCase().includes('three') ? '3-Ph' : '1-Ph'}` },
      { kind: 'row', left: 'Total Units:', right: `${billData.units} kWh` },
      { kind: 'rule' },
      { kind: 'row', left: 'Energy Charge', right: `₹${billData.energyCharge.toFixed(2)}` },
      { kind: 'row', left: 'Fixed Charge', right: `₹${billData.fixedCharge.toFixed(2)}` },
      { kind: 'row', left: 'Duty (10% Tax)', right: `₹${billData.duty.toFixed(2)}` },
      ...(billData.fuelSurcharge
        ? [{ kind: 'row' as const, left: 'Fuel Surcharge', right: `₹${billData.fuelSurcharge.toFixed(2)}` }]
        : []),
      ...(billData.meterRent
        ? [{ kind: 'row' as const, left: 'Meter Rent & GST', right: `₹${billData.meterRent.toFixed(2)}` }]
        : []),
      ...(billData.subsidyAmount && billData.subsidyAmount > 0
        ? [{ kind: 'row' as const, left: 'Govt Subsidy', right: `-₹${billData.subsidyAmount.toFixed(2)}` }]
        : []),
      { kind: 'rule', char: '=' },
      { kind: 'total', left: 'TOTAL DUE', right: `₹${Math.round(billData.totalAmount).toLocaleString('en-IN')}` },
      { kind: 'rule' },
      { kind: 'barcode', code: `KSEB${billData.units}U${Math.round(billData.totalAmount)}` },
      { kind: 'center', text: 'Verified via KSERC 2024-25' },
      { kind: 'center', text: 'Conserve Power • Go Green' },
    ];
  }, [billData]);

  const handlePrint = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const totalFormatted = `₹${Math.round(billData.totalAmount).toLocaleString('en-IN')}`;

  return (
    <div className={cn('flex flex-col items-center py-2 w-full', className)}>
      <ReceiptPrinter lines={lines} total={totalFormatted} />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface-muted)] text-[var(--secondary)] hover:text-[var(--foreground)] text-[12px] font-medium transition-transform active:scale-95"
        >
          {downloaded ? <Check className="size-3.5 text-emerald-500" /> : <Printer className="size-3.5" />}
          <span>{downloaded ? 'Opening System Dialog...' : 'Save or Print PDF'}</span>
        </button>
      </div>
    </div>
  );
}
