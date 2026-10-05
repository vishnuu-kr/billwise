import { describe, it, expect, beforeEach } from 'vitest';
import { storageManager } from '../src/lib/storage';
import {
  evaluatePersonalBaseline,
  evaluateBillHealth,
  explainRupeeImpact,
  getPredictionConfidence,
  getPredictionLearning,
  explainEstimateVsActual,
  isDuplicateBill,
} from '../src/lib/retention/intelligence';
import { SavedHomeProfile, HistoryRecord } from '../src/types';

describe('Phase 19: Retention Engine + Personal Intelligence', () => {
  beforeEach(() => {
    storageManager.clearAllData();
  });

  describe('1. The Core Product Loop & Lifecycle States (Sections 1, 2, 48)', () => {
    it('simulates the complete recurring loop: First Bill -> Update Meter -> Bill Arrives -> Reconcile -> Next Cycle', () => {
      // Step 1: First visit & scan bill (State A -> State B)
      const initialHome: SavedHomeProfile = {
        id: 'home-retention-1',
        name: 'Home',
        providerId: 'kseb',
        providerShortName: 'KSEB',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        connectedLoadWatts: 1000,
        lastBillAmount: 1148,
        lastBillUnits: 240,
        lastBillDate: '2026-06-01',
        lastReading: 10055,
        lastReadingDate: '2026-06-01',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      };
      storageManager.saveHome(initialHome);

      // Verify State B: After First Bill (ready for meter reading)
      let home = storageManager.getSavedHome()!;
      expect(home.lastBillAmount).toBe(1148);
      expect(home.currentReading).toBeUndefined();
      expect(home.latestPrediction).toBeUndefined();
      expect(home.lastReconciledComparison).toBeUndefined();

      // Step 2: Mid-cycle meter update (State B -> State C)
      const midCycleReading = 10185; // +130 units at day 30
      storageManager.updateHomeReading(midCycleReading, '2026-07-01', {
        estimatedBill: 1220,
        likelyRangeMin: 1160,
        likelyRangeMax: 1280,
        projectedUnits: 260,
        unitsPerDay: 4.3,
        daysElapsed: 30,
        daysRemaining: 30,
        timestamp: '2026-07-01T10:00:00Z',
      });

      // Verify State C: Active Cycle with Live Estimate
      home = storageManager.getSavedHome()!;
      expect(home.currentReading).toBe(10185);
      expect(home.latestPrediction?.estimatedBill).toBe(1220);
      expect(home.latestPrediction?.projectedUnits).toBe(260);

      // Step 3: Bill arrives and actual is recorded (State C -> State D)
      const actualBillAmount = 1148; // BILLWISE was ₹72 high
      const reconResult = storageManager.recordActualBillForHome(actualBillAmount, '2026-08-01');
      expect(reconResult.success).toBe(true);
      expect(reconResult.diff).toBe(-72); // 1148 - 1220 = -72

      // Verify State D: Actual Recorded with preserved comparison & dominant reason
      home = storageManager.getSavedHome()!;
      expect(home.lastReconciledComparison).toBeDefined();
      expect(home.lastReconciledComparison?.predictedBill).toBe(1220);
      expect(home.lastReconciledComparison?.actualBill).toBe(1148);
      expect(home.lastReconciledComparison?.diff).toBe(-72);
      expect(home.lastReconciledComparison?.dominantReasonEn).toContain('BILLWISE was ₹72 high');

      // Verify history was cleanly appended without losing estimate
      const history = storageManager.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].predictedBill).toBe(1220);
      expect(history[0].actualBill).toBe(1148);

      // Step 4: Next cycle begins with a fresh meter reading (State D -> State C)
      storageManager.updateHomeReading(10380, '2026-08-20', {
        estimatedBill: 1100,
        likelyRangeMin: 1040,
        likelyRangeMax: 1160,
        projectedUnits: 235,
        unitsPerDay: 3.9,
        daysElapsed: 20,
        daysRemaining: 40,
        timestamp: '2026-08-20T10:00:00Z',
      });

      home = storageManager.getSavedHome()!;
      expect(home.currentReading).toBe(10380);
      expect(home.lastReconciledComparison).toBeUndefined(); // Cleared cleanly for new cycle
    });
  });

  describe('2. Personal Baseline & Normal Range (Sections 6, 7)', () => {
    it('returns NO_BASELINE when 0 historical records exist', () => {
      const baseline = evaluatePersonalBaseline([]);
      expect(baseline.status).toBe('NO_BASELINE');
      expect(baseline.sampleCount).toBe(0);
      expect(baseline.normalRangeMin).toBeUndefined();
      expect(baseline.descriptionEn).toContain('No baseline established yet');
    });

    it('returns LIMITED_BASELINE when 1 or 2 historical records exist and never claims statistical normal', () => {
      const record1: HistoryRecord = {
        id: 'hist-1',
        timestamp: '2026-06-01T00:00:00Z',
        dateLabel: 'Jun 2026',
        consumedUnits: 240,
        predictedBill: 1150,
        actualBill: 1148,
        billingCycle: 'bi-monthly',
        source: 'scan',
      };

      const baseline = evaluatePersonalBaseline([record1]);
      expect(baseline.status).toBe('LIMITED_BASELINE');
      expect(baseline.sampleCount).toBe(1);
      expect(baseline.averageUnits).toBe(240);
      expect(baseline.usualDailyUnits).toBe(4); // 240 / 60 = 4.0
      expect(baseline.normalRangeMin).toBeUndefined(); // No false statistical range
      expect(baseline.descriptionEn).toContain('Initial baseline recorded (1 billing cycle)');
    });

    it('returns ESTABLISHED_BASELINE with authentic normal range when >= 3 historical records exist', () => {
      const records: HistoryRecord[] = [
        { id: 'h3', timestamp: '2026-08-01', dateLabel: 'Aug 2026', consumedUnits: 240, predictedBill: 1150, actualBill: 1148, billingCycle: 'bi-monthly', source: 'reading' },
        { id: 'h2', timestamp: '2026-06-01', dateLabel: 'Jun 2026', consumedUnits: 215, predictedBill: 1010, actualBill: 1012, billingCycle: 'bi-monthly', source: 'reading' },
        { id: 'h1', timestamp: '2026-04-01', dateLabel: 'Apr 2026', consumedUnits: 230, predictedBill: 1090, actualBill: 1085, billingCycle: 'bi-monthly', source: 'reading' },
      ];

      const baseline = evaluatePersonalBaseline(records);
      expect(baseline.status).toBe('ESTABLISHED_BASELINE');
      expect(baseline.sampleCount).toBe(3);
      expect(baseline.averageUnits).toBe(228); // (240 + 215 + 230) / 3 = 228
      expect(baseline.normalRangeMin).toBe(205); // Math.round(228 * 0.9)
      expect(baseline.normalRangeMax).toBe(251); // Math.round(228 * 1.1)
      expect(baseline.rangeContextEn).toContain('Your usual range is 205–251 kWh.');
    });
  });

  describe('3. Evidence-Based Bill Health (Section 8)', () => {
    it('returns INSUFFICIENT_HISTORY when history has fewer than 2 cycles', () => {
      const health = evaluateBillHealth(
        { units: 240, previousReading: 10055, presentReading: 10295, totalAmount: 1148 },
        []
      );
      expect(health.status).toBe('INSUFFICIENT_HISTORY');
      expect(health.headlineEn).toBe('Not enough history to judge yet.');
    });

    it('returns HEALTHY when readings match and usage conforms to baseline', () => {
      const history: HistoryRecord[] = [
        { id: 'h2', timestamp: '2026-06-01', dateLabel: 'Jun 2026', consumedUnits: 235, predictedBill: 1100, actualBill: 1110, billingCycle: 'bi-monthly', source: 'reading' },
        { id: 'h1', timestamp: '2026-04-01', dateLabel: 'Apr 2026', consumedUnits: 245, predictedBill: 1180, actualBill: 1175, billingCycle: 'bi-monthly', source: 'reading' },
      ];

      const health = evaluateBillHealth(
        { units: 240, previousReading: 10055, presentReading: 10295, totalAmount: 1148 },
        history
      );
      expect(health.status).toBe('HEALTHY');
      expect(health.headlineEn).toBe('Looks normal.');
      expect(health.factorsChecked.readingConsistency).toBe(true);
    });

    it('returns UNUSUAL when meter reading is inverted (present < previous)', () => {
      const history: HistoryRecord[] = [
        { id: 'h1', timestamp: '2026-06-01', dateLabel: 'Jun 2026', consumedUnits: 240, predictedBill: 1148, actualBill: 1148, billingCycle: 'bi-monthly', source: 'reading' },
        { id: 'h2', timestamp: '2026-04-01', dateLabel: 'Apr 2026', consumedUnits: 240, predictedBill: 1148, actualBill: 1148, billingCycle: 'bi-monthly', source: 'reading' },
      ];

      const health = evaluateBillHealth(
        { units: 240, previousReading: 10295, presentReading: 10055, totalAmount: 1148 },
        history
      );
      expect(health.status).toBe('UNUSUAL');
      expect(health.headlineEn).toContain("Bill readings don't match stated usage.");
      expect(health.factorsChecked.readingConsistency).toBe(false);
    });
  });

  describe('4. Explain Money, Not Just Units (Sections 9, 10)', () => {
    it('connects usage increase (+37 kWh) to exact rupee impact and itemizes secondary factors', () => {
      const impact = explainRupeeImpact(203, 240, 'bi-monthly');
      expect(impact.unitsDiff).toBe(37);
      expect(impact.rupeeDiff).toBeGreaterThan(0);
      expect(impact.primaryReasonEn).toContain('Usage increased (240 kWh vs 203 kWh, +37 kWh)');
      expect(impact.primaryReasonEn).toContain(`₹${impact.rupeeDiff}`);
      expect(impact.secondaryFactorsEn.some(f => f.includes('Electricity duty'))).toBe(true);
    });

    it('detects loss of state subsidy when crossing the 240-unit cliff', () => {
      const impact = explainRupeeImpact(230, 250, 'bi-monthly');
      expect(impact.secondaryFactorsEn.some(f => f.includes('Crossed 240-unit threshold'))).toBe(true);
      expect(impact.secondaryFactorsMl.some(f => f.includes('സബ്സിഡി'))).toBe(true);
    });
  });

  describe('5. Prediction Confidence & Prediction Learning (Sections 12, 14, 15)', () => {
    it('uses honest human confidence language instead of artificial AI percentages', () => {
      const early = getPredictionConfidence(10, 60);
      expect(early.level).toBe('early');
      expect(early.explanationEn).toContain('Too early to know precisely.');

      const mid = getPredictionConfidence(30, 60);
      expect(mid.level).toBe('mid');
      expect(mid.labelEn).toBe('Good estimate');

      const late = getPredictionConfidence(55, 60);
      expect(late.level).toBe('high');
      expect(late.labelEn).toBe('High confidence');
    });

    it('guards statistical claims until >= 3 evaluated cycles exist', () => {
      const twoRecords: HistoryRecord[] = [
        { id: 'h1', timestamp: '2026-04-01', dateLabel: 'Apr', consumedUnits: 200, predictedBill: 980, actualBill: 982, billingCycle: 'bi-monthly', source: 'reading' },
        { id: 'h2', timestamp: '2026-06-01', dateLabel: 'Jun', consumedUnits: 220, predictedBill: 1050, actualBill: 1045, billingCycle: 'bi-monthly', source: 'reading' },
      ];

      const learning2 = getPredictionLearning(twoRecords);
      expect(learning2.hasSufficientData).toBe(false);
      expect(learning2.learningStatementEn).toContain('Calibration requires 3+ cycles');

      const threeRecords: HistoryRecord[] = [
        ...twoRecords,
        { id: 'h3', timestamp: '2026-08-01', dateLabel: 'Aug', consumedUnits: 240, predictedBill: 1200, actualBill: 1148, billingCycle: 'bi-monthly', source: 'reading' },
      ];

      const learning3 = getPredictionLearning(threeRecords);
      expect(learning3.hasSufficientData).toBe(true);
      expect(learning3.learningStatementEn).toContain('BILLWISE usually predicts within about');
    });

    it('explains dominant reason when actual bill was lower due to late-cycle pace reduction', () => {
      const explanation = explainEstimateVsActual(1220, 1148, 260, 240); // 20 units less than projected
      expect(explanation.diff).toBe(-72);
      expect(explanation.isHigh).toBe(true);
      expect(explanation.dominantReasonEn).toContain('Usage slowed down by 20 units in the final days of the cycle.');
    });
  });

  describe('6. Duplicate Bill Protection (Section 20)', () => {
    it('detects duplicate when same meter reading is uploaded again', () => {
      const history: HistoryRecord[] = [
        {
          id: 'h1',
          timestamp: '2026-08-01',
          dateLabel: 'Aug 2026',
          meterReading: 10295,
          consumedUnits: 240,
          predictedBill: 1148,
          actualBill: 1148,
          billingCycle: 'bi-monthly',
          source: 'scan',
        },
      ];

      const duplicateScan = isDuplicateBill(
        {
          presentReading: 10295,
          previousReading: 10055,
          consumedUnits: 240,
          totalAmount: 1148,
        },
        history
      );

      expect(duplicateScan.isDuplicate).toBe(true);
      expect(duplicateScan.message).toContain('already in your history');
    });

    it('does not flag distinct bills as duplicate', () => {
      const history: HistoryRecord[] = [
        {
          id: 'h1',
          timestamp: '2026-06-01',
          dateLabel: 'Jun 2026',
          meterReading: 10055,
          consumedUnits: 240,
          predictedBill: 1148,
          actualBill: 1148,
          billingCycle: 'bi-monthly',
          source: 'scan',
        },
      ];

      const newCycleScan = isDuplicateBill(
        {
          presentReading: 10295,
          previousReading: 10055,
          consumedUnits: 240,
          totalAmount: 1148,
        },
        history
      );

      expect(newCycleScan.isDuplicate).toBe(false);
    });
  });

  describe('7. Simulated Returning Users (Section 38)', () => {
    it('USER A: Handles user with exactly one recorded bill', () => {
      const home: SavedHomeProfile = {
        id: 'user-a',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        lastBillAmount: 1148,
        lastBillUnits: 240,
        lastReading: 10055,
        lastReadingDate: '2026-08-01',
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01',
      };
      storageManager.saveHome(home);

      const baseline = evaluatePersonalBaseline([
        { id: '1', timestamp: '2026-08-01', dateLabel: 'Aug 2026', consumedUnits: 240, predictedBill: 1148, actualBill: 1148, billingCycle: 'bi-monthly', source: 'scan' }
      ]);
      expect(baseline.status).toBe('LIMITED_BASELINE');
      expect(baseline.sampleCount).toBe(1);
    });

    it('USER B: Handles user with three bills (calibrated baseline)', () => {
      const history: HistoryRecord[] = [
        { id: '1', timestamp: '2026-04-01', dateLabel: 'Apr 2026', consumedUnits: 210, predictedBill: 1000, actualBill: 990, billingCycle: 'bi-monthly', source: 'scan' },
        { id: '2', timestamp: '2026-06-01', dateLabel: 'Jun 2026', consumedUnits: 230, predictedBill: 1080, actualBill: 1075, billingCycle: 'bi-monthly', source: 'reading' },
        { id: '3', timestamp: '2026-08-01', dateLabel: 'Aug 2026', consumedUnits: 240, predictedBill: 1150, actualBill: 1148, billingCycle: 'bi-monthly', source: 'reading' },
      ];
      history.forEach(h => storageManager.addRecord(h));

      const baseline = evaluatePersonalBaseline(history);
      expect(baseline.status).toBe('ESTABLISHED_BASELINE');
      expect(baseline.normalRangeMin).toBeDefined();

      const learning = getPredictionLearning(history);
      expect(learning.hasSufficientData).toBe(true);
      expect(learning.averageVarianceRupees).toBeLessThan(15);
    });

    it('USER D: Handles unexpected bill spike with helpful reason', () => {
      const history: HistoryRecord[] = [
        { id: '1', timestamp: '2026-04-01', dateLabel: 'Apr', consumedUnits: 200, predictedBill: 950, actualBill: 950, billingCycle: 'bi-monthly', source: 'reading' },
        { id: '2', timestamp: '2026-06-01', dateLabel: 'Jun', consumedUnits: 210, predictedBill: 990, actualBill: 990, billingCycle: 'bi-monthly', source: 'reading' },
      ];

      const health = evaluateBillHealth(
        { units: 360, previousReading: 10000, presentReading: 10360, totalAmount: 2200 },
        history
      );
      expect(health.status).toBe('NEEDS_ATTENTION');
      expect(health.headlineEn).toContain('above your normal average');
    });

    it('USER F: Handles meter updated multiple times within the same cycle without loss', () => {
      const home: SavedHomeProfile = {
        id: 'user-f',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        lastBillAmount: 1148,
        lastBillUnits: 240,
        lastReading: 10055,
        lastReadingDate: '2026-08-01',
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01',
      };
      storageManager.saveHome(home);

      // Check 1: Day 10 reading
      storageManager.updateHomeReading(10095, '2026-08-10', {
        estimatedBill: 1140,
        likelyRangeMin: 1080,
        likelyRangeMax: 1200,
        projectedUnits: 240,
        unitsPerDay: 4.0,
        daysElapsed: 10,
        daysRemaining: 50,
        timestamp: '2026-08-10',
      });
      expect(storageManager.getSavedHome()?.currentReading).toBe(10095);

      // Check 2: Day 25 reading
      storageManager.updateHomeReading(10165, '2026-08-25', {
        estimatedBill: 1180,
        likelyRangeMin: 1120,
        likelyRangeMax: 1240,
        projectedUnits: 250,
        unitsPerDay: 4.4,
        daysElapsed: 25,
        daysRemaining: 35,
        timestamp: '2026-08-25',
      });
      expect(storageManager.getSavedHome()?.currentReading).toBe(10165);
      expect(storageManager.getSavedHome()?.latestPrediction?.estimatedBill).toBe(1180);
    });
  });
});
