import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBill, calculateBillDifference } from '../src/lib/calculation/engine';
import { predictUsage } from '../src/lib/prediction/engine';
import {
  validateOcrConsistency,
  parseKsebBillText,
  extractMeterReadingFromImage,
} from '../src/lib/ocr/extractor';
import { storageManager } from '../src/lib/storage';

describe('Phase 3: Bill Difference & Explainer Engine', () => {
  it('correctly categorizes difference and detects 240-unit subsidy threshold crossing', () => {
    const prevBill = calculateBill({ units: 240, billingCycle: 'bi-monthly', phase: 'single' });
    const currBill = calculateBill({ units: 286, billingCycle: 'bi-monthly', phase: 'single' });

    const diff = calculateBillDifference(prevBill, currBill);

    expect(diff.isIncrease).toBe(true);
    expect(diff.unitsDifference).toBe(46);
    expect(diff.differenceAmount).toBe(currBill.total - prevBill.total);
    expect(diff.subsidyImpactAmount).toBe(148); // Full ₹148 subsidy lost
    expect(diff.primaryDriver).toBe('240-Unit Subsidy Threshold Exceeded');
    expect(diff.primaryDriverMl).toContain('സബ്സിഡി');
    expect(diff.explanationText).toContain('240 units');
  });

  it('detects 500-unit non-telescopic cliff as primary driver', () => {
    const prevBill = calculateBill({ units: 480, billingCycle: 'bi-monthly', phase: 'single' });
    const currBill = calculateBill({ units: 520, billingCycle: 'bi-monthly', phase: 'single' });

    const diff = calculateBillDifference(prevBill, currBill);

    expect(diff.isIncrease).toBe(true);
    expect(diff.primaryDriver).toBe('500-Unit Non-Telescopic Cliff');
    expect(diff.explanationText).toContain('non-telescopic');
  });

  it('correctly handles consumption reduction with restored subsidy (< 240 units)', () => {
    const prevBill = calculateBill({ units: 280, billingCycle: 'bi-monthly', phase: 'single' });
    const currBill = calculateBill({ units: 210, billingCycle: 'bi-monthly', phase: 'single' });

    const diff = calculateBillDifference(prevBill, currBill);

    expect(diff.isIncrease).toBe(false);
    expect(diff.unitsDifference).toBe(-70);
    expect(diff.differenceAmount).toBeLessThan(0);
    expect(diff.primaryDriver).toBe('Subsidy Restored (< 240 Units)');
    expect(diff.explanationText).toContain('saving ₹');
  });

  it('correctly handles pure consumption reduction within same tariff band', () => {
    const prevBill = calculateBill({ units: 200, billingCycle: 'bi-monthly', phase: 'single' });
    const currBill = calculateBill({ units: 160, billingCycle: 'bi-monthly', phase: 'single' });

    const diff = calculateBillDifference(prevBill, currBill);

    expect(diff.isIncrease).toBe(false);
    expect(diff.unitsDifference).toBe(-40);
    expect(diff.differenceAmount).toBeLessThan(0);
    expect(diff.primaryDriver).toBe('Electricity Usage (kWh)');
  });
});

describe('Phase 3: Controllable Impact & Deterministic Savings', () => {
  it('calculates real deterministic rupee impact for -0.5 and +1.0 units/day', () => {
    const prediction = predictUsage({
      currentCycleUnits: 120,
      daysElapsed: 30,
      totalCycleDays: 60,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });

    expect(prediction.controllableImpact).toBeDefined();
    const impact = prediction.controllableImpact!;

    expect(impact.remainingDays).toBe(30);
    expect(impact.reducedHalfUnitSaving).toBeGreaterThan(0);
    expect(impact.increasedOneUnitCost).toBeGreaterThan(0);
  });
});

describe('Phase 3: Smart OCR Consistency & Tariff Detection', () => {
  it('confirms consistent meter reading and billed units (10055 to 10295 is 240 units)', () => {
    const result = validateOcrConsistency(10055, 10295, 240);
    expect(result.isConsistent).toBe(true);
    expect(result.computedUnits).toBe(240);
    expect(result.extractedUnits).toBe(240);
    expect(result.warningMessage).toBeUndefined();
  });

  it('flags discrepancy when reading difference does not equal billed units', () => {
    const result = validateOcrConsistency(10055, 10400, 240);
    expect(result.isConsistent).toBe(false);
    expect(result.computedUnits).toBe(345);
    expect(result.extractedUnits).toBe(240);
    expect(result.warningMessage).toBeDefined();
    expect(result.warningMessage).toContain('345 units');
    expect(result.warningMessage).toContain('240 units');
  });

  it('flags unsupported commercial (LT-VII) bills and provides reason', () => {
    const commercialText = 'KSEB LT-7A Commercial tariff meter reading 10400 to 10800 units 400 total ₹3800';
    const parsed = parseKsebBillText(commercialText);

    expect(parsed.isSupportedBillType).toBe(false);
    expect(parsed.unsupportedReason).toBeDefined();
    expect(parsed.unsupportedReason).toContain('commercial');
  });

  it('accepts supported domestic (LT-1A) bills', () => {
    const domesticText = 'KSEB LT-1A Domestic tariff prev reading: 10055 present reading: 10295 units: 240 total: 1148';
    const parsed = parseKsebBillText(domesticText);

    expect(parsed.isSupportedBillType).toBe(true);
    expect(parsed.unsupportedReason).toBeUndefined();
    expect(parsed.consumedUnits).toBe(240);
    expect(parsed.consistencyCheck?.isConsistent).toBe(true);
  });

  it('extracts meter reading accurately from raw text stream', async () => {
    const result = await extractMeterReadingFromImage('Current Reading: 10850 kWh');
    expect(result.status).toBe('success');
    expect(result.detectedReading).toBe(10850);
  });

  it('returns low confidence when meter image is blurry', async () => {
    const fakeFile = new File([''], 'blurry_meter_glare.jpg');
    const result = await extractMeterReadingFromImage(fakeFile);
    expect(result.status).toBe('low_confidence');
    expect(result.detectedReading).toBeNull();
  });
});

describe('Phase 3: Storage Accuracy & Actual Bill Calibration', () => {
  beforeEach(() => {
    storageManager.clearAllData();
  });

  it('reports 0 evaluated cycles when no actual bills have been recorded', () => {
    const stats = storageManager.getPredictionAccuracyStats();
    expect(stats.totalEvaluated).toBe(0);
    expect(stats.averageErrorRupees).toBe(0);
  });

  it('calibrates prediction error accurately once actual bill is recorded', () => {
    const record = storageManager.addRecord({
      dateLabel: 'Oct 2026',
      meterReading: 10295,
      consumedUnits: 240,
      predictedBill: 1150,
      billingCycle: 'bi-monthly',
      source: 'manual',
    });

    // Record actual KSEB bill amount of ₹1,148
    storageManager.recordActualBill(record.id, 1148);

    const stats = storageManager.getPredictionAccuracyStats();
    expect(stats.totalEvaluated).toBe(1);
    expect(stats.averageErrorRupees).toBe(2); // |1148 - 1150| = 2
    expect(stats.accuracyStatement).toContain('₹2');
  });
});
