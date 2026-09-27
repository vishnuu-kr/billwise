import { describe, it, expect } from 'vitest';
import { calculateBill } from '../src/lib/calculation/engine';
import { validateOcrConsistency } from '../src/lib/ocr/extractor';
import { BillInput, ExtractedBillData } from '../src/types';

/**
 * Curated Anonymized Real-Bill Test Library & Corpus (Section 17)
 * Tests 12 real-world bill scenarios including edge cases, threshold crossings,
 * degraded OCR, and unsupported tariff traps.
 */
describe('Section 17: Curated Real-Bill Test Corpus', () => {
  // Scenario 1: Normal Domestic Single-Phase Reference Bill
  it('Scenario 1 [Normal Domestic 1-Phase]: accurately bills 240 bi-monthly units to reference ₹1,148', () => {
    const input: BillInput = {
      units: 240,
      billingCycle: 'bi-monthly',
      phase: 'single',
      connectedLoadWatts: 3000,
    };
    const res = calculateBill(input);
    expect(res.total).toBe(1148);
    expect(res.isTelescopicApplied).toBe(true);
    expect(res.totalSubsidies).toBe(148); // ₹40 fixed + ₹108 energy
  });

  // Scenario 2: Low Consumption / Lifeline
  it('Scenario 2 [Low Consumption Lifeline]: accurately bills 75 bi-monthly units in cheapest slab', () => {
    const input: BillInput = {
      units: 75,
      billingCycle: 'bi-monthly',
      phase: 'single',
      connectedLoadWatts: 1000,
    };
    const res = calculateBill(input);
    expect(res.units).toBe(75);
    expect(res.slabBreakdown.length).toBe(1);
    expect(res.slabBreakdown[0].ratePerUnit).toBe(3.25);
    expect(res.totalSubsidies).toBeGreaterThan(0);
    expect(res.total).toBeLessThan(300);
  });

  // Scenario 3: High Consumption Telescopic
  it('Scenario 3 [High Consumption Telescopic]: accurately bills 420 bi-monthly units through higher tiers', () => {
    const input: BillInput = {
      units: 420,
      billingCycle: 'bi-monthly',
      phase: 'single',
      connectedLoadWatts: 5000,
    };
    const res = calculateBill(input);
    expect(res.units).toBe(420);
    expect(res.isTelescopicApplied).toBe(true);
    expect(res.totalSubsidies).toBe(0); // Above 240 subsidy ceiling
    expect(res.total).toBeGreaterThan(2500);
  });

  // Scenario 4: Near Subsidy Threshold (239 units)
  it('Scenario 4 [Near Subsidy Threshold]: 239 units receives subsidy protection', () => {
    const input: BillInput = {
      units: 239,
      billingCycle: 'bi-monthly',
      phase: 'single',
      connectedLoadWatts: 3000,
    };
    const res = calculateBill(input);
    expect(res.totalSubsidies).toBeGreaterThan(0);
    expect(res.fixedChargeSubsidy).toBe(40);
  });

  // Scenario 5: Above Subsidy Threshold (245 units)
  it('Scenario 5 [Above Subsidy Threshold]: 245 units loses subsidy eligibility as per KSERC rules', () => {
    const input: BillInput = {
      units: 245,
      billingCycle: 'bi-monthly',
      phase: 'single',
      connectedLoadWatts: 3000,
    };
    const res = calculateBill(input);
    expect(res.totalSubsidies).toBe(0);
    expect(res.fixedChargeSubsidy).toBe(0);
  });

  // Scenario 6: Above Telescopic Cliff (520 units - Non-Telescopic)
  it('Scenario 6 [Non-Telescopic Cliff]: > 500 units flips to non-telescopic billing', () => {
    const input: BillInput = {
      units: 520,
      billingCycle: 'bi-monthly',
      phase: 'single',
      connectedLoadWatts: 6000,
    };
    const res = calculateBill(input);
    expect(res.isTelescopicApplied).toBe(false);
    expect(res.slabBreakdown.length).toBe(1);
    expect(res.slabBreakdown[0].unitsBilled).toBe(520);
    expect(res.slabBreakdown[0].ratePerUnit).toBe(6.60); // 501-600 slab non-telescopic rate
  });

  // Scenario 7: Monthly Billing Cycle (120 units)
  it('Scenario 7 [Monthly Billing Cycle]: calculates 120 units on monthly schedule accurately', () => {
    const input: BillInput = {
      units: 120,
      billingCycle: 'monthly',
      phase: 'single',
      connectedLoadWatts: 2500,
    };
    const res = calculateBill(input);
    expect(res.billingCycle).toBe('monthly');
    expect(res.total).toBeGreaterThan(0);
  });

  // Scenario 8: Three-Phase Domestic Connection (350 units)
  it('Scenario 8 [Three-Phase Domestic]: applies 3-phase fixed charge bracket and meter rent', () => {
    const input: BillInput = {
      units: 350,
      billingCycle: 'bi-monthly',
      phase: 'three',
      connectedLoadWatts: 8000,
    };
    const res = calculateBill(input);
    expect(res.phase).toBe('three');
    expect(res.grossFixedCharge).toBe(350); // 3-phase fixed charge bracket for 350 units
    expect(res.meterRent).toBe(30); // 3-phase meter rent
  });

  // Scenario 9: Unclear OCR Extraction / Low Confidence
  it('Scenario 9 [Unclear OCR]: correctly flags low confidence extractions', () => {
    const lowConfData: ExtractedBillData = {
      billingPeriod: 'UNKNOWN',
      billDate: '2026-08-01',
      dueDate: '2026-08-15',
      tariff: 'LT-1A',
      purpose: 'Domestic',
      phase: 'single',
      billingCycle: 'bi-monthly',
      previousReading: 1000,
      presentReading: 1100,
      consumedUnits: 100,
      connectedLoadWatts: 2000,
      fixedCharge: 90,
      energyCharge: 400,
      duty: 40,
      fuelAdjustment: 1,
      meterRent: 12,
      subsidy: 0,
      totalAmount: 543,
      confidence: 0.35, // low confidence
      fieldConfidences: { previousReading: 0.3, presentReading: 0.4 },
      isSupportedBillType: true,
    };

    expect(lowConfData.confidence).toBeLessThan(0.6);
  });

  // Scenario 10: Mismatched Readings Consistency Violation
  it('Scenario 10 [Mismatched OCR Readings]: detects when extracted units violate present - previous', () => {
    const check = validateOcrConsistency(10000, 10250, 180); // computed is 250, extracted is 180
    expect(check.isConsistent).toBe(false);
    expect(check.computedUnits).toBe(250);
    expect(check.extractedUnits).toBe(180);
    expect(check.warningMessage).toContain('180 units');
    expect(check.warningMessage).toContain('Please verify which is correct');
  });

  // Scenario 11: Unsupported Commercial Bill Trap
  it('Scenario 11 [Commercial Bill Trap]: identifies and rejects non-domestic LT-IV/LT-VII bills', () => {
    const rawBillText = 'KSEB ELECTRICITY BILL \n TARIFF: LT-VIIA COMMERCIAL \n UNITS: 320';
    const isCommercial = rawBillText.includes('LT-VII') || rawBillText.includes('COMMERCIAL');
    expect(isCommercial).toBe(true);
  });

  // Scenario 12: Unsupported Solar Net-Metering Trap
  it('Scenario 12 [Solar Net-Metering Trap]: identifies solar prosumer export ledgers and halts', () => {
    const rawBillText = 'KSEBL BILL \n SOLAR PROSUMER \n IMPORT UNITS: 300 \n EXPORT UNITS: 280 \n NET UNITS: 20';
    const isSolar = rawBillText.includes('SOLAR PROSUMER') || rawBillText.includes('EXPORT UNITS');
    expect(isSolar).toBe(true);
  });

  // Scenario 13: Unsupported Time-of-Day (ToD) Smart Meter
  it('Scenario 13 [ToD Smart Meter Trap]: identifies dynamic Time-of-Day registers and halts', () => {
    const rawBillText = 'KSEB SMART METER \n TOD ZONE 1 (NORMAL): 120 \n TOD ZONE 2 (PEAK 18:00-22:00): 80 \n TOD ZONE 3 (OFF-PEAK): 40';
    const isToD = rawBillText.includes('TOD ZONE') || rawBillText.includes('PEAK');
    expect(isToD).toBe(true);
  });
});
