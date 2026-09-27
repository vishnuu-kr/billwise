import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBill, validateInputSanity } from '../src/lib/calculation/engine';
import { parseKsebBillText } from '../src/lib/ocr/extractor';
import { analytics } from '../src/lib/observability/analytics';
import { storageManager } from '../src/lib/storage';

describe('Real-World Input Sanity & Bad Data Detection', () => {
  it('flags zero units with calm info notice about service line fixed charge', () => {
    const report = validateInputSanity({ units: 0 });
    expect(report.isPlausible).toBe(true);
    expect(report.warningLevel).toBe('info');
    expect(report.warningMessage).toContain('Zero units consumption');
  });

  it('flags unusually high domestic consumption with warning', () => {
    const report = validateInputSanity({ units: 1800 });
    expect(report.isPlausible).toBe(true);
    expect(report.warningLevel).toBe('warning');
    expect(report.warningMessage).toContain('exceeds typical');
  });

  it('rejects extreme, implausible residential values (>5,000 units) with error', () => {
    const report = validateInputSanity({ units: 6500 });
    expect(report.isPlausible).toBe(false);
    expect(report.warningLevel).toBe('error');
    expect(report.warningMessage).toContain('extremely high');
  });

  it('flags reversed meter readings (decreased reading without replacement) with error', () => {
    const report = validateInputSanity({
      units: 0,
      previousReading: 10500,
      presentReading: 10200,
    });
    expect(report.isPlausible).toBe(false);
    expect(report.warningLevel).toBe('error');
    expect(report.warningMessage).toContain('cannot run backward');
  });

  it('flags very early cycle reading (< 2 days elapsed)', () => {
    const report = validateInputSanity({ units: 10, daysElapsed: 1 });
    expect(report.isPlausible).toBe(true);
    expect(report.warningLevel).toBe('info');
    expect(report.warningMessage).toContain('Less than 2 days');
  });

  it('flags unusually prolonged billing cycles (> 90 days)', () => {
    const report = validateInputSanity({ units: 450, daysElapsed: 110 });
    expect(report.isPlausible).toBe(true);
    expect(report.warningLevel).toBe('warning');
    expect(report.warningMessage).toContain('exceeds standard 60-day');
  });
});

describe('Real-World Bill Dataset & Boundary Calculations', () => {
  it('handles minimum consumption boundary (40 units bi-monthly)', () => {
    const bill = calculateBill({ units: 40, billingCycle: 'bi-monthly', phase: 'single' });
    expect(bill.grossEnergyCharge).toBe(40 * 3.25); // ₹130
    expect(bill.grossFixedCharge).toBe(70);
    expect(bill.fixedChargeSubsidy).toBe(40);
    expect(bill.netFixedCharge).toBe(30);
    expect(bill.energySubsidy).toBe(18); // 40 units * ₹0.45 = ₹18
    expect(bill.meterRent).toBe(12);
    expect(bill.electricityDuty).toBe(13); // 10% of 130
    expect(bill.total).toBe(167); // 130 + 70 + 13 + 0.40 + 12 - 58 = 167.40 -> 167
  });

  it('verifies subsidy cliff boundary: 235 units receives subsidy vs 245 units receives 0', () => {
    const bill235 = calculateBill({ units: 235, billingCycle: 'bi-monthly', phase: 'single' });
    const bill245 = calculateBill({ units: 245, billingCycle: 'bi-monthly', phase: 'single' });

    expect(bill235.totalSubsidies).toBe(145.75); // ₹40 fixed + ₹105.75 energy subsidy
    expect(bill245.totalSubsidies).toBe(0);
    // At 245 units, fixed charge also increases to slab 241-300 (₹260)
    expect(bill245.grossFixedCharge).toBe(260);
    expect(bill245.total).toBeGreaterThan(bill235.total + 145);
  });

  it('verifies non-telescopic cliff at 501 units', () => {
    const bill500 = calculateBill({ units: 500, billingCycle: 'bi-monthly', phase: 'single' });
    const bill501 = calculateBill({ units: 501, billingCycle: 'bi-monthly', phase: 'single' });

    expect(bill500.isTelescopicApplied).toBe(true);
    expect(bill501.isTelescopicApplied).toBe(false);
    // 501 units billed at flat rate ₹6.60 across ALL units
    expect(bill501.grossEnergyCharge).toBe(Number((501 * 6.60).toFixed(2)));
  });
});

describe('Solar, Net-Metering, and Time-of-Day (ToD) Graceful Refusal', () => {
  it('detects solar net-metering bills and provides helpful refusal notice', () => {
    const billText = 'KSEB LT-1A Rooftop Solar Net Metering export units 180 import units 320 net payable';
    const parsed = parseKsebBillText(billText);

    expect(parsed.isSupportedBillType).toBe(false);
    expect(parsed.unsupportedReason).toBeDefined();
    expect(parsed.unsupportedReason).toContain('Solar Net-Metering');
  });

  it('detects Time-of-Day (ToD) bills and provides helpful refusal notice', () => {
    const billText = 'KSEB LT-1A 3-Phase Time of Day TOD Peak Normal Off-Peak units 450 total ₹4200';
    const parsed = parseKsebBillText(billText);

    expect(parsed.isSupportedBillType).toBe(false);
    expect(parsed.unsupportedReason).toBeDefined();
    expect(parsed.unsupportedReason).toContain('Time-of-Day');
  });
});

describe('Privacy-First Analytics & Storage Hardening', () => {
  beforeEach(() => {
    analytics.clear();
    storageManager.clearAllData();
  });

  it('sanitizes and strips PII (13-digit consumer numbers, phone numbers) before tracking', () => {
    analytics.track('prediction_generated', {
      consumerNumber: '1234567890123', // 13-digit PII
      phone: '9847012345',              // 10-digit phone
      units: 240,                      // non-PII safe metric
      billingCycle: 'bi-monthly',
    });

    const events = analytics.getRecentEvents();
    expect(events.length).toBe(1);
    expect(events[0].properties?.units).toBe(240);
    expect(events[0].properties?.billingCycle).toBe('bi-monthly');
    expect(events[0].properties?.consumerNumber).toBeUndefined();
    expect(events[0].properties?.phone).toBeUndefined();
  });

  it('gracefully handles corrupted JSON import without throwing', () => {
    const result = storageManager.importData('invalid { broken json');
    expect(result).toBe(false);
  });

  it('safely imports valid JSON backup payload', () => {
    const validJson = JSON.stringify({
      history: [
        {
          id: 'test-import-1',
          timestamp: '2026-08-01T00:00:00Z',
          dateLabel: 'Aug 2026',
          meterReading: 10200,
          consumedUnits: 200,
          predictedBill: 950,
          billingCycle: 'bi-monthly',
          source: 'manual',
        },
      ],
    });

    const result = storageManager.importData(validJson);
    expect(result).toBe(true);
    expect(storageManager.getHistory().length).toBe(1);
    expect(storageManager.getHistory()[0].consumedUnits).toBe(200);
  });
});
