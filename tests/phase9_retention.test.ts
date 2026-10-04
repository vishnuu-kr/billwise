import { describe, it, expect, beforeEach } from 'vitest';
import { storageManager } from '../src/lib/storage';
import { SavedHomeProfile, HistoryRecord } from '../src/types';

describe('Phase 9: Product Loop, Saved Home Retention & Cycle Reconciliation', () => {
  beforeEach(() => {
    storageManager.clearAllData();
  });

  describe('My Home Persistent Storage', () => {
    it('initially has no saved home', () => {
      expect(storageManager.hasSavedHome()).toBe(false);
      expect(storageManager.getSavedHome()).toBeNull();
    });

    it('saves a home profile without requiring account, phone, or login', () => {
      const homeProfile: SavedHomeProfile = {
        id: 'home-test-1',
        name: 'Home',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        connectedLoadWatts: 982,
        lastBillAmount: 1148,
        lastBillUnits: 240,
        lastBillDate: '2026-08-04',
        lastReading: 10055,
        lastReadingDate: '2026-08-04',
        currentReading: 10295,
        currentReadingDate: '2026-08-30',
        latestPrediction: {
          estimatedBill: 1284,
          likelyRangeMin: 1210,
          likelyRangeMax: 1360,
          projectedUnits: 250,
          unitsPerDay: 3.8,
          daysElapsed: 26,
          daysRemaining: 34,
          timestamp: '2026-08-30T10:00:00Z',
        },
        createdAt: '2026-08-04T10:00:00Z',
        updatedAt: '2026-08-30T10:00:00Z',
      };

      storageManager.saveHome(homeProfile);

      expect(storageManager.hasSavedHome()).toBe(true);
      const retrieved = storageManager.getSavedHome();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.lastReading).toBe(10055);
      expect(retrieved?.tariff).toBe('LT-1A');
      expect(retrieved?.phase).toBe('single');
      expect(retrieved?.latestPrediction?.estimatedBill).toBe(1284);
    });

    it('updates meter reading in seconds without resetting home configuration', () => {
      const initialHome: SavedHomeProfile = {
        id: 'home-test-2',
        name: 'Home',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        connectedLoadWatts: 1000,
        lastBillAmount: 1148,
        lastBillUnits: 240,
        lastBillDate: '2026-08-01',
        lastReading: 10055,
        lastReadingDate: '2026-08-01',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      };

      storageManager.saveHome(initialHome);

      const updated = storageManager.updateHomeReading(10412, '2026-08-25', {
        estimatedBill: 1320,
        likelyRangeMin: 1240,
        likelyRangeMax: 1400,
        projectedUnits: 260,
        unitsPerDay: 4.0,
        daysElapsed: 25,
        daysRemaining: 35,
        timestamp: '2026-08-25T12:00:00Z',
      });

      expect(updated?.currentReading).toBe(10412);
      expect(updated?.lastReading).toBe(10055);
      expect(updated?.latestPrediction?.estimatedBill).toBe(1320);
      expect(updated?.phase).toBe('single'); // Preserved
      expect(updated?.tariff).toBe('LT-1A'); // Preserved
    });

    it('records actual bill and cleanly shifts cycle to history with calibration difference', () => {
      const activeHome: SavedHomeProfile = {
        id: 'home-test-3',
        name: 'Home',
        billingCycle: 'bi-monthly',
        tariff: 'LT-1A',
        phase: 'single',
        lastReading: 10055,
        lastReadingDate: '2026-08-01',
        currentReading: 10300,
        currentReadingDate: '2026-09-30',
        latestPrediction: {
          estimatedBill: 1284,
          likelyRangeMin: 1210,
          likelyRangeMax: 1360,
          projectedUnits: 245,
          unitsPerDay: 4.0,
          daysElapsed: 60,
          daysRemaining: 0,
          timestamp: '2026-09-30T10:00:00Z',
        },
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-09-30T10:00:00Z',
      };

      storageManager.saveHome(activeHome);

      const reconciliation = storageManager.recordActualBillForHome(1301, '2026-10-01');
      expect(reconciliation.success).toBe(true);
      expect(reconciliation.diff).toBe(17); // 1301 - 1284 = +17
      expect(reconciliation.diffPercent).toBe(1);

      // Check history was recorded
      const history = storageManager.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].actualBill).toBe(1301);
      expect(history[0].predictedBill).toBe(1284);

      // Check home baseline advanced to this new reading
      const nextHome = storageManager.getSavedHome();
      expect(nextHome?.lastReading).toBe(10300);
      expect(nextHome?.lastBillAmount).toBe(1301);
      expect(nextHome?.currentReading).toBeUndefined();
    });
  });

  describe('Cycle Comparison ("What Changed?") Logic', () => {
    it('accurately itemizes the difference between two billing cycles', () => {
      const prevCycle: HistoryRecord = {
        id: 'c1',
        timestamp: '2026-06-05T00:00:00Z',
        dateLabel: 'Jun 2026',
        meterReading: 10055,
        consumedUnits: 240,
        predictedBill: 1150,
        actualBill: 1148,
        billingCycle: 'bi-monthly',
        source: 'reading',
      };

      const currCycle: HistoryRecord = {
        id: 'c2',
        timestamp: '2026-08-05T00:00:00Z',
        dateLabel: 'Aug 2026',
        meterReading: 10341,
        consumedUnits: 286,
        predictedBill: 1560,
        actualBill: 1565,
        billingCycle: 'bi-monthly',
        source: 'reading',
      };

      const diff = storageManager.compareTwoCycles(prevCycle, currCycle);

      expect(diff.unitsDiff).toBe(46); // 286 - 240 = +46 units
      expect(diff.isIncrease).toBe(true);
      expect(diff.prevBill).toBe(1148);
      expect(diff.currBill).toBe(1565);
      expect(diff.billDiff).toBe(417);
      expect(diff.energyImpact).toBeGreaterThan(0);
      expect(diff.dutyImpact).toBeGreaterThan(0);
    });
  });
});
