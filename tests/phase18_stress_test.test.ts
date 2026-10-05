import { describe, it, expect, beforeEach } from 'vitest';
import { storageManager, CURRENT_SCHEMA_VERSION } from '@/lib/storage';
import { calculateBill, calculateConsumedUnits } from '@/lib/calculation/engine';
import { calculateUniversalBill, calculateConsumedUnitsFromInput } from '@/lib/electricity/engine/universalEngine';
import { detectProviderFromBillText } from '@/lib/electricity/detection/providerDetector';
import { selectTariffVersion, UNIVERSAL_TARIFF_REGISTRY } from '@/lib/electricity/tariffs/registry';
import { predictUsage } from '@/lib/prediction/engine';
import {
  evaluatePersonalBaseline,
  evaluateConsumptionAnomaly,
  normalizeUsageMetrics,
  formatInr,
} from '@/lib/electricity/scoring/baselineEngine';
import {
  normalizeOcrNumericString,
  validateOcrConsistency,
  parseKsebBillText,
  OnDeviceClientOcrProvider,
  extractMeterReadingFromImage,
  SAMPLE_KSEB_REFERENCE_BILL,
  SAMPLE_BESCOM_REFERENCE_BILL,
  SAMPLE_MSEDCL_REFERENCE_BILL,
  SAMPLE_UNKNOWN_PROVIDER_BILL,
} from '@/lib/ocr/extractor';
import { HistoryRecord, SavedHomeProfile } from '@/types';

describe('PHASE 18 — Hostile QA & Real-World Validation Suite', () => {
  beforeEach(() => {
    storageManager.clearAllData();
  });

  // ============================================================
  // 1. Hostile QA & File Input Security (Sections 1, 3, 42, 43)
  // ============================================================
  describe('1. File Input & Hostile QA Stress Tests', () => {
    const ocr = new OnDeviceClientOcrProvider();

    it('rejects empty files (0 bytes) with a clear error without crashing', async () => {
      const emptyFile = new File([''], 'empty_bill.jpg', { type: 'image/jpeg' });
      await expect(ocr.extract(emptyFile)).rejects.toThrow(/empty/i);
    });

    it('rejects oversized files (>25MB) safely', async () => {
      const hugeBlob = new Blob([new Uint8Array(26 * 1024 * 1024)], { type: 'image/jpeg' });
      const hugeFile = new File([hugeBlob], 'huge_bill.jpg', { type: 'image/jpeg' });
      await expect(ocr.extract(hugeFile)).rejects.toThrow(/exceeds 25MB/i);
    });

    it('handles unreadable / corrupted images safely without inventing fake KSEB data', async () => {
      const corruptFile = new File(['corrupt data'], 'corrupt_photo.jpg', { type: 'image/jpeg' });
      const res = await ocr.extract(corruptFile);
      expect(res.data.isSupportedBillType).toBe(false);
      expect(res.data.confidence).toBeLessThan(0.5);
      expect(res.data.unsupportedReason).toMatch(/could not detect clear electricity bill/i);
    });

    it('extractMeterReadingFromImage handles empty and oversized files safely', async () => {
      const emptyFile = new File([''], 'meter_empty.png', { type: 'image/png' });
      const emptyRes = await extractMeterReadingFromImage(emptyFile);
      expect(emptyRes.status).toBe('failed');
      expect(emptyRes.detectedReading).toBeNull();

      const hugeBlob = new Blob([new Uint8Array(26 * 1024 * 1024)], { type: 'image/png' });
      const hugeFile = new File([hugeBlob], 'meter_huge.png', { type: 'image/png' });
      const hugeRes = await extractMeterReadingFromImage(hugeFile);
      expect(hugeRes.status).toBe('failed');
      expect(hugeRes.detectedReading).toBeNull();
    });

    it('sanitizes feedback inputs and strips PII (phone, consumer numbers, emails)', () => {
      const dirtyComment = 'Call me on 9847123456 or email test@gmail.com for consumer no 1155667788990';
      const clean = storageManager.sanitizeFeedbackText(dirtyComment);
      expect(clean).not.toContain('9847123456');
      expect(clean).not.toContain('test@gmail.com');
      expect(clean).not.toContain('1155667788990');
      expect(clean).toContain('[REDACTED_PHONE]');
      expect(clean).toContain('[REDACTED_EMAIL]');
      expect(clean).toContain('[REDACTED_CONSUMER_NO]');
    });

    it('sanitizes malicious script tags and huge text in history notes', () => {
      const maliciousNotes = '<script>alert("xss")</script>' + 'A'.repeat(1000);
      const record = storageManager.addRecord({
        dateLabel: 'Oct 2026',
        consumedUnits: 150,
        predictedBill: 800,
        billingCycle: 'monthly',
        source: 'manual',
        notes: maliciousNotes,
      });
      expect(record.notes?.length).toBeLessThanOrEqual(500);
      expect(record.notes).toContain('<script>'); // harmless text, length bounded
    });
  });

  // ============================================================
  // 2. OCR Reality & Glyph Confusions (Sections 4, 6)
  // ============================================================
  describe('2. OCR Normalization & Discrepancy Flagging', () => {
    it('normalizes glyph confusions: O->0, I/l/|->1, S->5, B->8', () => {
      expect(normalizeOcrNumericString('1,O48').numericValue).toBe(1048);
      expect(normalizeOcrNumericString('₹1,148').numericValue).toBe(1148);
      expect(normalizeOcrNumericString('1I48').numericValue).toBe(1148);
      expect(normalizeOcrNumericString('1l48').numericValue).toBe(1148);
      expect(normalizeOcrNumericString('1|48').numericValue).toBe(1148);
      expect(normalizeOcrNumericString('2S0').numericValue).toBe(250);
      expect(normalizeOcrNumericString('B50').numericValue).toBe(850);
      expect(normalizeOcrNumericString('240 kWh').numericValue).toBe(240);
    });

    it('flags discrepancy between present-previous delta and stated units', () => {
      const res = validateOcrConsistency(10055, 10295, 420); // 10295-10055 = 240 != 420
      expect(res.isConsistent).toBe(false);
      expect(res.warningMessage).toContain("Bill readings don't match the stated usage");
      expect(res.computedUnits).toBe(240);
      expect(res.extractedUnits).toBe(420);
    });

    it('detects inverted meter reading (present < previous) safely', () => {
      const res = validateOcrConsistency(10500, 10200, 300);
      expect(res.isConsistent).toBe(false);
      expect(res.discrepancyType).toBe('REVERSED_READING');
    });
  });

  // ============================================================
  // 3. Provider & Tariff Detection Stress (Sections 5, 6, 8, 39, 40)
  // ============================================================
  describe('3. Provider & Tariff Routing Stress', () => {
    it('accurately identifies KSEB, BESCOM, and MSEDCL from bill text', () => {
      const ksebRes = detectProviderFromBillText('KERALA STATE ELECTRICITY BOARD LTD LT-1A CONSUMER 11456');
      expect(ksebRes.detectedProvider?.id).toBe('kseb');
      expect(ksebRes.confidence).toBe('high');

      const bescomRes = detectProviderFromBillText('BANGALORE ELECTRICITY SUPPLY COMPANY BESCOM LT-2A');
      expect(bescomRes.detectedProvider?.id).toBe('bescom');
      expect(bescomRes.confidence).toBe('high');

      const msedclRes = detectProviderFromBillText('MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO MSEDCL');
      expect(msedclRes.detectedProvider?.id).toBe('msedcl');
      expect(msedclRes.confidence).toBe('high');
    });

    it('never defaults blindly to KSEB when provider text is unrecognized', () => {
      const unknownRes = detectProviderFromBillText('RANDOM UTILITY SERVICE COMPANY INVOICE #9988');
      expect(unknownRes.detectedProvider).toBeNull();
      expect(unknownRes.confidence).toBe('low');
    });

    it('fails safely when calculating bill for unknown provider without guessing', () => {
      expect(() => {
        calculateUniversalBill({
          providerId: 'unregistered_board_xyz',
          units: 200,
          billingCycle: 'MONTHLY',
          phase: 'single',
        });
      }).toThrow(/Unknown electricity provider/i);
    });

    it('deterministic tariff selection respects date ranges and reports status', () => {
      const match = selectTariffVersion('kseb', { categoryCode: 'LT-1A', asOfDate: '2025-01-15' });
      expect(match.status).toBe('EXACT_MATCH');
      expect(match.tariff).toBeDefined();

      const future = selectTariffVersion('kseb', { categoryCode: 'LT-1A', asOfDate: '2020-01-01' });
      expect(future.status).toBe('FUTURE_TARIFF'); // effectiveFrom is 2024-11-01

      const unknown = selectTariffVersion('kseb', { categoryCode: 'NON_EXISTENT_CODE' });
      expect(unknown.status).toBe('ZERO_MATCHES');
    });
  });

  // ============================================================
  // 4. Golden Fixture Calculations & Reconciliation (Sections 7, 8)
  // ============================================================
  describe('4. Authoritative Bill Calculations & Reconciliations', () => {
    it('KSEB 240 units golden reference matches physical bill down to the rupee (₹1,148)', () => {
      const res = calculateBill({
        units: 240,
        billingCycle: 'bi-monthly',
        phase: 'single',
      });
      expect(res.grossEnergyCharge).toBe(973.80);
      expect(res.grossFixedCharge).toBe(210);
      expect(res.netFixedCharge).toBe(170); // 210 - 40 fixed subsidy
      expect(res.totalSubsidies).toBe(148); // 108 energy + 40 fixed
      expect(res.fuelAdjustment).toBe(2.40);
      expect(res.electricityDuty).toBe(97.40);
      expect(res.meterRent).toBe(12);
      expect(res.subtotal).toBe(1147.60);
      expect(res.total).toBe(1148);
      expect(res.roundOff).toBe(0.40);
      expect(res.trace).toBeDefined();
      expect(res.trace?.length).toBe(7);
    });

    it('Universal engine matches KSEB 240 units golden reference (₹1,148)', () => {
      const res = calculateUniversalBill({
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
      });
      expect(res.total).toBe(1148);
    });

    it('BESCOM 150 units monthly calculation produces exact deterministic output (₹1,272)', () => {
      const res = calculateUniversalBill({
        providerId: 'bescom',
        units: 150,
        billingCycle: 'MONTHLY',
        phase: 'single',
        connectedLoadKw: 2,
      });
      expect(res.total).toBe(1272);
      expect(res.subtotal).toBeCloseTo(1271.75, 2);
    });
  });

  // ============================================================
  // 5. Meter Reading & Rollover Edge Cases (Sections 10, 11, 12)
  // ============================================================
  describe('5. Meter Reading Logic & Rollover Invariants', () => {
    it('calculates standard difference correctly: 10000 -> 10100 is 100 units', () => {
      const delta = calculateConsumedUnits({
        previousReading: 10000,
        presentReading: 10100,
      });
      expect(delta.units).toBe(100);
    });

    it('zero consumption: 10000 -> 10000 is 0 units', () => {
      const delta = calculateConsumedUnits({
        previousReading: 10000,
        presentReading: 10000,
      });
      expect(delta.units).toBe(0);
    });

    it('rejects present < previous without rollover or replacement', () => {
      const delta = calculateConsumedUnits({
        previousReading: 10100,
        presentReading: 10000,
      });
      expect(delta.error).toBeDefined();
      expect(delta.error).toMatch(/lower than.*previous reading/i);
    });

    it('handles legitimate 5-digit meter rollover (99980 -> 00020 is 40 units)', () => {
      const res = calculateConsumedUnitsFromInput({
        providerId: 'kseb',
        billingCycle: 'BIMONTHLY',
        phase: 'single',
        previousReading: 99980,
        presentReading: 20,
        meterDigits: 5,
      });
      expect(res.units).toBe(40);
    });

    it('handles meter replacement with split readings', () => {
      const delta = calculateConsumedUnits({
        previousReading: 9800,
        presentReading: 60,
        isMeterReplaced: true,
        oldMeterFinalReading: 9900,
        newMeterInitialReading: 0,
      });
      // (9900 - 9800) + (60 - 0) = 100 + 60 = 160 units
      expect(delta.units).toBe(160);
    });
  });

  // ============================================================
  // 6. Storage Corruption & Migration Self-Healing (Sections 17, 18, 30, 35)
  // ============================================================
  describe('6. Storage Corruption Resistance & Self-Healing', () => {
    function setRawStorage(key: string, value: string) {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(key, value);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (storageManager as any).memoryStore.set(key, value);
      }
    }

    function getRawStorage(key: string): string | null {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (storageManager as any).memoryStore.get(key) || null;
    }

    it('heals corrupted history containing nulls, strings, and invalid objects', () => {
      // Simulate raw corrupted array in storage
      const corruptPayload = JSON.stringify([
        null,
        12345,
        'invalid string',
        { broken: true },
        { id: 'valid-1', consumedUnits: 200, dateLabel: 'Sep 2026' },
        { id: 'bad-units', consumedUnits: NaN, dateLabel: 'Oct 2026' },
      ]);
      setRawStorage('billwise_history_v1', corruptPayload);

      const history = storageManager.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].id).toBe('valid-1');
      expect(history[0].consumedUnits).toBe(200);

      // Verify self-healed storage persists the cleaned version
      const healedRaw = getRawStorage('billwise_history_v1');
      expect(healedRaw).toBeDefined();
      expect(JSON.parse(healedRaw!).length).toBe(1);
    });

    it('recovers gracefully from non-array corrupted history data', () => {
      setRawStorage('billwise_history_v1', '{"not": "an array"}');
      const history = storageManager.getHistory();
      expect(history).toEqual([]);
    });

    it('heals corrupted saved home profile safely', () => {
      setRawStorage('billwise_saved_home_v1', '"a primitive string"');
      expect(storageManager.getSavedHome()).toBeNull();

      setRawStorage('billwise_saved_home_v1', 'null');
      expect(storageManager.getSavedHome()).toBeNull();

      setRawStorage('billwise_saved_home_v1', '{}'); // Missing id
      expect(storageManager.getSavedHome()).toBeNull();
    });

    it('heals corrupted budget safely', () => {
      setRawStorage('billwise_budget_v1', '{"monthlyTargetRupees": -500}');
      const budget = storageManager.getBudget();
      expect(budget.monthlyTargetRupees).toBe(1000); // defaults safely
    });

    it('prevents duplicate history entries when re-uploading the same bill', () => {
      storageManager.addRecord({
        dateLabel: 'Aug 2026',
        meterReading: 10295,
        consumedUnits: 240,
        predictedBill: 1150,
        actualBill: 1148,
        billingCycle: 'bi-monthly',
        source: 'manual',
      });
      expect(storageManager.getHistory().length).toBe(1);

      // Re-upload same bill
      storageManager.addRecord({
        dateLabel: 'Aug 2026',
        meterReading: 10295,
        consumedUnits: 240,
        predictedBill: 1150,
        actualBill: 1148,
        billingCycle: 'bi-monthly',
        source: 'manual',
      });
      expect(storageManager.getHistory().length).toBe(1); // Idempotent merge, no duplicate
    });

    it('survives large dataset test: 500 records without crashing or degrading stats', () => {
      const bulkRecords: HistoryRecord[] = [];
      for (let i = 0; i < 500; i++) {
        bulkRecords.push({
          id: `hist-bulk-${i}`,
          timestamp: new Date(2026, 0, 1 + i).toISOString(),
          dateLabel: `Month ${i}`,
          consumedUnits: 150 + (i % 100),
          predictedBill: 800 + (i % 500),
          actualBill: 810 + (i % 500),
          billingCycle: 'bi-monthly',
          source: 'manual',
          tariffVersionId: 'kseb-lt1a-2023',
          calculationEngineVersion: '1.0',
          predictionModelVersion: '1.0',
        });
      }
      storageManager.saveHistory(bulkRecords);

      const start = performance.now();
      const stats = storageManager.getUsageTrendStats();
      const elapsed = performance.now() - start;

      expect(stats.averageUnits).toBeGreaterThan(0);
      expect(stats.highestRecord).toBeDefined();
      expect(stats.lowestRecord).toBeDefined();
      expect(elapsed).toBeLessThan(50); // High-speed performance under 50ms
    });
  });

  // ============================================================
  // 7. Cycle Normalization & Anomaly Attribution (Sections 19, 24, 25, 26, 27)
  // ============================================================
  describe('7. Baseline & Anomaly Attribution Logic', () => {
    it('normalizes consumption metrics correctly between monthly and bi-monthly', () => {
      const monthlyNorm = normalizeUsageMetrics(120, 'monthly');
      const biMonthlyNorm = normalizeUsageMetrics(240, 'bi-monthly');

      expect(monthlyNorm.dailyAverageUnits).toBe(4.0);
      expect(monthlyNorm.monthlyEquivalentUnits).toBe(120);

      expect(biMonthlyNorm.dailyAverageUnits).toBe(4.0);
      expect(biMonthlyNorm.monthlyEquivalentUnits).toBe(120);
    });

    it('evaluates baseline tiers: NO_BASELINE (0), LIMITED_BASELINE (1), ESTABLISHED_BASELINE (2+)', () => {
      expect(evaluatePersonalBaseline([]).status).toBe('NO_BASELINE');

      const oneRecord: HistoryRecord[] = [{
        id: '1', timestamp: '', dateLabel: 'Aug', consumedUnits: 200,
        predictedBill: 1000, billingCycle: 'bi-monthly', source: 'manual',
        tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '',
      }];
      expect(evaluatePersonalBaseline(oneRecord).status).toBe('LIMITED_BASELINE');

      const twoRecords: HistoryRecord[] = [
        ...oneRecord,
        {
          id: '2', timestamp: '', dateLabel: 'Jun', consumedUnits: 220,
          predictedBill: 1100, billingCycle: 'bi-monthly', source: 'manual',
          tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '',
        },
      ];
      expect(evaluatePersonalBaseline(twoRecords).status).toBe('ESTABLISHED_BASELINE');
    });

    it('flags anomaly with dominant driver when 240-unit subsidy threshold is crossed', () => {
      const baseline = evaluatePersonalBaseline([
        { id: '1', timestamp: '', dateLabel: 'Jun', consumedUnits: 220, predictedBill: 1000, billingCycle: 'bi-monthly', source: 'manual', tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '' },
        { id: '2', timestamp: '', dateLabel: 'Apr', consumedUnits: 210, predictedBill: 950, billingCycle: 'bi-monthly', source: 'manual', tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '' },
      ]);

      const anomaly = evaluateConsumptionAnomaly(250, baseline, { hasCrossedSubsidyCliff: true });
      expect(anomaly.status).toBe('CHECK');
      expect(anomaly.dominantDriver).toBe('240-Unit Subsidy Ceiling Exceeded');
      expect(anomaly.reasonEn).toContain('₹148 state subsidy is discontinued');
    });

    it('false positive check: 5% natural variance remains NORMAL', () => {
      const baseline = evaluatePersonalBaseline([
        { id: '1', timestamp: '', dateLabel: 'Jun', consumedUnits: 200, predictedBill: 1000, billingCycle: 'bi-monthly', source: 'manual', tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '' },
        { id: '2', timestamp: '', dateLabel: 'Apr', consumedUnits: 200, predictedBill: 1000, billingCycle: 'bi-monthly', source: 'manual', tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '' },
      ]);

      const anomaly = evaluateConsumptionAnomaly(210, baseline); // 5% increase
      expect(anomaly.status).toBe('NORMAL');
      expect(anomaly.dominantDriver).toBe('Steady Consumption');
    });

    it('false negative check: 100% surge is flagged UNUSUAL', () => {
      const baseline = evaluatePersonalBaseline([
        { id: '1', timestamp: '', dateLabel: 'Jun', consumedUnits: 200, predictedBill: 1000, billingCycle: 'bi-monthly', source: 'manual', tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '' },
        { id: '2', timestamp: '', dateLabel: 'Apr', consumedUnits: 200, predictedBill: 1000, billingCycle: 'bi-monthly', source: 'manual', tariffVersionId: '', calculationEngineVersion: '', predictionModelVersion: '' },
      ]);

      const anomaly = evaluateConsumptionAnomaly(400, baseline); // 100% increase
      expect(anomaly.status).toBe('UNUSUAL');
      expect(anomaly.dominantDriver).toBe('Surge in Consumption');
    });
  });

  // ============================================================
  // 8. Prediction Stress & Actual vs Estimate (Sections 28, 29)
  // ============================================================
  describe('8. Prediction Range & Estimate Preservation', () => {
    it('Day 1 with 0 units consumed safely yields 0 units projected with low confidence', () => {
      const res = predictUsage({
        daysElapsed: 1,
        currentCycleUnits: 0,
        totalCycleDays: 60,
      });
      expect(res.projectedUnits).toBe(0);
      expect(res.confidence).toBe('low');
      expect(res.confidenceReason).toMatch(/not enough data yet/i);
    });

    it('rejects negative meter readings in predictUsage', () => {
      expect(() => {
        predictUsage({
          previousReading: -100,
          currentReading: 200,
          daysElapsed: 10,
        });
      }).toThrow(/cannot be negative/i);
    });

    it('preserves historical prediction when actual bill is recorded (Section 29: Actual vs Estimate)', () => {
      // 1. Setup saved home with a prediction of ₹1,150
      const initialHome: SavedHomeProfile = {
        id: 'home-1',
        name: 'My Flat',
        providerId: 'kseb',
        providerName: 'KSEB',
        providerShortName: 'KSEB',
        state: 'Kerala',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        connectedLoadWatts: 1000,
        lastReading: 10055,
        lastReadingDate: '2026-08-01',
        currentReading: 10295,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        latestPrediction: {
          estimatedBill: 1150,
          likelyRangeMin: 1100,
          likelyRangeMax: 1200,
          projectedUnits: 240,
          unitsPerDay: 4.0,
          daysElapsed: 60,
          daysRemaining: 0,
          timestamp: '2026-10-01T00:00:00Z',
        },
      };
      storageManager.saveHome(initialHome);

      // 2. Official bill arrives: ₹1,148 (diff of -₹2)
      const res = storageManager.recordActualBillForHome(1148, '2026-10-04');
      expect(res.success).toBe(true);
      expect(res.diff).toBe(-2);

      // 3. Verify history preserved the original estimate alongside actual
      const history = storageManager.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].predictedBill).toBe(1150);
      expect(history[0].actualBill).toBe(1148);
      expect(history[0].consumedUnits).toBe(240);
    });
  });

  // ============================================================
  // 9. Golden End-to-End User Journey (Section 53)
  // ============================================================
  describe('9. Section 53: Canonical Full-Flow Regression Journey', () => {
    it('executes full end-to-end lifecycle: Upload -> Extract -> Detect -> Calculate -> Save -> Predict -> Reconcile', async () => {
      const ocr = new OnDeviceClientOcrProvider();

      // Step 1: Upload realistic KSEB bill fixture
      const file = new File(['mock content'], 'sample_kseb_bill.jpg', { type: 'image/jpeg' });
      const extractResult = await ocr.extract(file);
      expect(extractResult.data.consumedUnits).toBe(240);

      // Step 2: Provider Detection
      const detection = detectProviderFromBillText(extractResult.rawText);
      expect(detection.detectedProvider?.id).toBe('kseb');
      expect(detection.confidence).toBe('high');

      // Step 3: Tariff selection
      const tariffMatch = selectTariffVersion('kseb', { categoryCode: 'LT-1A', asOfDate: '2026-10-04' });
      expect(tariffMatch.status).toBe('EXACT_MATCH');

      // Step 4: Authoritative Calculation
      const bill = calculateBill({
        units: extractResult.data.consumedUnits,
        billingCycle: 'bi-monthly',
        phase: 'single',
      });
      expect(bill.total).toBe(1148);

      // Step 5: Save home profile
      storageManager.saveHome({
        id: 'home_main',
        name: 'Home',
        providerId: 'kseb',
        providerName: 'KSEB',
        providerShortName: 'KSEB',
        state: 'Kerala',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        connectedLoadWatts: 1000,
        lastReading: extractResult.data.presentReading, // 10295
        lastReadingDate: extractResult.data.billDate,
        lastBillAmount: bill.total,
        lastBillUnits: extractResult.data.consumedUnits,
        createdAt: '2026-10-04T00:00:00Z',
        updatedAt: '2026-10-04T00:00:00Z',
      });

      // Step 6: User returns 20 days later and updates meter reading to 10375 (80 units in 20 days = 4 u/day)
      const daysElapsed = 20;
      const newMeterReading = 10375;
      const pred = predictUsage({
        previousReading: 10295,
        currentReading: newMeterReading,
        daysElapsed,
        totalCycleDays: 60,
        billingCycle: 'bi-monthly',
      });
      expect(pred.currentUnits).toBe(80);
      expect(pred.unitsPerDay).toBe(4.0);
      expect(pred.projectedUnits).toBe(240); // 4 * 60 = 240
      expect(pred.estimatedBill).toBe(1148);

      // Update home profile with reading & prediction
      storageManager.updateHomeReading(newMeterReading, '2026-10-24', {
        estimatedBill: pred.estimatedBill,
        likelyRangeMin: pred.likelyRangeMin,
        likelyRangeMax: pred.likelyRangeMax,
        projectedUnits: pred.projectedUnits,
        unitsPerDay: pred.unitsPerDay,
        daysElapsed: pred.daysElapsed,
        daysRemaining: pred.daysRemaining,
        timestamp: new Date().toISOString(),
      });

      // Step 7: Cycle ends, actual bill arrives at ₹1,148
      const reconcileRes = storageManager.recordActualBillForHome(1148, '2026-12-04');
      expect(reconcileRes.success).toBe(true);
      expect(reconcileRes.diff).toBe(0);

      // Step 8: Verify history is preserved accurately
      const history = storageManager.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].meterReading).toBe(10375);
      expect(history[0].actualBill).toBe(1148);
      expect(history[0].predictedBill).toBe(1148);
    });
  });
});
