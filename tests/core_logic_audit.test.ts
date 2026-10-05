import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBill, calculateConsumedUnits } from '../src/lib/calculation/engine';
import { calculateUniversalBill } from '../src/lib/electricity/engine/universalEngine';
import { selectTariffVersion } from '../src/lib/electricity/tariffs/registry';
import { normalizeOcrNumericString, validateOcrConsistency } from '../src/lib/ocr/extractor';
import { predictUsage } from '../src/lib/prediction/engine';
import { evaluatePersonalBaseline, evaluateConsumptionAnomaly, normalizeUsageMetrics, formatInr } from '../src/lib/electricity/scoring/baselineEngine';
import { storageManager } from '../src/lib/storage';
import { detectProviderFromBillText } from '../src/lib/electricity/detection/providerDetector';
import { HistoryRecord } from '../src/types';

describe('PHASE 17 Core Logic Audit — Section 4 & 5: Meter Reading & Consumption Validation', () => {
  it('correctly calculates units for normal consumption (present - previous)', () => {
    const res = calculateConsumedUnits({ previousReading: 10055, presentReading: 10295 });
    expect(res.units).toBe(240);
    expect(res.isConsistent).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('rejects inverted reading (present < previous) when meter was not replaced', () => {
    const res = calculateConsumedUnits({ previousReading: 10500, presentReading: 10200 });
    expect(res.units).toBe(0);
    expect(res.error).toContain('lower than your previous reading');
  });

  it('handles legitimate 5-digit meter rollover (99950 to 00020 = 70 units)', () => {
    const res = calculateConsumedUnits({
      previousReading: 99950,
      presentReading: 20,
      meterDigits: 5,
    });
    expect(res.units).toBe(70);
    expect(res.isConsistent).toBe(true);
  });

  it('handles meter replacement with separate old and new meter readings', () => {
    const res = calculateConsumedUnits({
      previousReading: 12000,
      oldMeterFinalReading: 12150, // 150 units on old meter
      newMeterInitialReading: 0,
      presentReading: 50,          // 50 units on new meter
      isMeterReplaced: true,
    });
    expect(res.units).toBe(200);
    expect(res.isConsistent).toBe(true);
  });

  it('flags discrepancy with exact phrase when stated units does not match readings delta', () => {
    const res = calculateConsumedUnits({
      previousReading: 10055,
      presentReading: 10295, // delta = 240
      units: 300,            // stated = 300 (mismatch!)
    });
    expect(res.isConsistent).toBe(false);
    expect(res.computedFromReadings).toBe(240);
    expect(res.discrepancyNote).toContain("Bill readings don't match the stated usage.");
  });
});

describe('PHASE 17 Core Logic Audit — Section 6 & 7: OCR Normalization & Confidence', () => {
  it('normalizes common OCR character confusions: O vs 0, I vs 1, S vs 5, B vs 8', () => {
    // 1,O48 -> 1048
    const resO = normalizeOcrNumericString('1,O48');
    expect(resO.normalized).toBe('1048');
    expect(resO.numericValue).toBe(1048);
    expect(resO.wasAmbiguous).toBe(true);

    // 1I48 -> 1148
    const resI = normalizeOcrNumericString('1I48');
    expect(resI.normalized).toBe('1148');
    expect(resI.numericValue).toBe(1148);

    // 2S0 -> 250
    const resS = normalizeOcrNumericString('2S0');
    expect(resS.normalized).toBe('250');
    expect(resS.numericValue).toBe(250);

    // B200 -> 8200
    const resB = normalizeOcrNumericString('B200');
    expect(resB.normalized).toBe('8200');
    expect(resB.numericValue).toBe(8200);
  });

  it('strips currency symbols and unit suffixes accurately', () => {
    const resRupee = normalizeOcrNumericString('₹1,148');
    expect(resRupee.numericValue).toBe(1148);

    const resRs = normalizeOcrNumericString('Rs. 2,450.50');
    expect(resRs.numericValue).toBe(2450.5);

    const resKwh = normalizeOcrNumericString('240 kWh');
    expect(resKwh.numericValue).toBe(240);
  });

  it('diagnoses discrepancy types accurately in validateOcrConsistency', () => {
    // Exact match
    const match = validateOcrConsistency(1000, 1240, 240);
    expect(match.isConsistent).toBe(true);
    expect(match.discrepancyType).toBe('NONE');

    // Power of 10 digit shift
    const shift = validateOcrConsistency(1000, 1240, 140);
    expect(shift.isConsistent).toBe(false);
    expect(shift.discrepancyType).toBe('OCR_DIGIT_SHIFT');
    expect(shift.warningMessage).toContain("Bill readings don't match the stated usage.");

    // Multiplying factor MF=10
    const mf = validateOcrConsistency(100, 120, 200); // 20 units * 10 = 200
    expect(mf.isConsistent).toBe(false);
    expect(mf.discrepancyType).toBe('MULTIPLIER_FACTOR');

    // Reversed reading
    const rev = validateOcrConsistency(1200, 1100, 100);
    expect(rev.isConsistent).toBe(false);
    expect(rev.discrepancyType).toBe('REVERSED_READING');
  });

  it('handles unknown provider text gracefully without guessing KSEB', () => {
    const unknownText = 'NORTH BIHAR POWER DISTRIBUTION CO LTD PREV 1000 PRES 1150 UNITS 150';
    const detection = detectProviderFromBillText(unknownText);
    expect(detection.confidenceScore).toBeLessThan(0.6);
  });
});

describe('PHASE 17 Core Logic Audit — Section 8, 31, 32: Universal Provider & Tariff Fail-Safe Logic', () => {
  it('throws clear error for unknown provider without silently falling back to KSEB', () => {
    expect(() => {
      calculateUniversalBill({
        providerId: 'non-existent-discom',
        units: 100,
        billingCycle: 'MONTHLY',
        phase: 'single',
      });
    }).toThrow(/Unknown electricity provider: "non-existent-discom"/);
  });

  it('throws clear error when provider is missing', () => {
    expect(() => {
      calculateUniversalBill({
        providerId: '',
        units: 100,
        billingCycle: 'MONTHLY',
        phase: 'single',
      });
    }).toThrow(/Provider ID is required/);
  });

  it('rejects NaN or non-finite units in universal engine', () => {
    expect(() => {
      calculateUniversalBill({
        providerId: 'kseb',
        units: NaN,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
      });
    }).toThrow(/Consumed units cannot be NaN/);

    expect(() => {
      calculateUniversalBill({
        providerId: 'kseb',
        units: Infinity,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
      });
    }).toThrow(/Consumed units must be a finite number/);
  });
});

describe('PHASE 17 Core Logic Audit — Section 9 & 10: Deterministic Tariff Version Selection', () => {
  it('deterministically selects active tariff version for KSEB in 2026', () => {
    const result = selectTariffVersion('kseb', { asOfDate: '2026-10-04' });
    expect(result.status).toBe('EXACT_MATCH');
    expect(result.tariff?.id).toBe('kseb-lt1a-2024');
  });

  it('returns ZERO_MATCHES for unknown provider', () => {
    const result = selectTariffVersion('fake-provider', { asOfDate: '2026-10-04' });
    expect(result.status).toBe('ZERO_MATCHES');
    expect(result.tariff).toBeNull();
  });

  it('detects FUTURE_TARIFF when bill date is before any effective tariff', () => {
    const result = selectTariffVersion('kseb', { asOfDate: '2020-01-01' });
    expect(result.status).toBe('FUTURE_TARIFF');
  });
});

describe('PHASE 17 Core Logic Audit — Section 11, 12, 13: Slab Calculation & Subtotal Invariants', () => {
  const boundaryUnits = [0, 1, 79, 80, 81, 159, 160, 161, 199, 200, 201, 239, 240, 241, 249, 250, 251, 499, 500, 501, 1000];

  boundaryUnits.forEach((units) => {
    it(`satisfies subtotal reconciliation invariant for ${units} units`, () => {
      const bill = calculateBill({ units, billingCycle: 'bi-monthly', phase: 'single' });

      // Invariant 1: subtotal = grossEnergy + grossFixed + fuelAdj + duty + meterRent - subsidies
      const expectedNetSubtotal = Number((
        bill.grossEnergyCharge +
        bill.grossFixedCharge +
        bill.fuelAdjustment +
        bill.electricityDuty +
        bill.meterRent -
        bill.totalSubsidies
      ).toFixed(2));

      expect(bill.subtotal).toBeCloseTo(expectedNetSubtotal, 2);

      // Invariant 2: total = Math.round(subtotal)
      expect(bill.total).toBe(Math.max(0, Math.round(bill.subtotal)));

      // Invariant 3: roundOff = total - subtotal
      expect(Number((bill.total - bill.subtotal).toFixed(2))).toBeCloseTo(bill.roundOff, 2);

      // Invariant 4: No NaN or Infinity anywhere
      expect(isNaN(bill.total)).toBe(false);
      expect(isFinite(bill.total)).toBe(true);
      expect(bill.total).toBeGreaterThanOrEqual(0);
    });
  });

  it('verifies exact golden bill reference: 240 units = ₹1,148', () => {
    const bill = calculateBill({ units: 240, billingCycle: 'bi-monthly', phase: 'single' });
    expect(bill.total).toBe(1148);
    expect(bill.grossEnergyCharge).toBe(973.8);
    expect(bill.grossFixedCharge).toBe(210);
    expect(bill.electricityDuty).toBe(97.4);
    expect(bill.fuelAdjustment).toBe(2.4);
    expect(bill.meterRent).toBe(12);
    expect(bill.totalSubsidies).toBe(148);
    expect(bill.subtotal).toBe(1147.6);
    expect(bill.roundOff).toBe(0.4);
  });

  it('verifies telescopic to non-telescopic cliff transition at 500 vs 501 units', () => {
    const bill500 = calculateBill({ units: 500, billingCycle: 'bi-monthly', phase: 'single' });
    const bill501 = calculateBill({ units: 501, billingCycle: 'bi-monthly', phase: 'single' });

    expect(bill500.isTelescopicApplied).toBe(true);
    expect(bill501.isTelescopicApplied).toBe(false);

    // 501 units billed at flat rate ₹6.60 across all units
    expect(bill501.grossEnergyCharge).toBe(Number((501 * 6.60).toFixed(2)));
    expect(bill501.total).toBeGreaterThan(bill500.total + 500);
  });

  it('verifies subsidy cliff boundary: 240 units has ₹148 subsidy vs 241 has ₹0', () => {
    const bill240 = calculateBill({ units: 240, billingCycle: 'bi-monthly', phase: 'single' });
    const bill241 = calculateBill({ units: 241, billingCycle: 'bi-monthly', phase: 'single' });

    expect(bill240.totalSubsidies).toBe(148);
    expect(bill241.totalSubsidies).toBe(0);
  });
});

describe('PHASE 17 Core Logic Audit — Section 47: Calculation Traceability', () => {
  it('produces a complete, step-by-step mathematical trace for bill calculations', () => {
    const bill = calculateBill({ units: 240, billingCycle: 'bi-monthly', phase: 'single' });

    expect(bill.trace).toBeDefined();
    expect(bill.trace?.length).toBeGreaterThanOrEqual(6);

    const step1 = bill.trace?.find(t => t.component === 'Energy Charge');
    const step2 = bill.trace?.find(t => t.component === 'Fixed Charge');
    const step3 = bill.trace?.find(t => t.component.includes('Fuel Adjustment'));
    const step4 = bill.trace?.find(t => t.component.includes('Duty'));
    const stepFinal = bill.trace?.find(t => t.component.includes('Round Off'));

    expect(step1?.amount).toBe(973.8);
    expect(step2?.amount).toBe(210);
    expect(step3?.amount).toBe(2.4);
    expect(step4?.amount).toBe(97.4);
    expect(stepFinal?.runningTotal).toBe(1148);
  });
});

describe('PHASE 17 Core Logic Audit — Section 21 & 22: Prediction Engine & Edge Cases', () => {
  it('says "Not enough data yet" when daysElapsed <= 2 and units is 0 without history', () => {
    const pred = predictUsage({
      currentCycleUnits: 0,
      daysElapsed: 1,
      totalCycleDays: 60,
    });
    expect(pred.confidence).toBe('low');
    expect(pred.confidenceReason).toContain('Not enough data yet');
  });

  it('says "Not enough data yet" when readings are missing', () => {
    const pred = predictUsage({
      daysElapsed: 10,
      totalCycleDays: 60,
    });
    expect(pred.confidence).toBe('low');
    expect(pred.confidenceReason).toContain('Not enough data yet');
  });

  it('guards against absurd run rates (> 100 units/day) by capping and alerting', () => {
    const pred = predictUsage({
      currentCycleUnits: 800,
      daysElapsed: 4, // 200 units/day -> would project 12,000 units
      totalCycleDays: 60,
    });
    expect(pred.confidence).toBe('low');
    expect(pred.confidenceReason).toContain('Extremely high usage pace detected');
    expect(pred.projectedUnits).toBeLessThanOrEqual(5000);
  });

  it('computes accurate run rate for mid-cycle reading', () => {
    const pred = predictUsage({
      currentCycleUnits: 120,
      daysElapsed: 30,
      totalCycleDays: 60,
    });
    expect(pred.unitsPerDay).toBe(4);
    expect(pred.projectedUnits).toBe(240);
    expect(pred.estimatedBill).toBe(1148);
  });
});

describe('PHASE 17 Core Logic Audit — Section 24 & 25: Personal Baseline & Anomaly Engine', () => {
  const sampleRecord1: HistoryRecord = {
    id: 'h1',
    timestamp: '2026-08-01T00:00:00Z',
    dateLabel: 'Aug 2026',
    consumedUnits: 240,
    predictedBill: 1148,
    actualBill: 1148,
    billingCycle: 'bi-monthly',
    source: 'scan',
  };

  const sampleRecord2: HistoryRecord = {
    id: 'h2',
    timestamp: '2026-06-01T00:00:00Z',
    dateLabel: 'Jun 2026',
    consumedUnits: 220,
    predictedBill: 1050,
    actualBill: 1040,
    billingCycle: 'bi-monthly',
    source: 'scan',
  };

  it('classifies baseline state accurately across 0, 1, and 2+ records', () => {
    const base0 = evaluatePersonalBaseline([]);
    expect(base0.status).toBe('NO_BASELINE');

    const base1 = evaluatePersonalBaseline([sampleRecord1]);
    expect(base1.status).toBe('LIMITED_BASELINE');
    expect(base1.averageUnits).toBe(240);

    const base2 = evaluatePersonalBaseline([sampleRecord1, sampleRecord2]);
    expect(base2.status).toBe('ESTABLISHED_BASELINE');
    expect(base2.averageUnits).toBe(230);
  });

  it('does NOT trigger UNUSUAL on limited baseline (1 record) unless extreme', () => {
    const base1 = evaluatePersonalBaseline([sampleRecord1]);
    const anomaly = evaluateConsumptionAnomaly(320, base1); // +33%
    expect(anomaly.status).not.toBe('UNUSUAL');
  });

  it('triggers UNUSUAL when consumption deviates > 50% from established baseline', () => {
    const base2 = evaluatePersonalBaseline([sampleRecord1, sampleRecord2]); // avg 230
    const anomaly = evaluateConsumptionAnomaly(380, base2); // +65%
    expect(anomaly.status).toBe('UNUSUAL');
    expect(anomaly.dominantDriver).toContain('Surge');
  });

  it('triggers CHECK when consumption crosses the 240 subsidy ceiling', () => {
    const base2 = evaluatePersonalBaseline([sampleRecord1, sampleRecord2]);
    const anomaly = evaluateConsumptionAnomaly(245, base2, { hasCrossedSubsidyCliff: true });
    expect(anomaly.status).toBe('CHECK');
    expect(anomaly.dominantDriver).toContain('Subsidy');
  });

  it('triggers UNUSUAL on reading inconsistency regardless of baseline', () => {
    const base2 = evaluatePersonalBaseline([sampleRecord1, sampleRecord2]);
    const anomaly = evaluateConsumptionAnomaly(240, base2, { isReadingInconsistent: true });
    expect(anomaly.status).toBe('UNUSUAL');
    expect(anomaly.dominantDriver).toContain('Inconsistency');
  });
});

describe('PHASE 17 Core Logic Audit — Section 20 & 45: Normalization & Currency Formatting', () => {
  it('normalizes consumption across different billing cycles', () => {
    const biMonthly = normalizeUsageMetrics(240, 'bi-monthly');
    expect(biMonthly.dailyAverageUnits).toBe(4.0);
    expect(biMonthly.monthlyEquivalentUnits).toBe(120);

    const monthly = normalizeUsageMetrics(120, 'monthly');
    expect(monthly.dailyAverageUnits).toBe(4.0);
    expect(monthly.monthlyEquivalentUnits).toBe(120);
  });

  it('formats Indian currency accurately with Lakhs, negative values, and zero', () => {
    expect(formatInr(0)).toBe('₹0');
    expect(formatInr(1148)).toBe('₹1,148');
    expect(formatInr(100000)).toBe('₹1,00,000'); // 1 Lakh
    expect(formatInr(-72)).toBe('−₹72');
    expect(formatInr(97.4, { showPaise: true })).toBe('₹97.40');
  });
});

describe('PHASE 17 Core Logic Audit — Section 38: History Deduplication', () => {
  beforeEach(() => {
    storageManager.clearAllData();
  });

  it('prevents duplicate record insertion for identical cycle readings on refresh/re-save', () => {
    const recordPayload = {
      dateLabel: 'Oct 2026',
      meterReading: 10450,
      consumedUnits: 155,
      predictedBill: 850,
      actualBill: 848,
      billingCycle: 'bi-monthly' as const,
      source: 'manual' as const,
    };

    const first = storageManager.addRecord(recordPayload);
    expect(storageManager.getHistory().length).toBe(1);

    // Second call with same readings (e.g. page refresh / double tap)
    const second = storageManager.addRecord(recordPayload);
    expect(storageManager.getHistory().length).toBe(1);
    expect(second.id).toBe(first.id);
  });
});
