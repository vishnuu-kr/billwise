import { describe, it, expect, beforeEach } from 'vitest';
import { storageManager } from '@/lib/storage';
import { SavedHomeProfile } from '@/types';
import { predictUsage } from '@/lib/prediction/engine';
import { calculateBill } from '@/lib/calculation/engine';

describe('First-Time User Experience (FTUE) & Onboarding Data Integrity', () => {
  beforeEach(() => {
    storageManager.clearAllData();
  });

  it('correctly tracks onboarding completion status', () => {
    expect(storageManager.isOnboardingCompleted()).toBe(false);
    storageManager.setOnboardingCompleted(true);
    expect(storageManager.isOnboardingCompleted()).toBe(true);
    storageManager.setOnboardingCompleted(false);
    expect(storageManager.isOnboardingCompleted()).toBe(false);
  });

  it('saves home from direct units without setting currentReading to consumed units', () => {
    const today = '2026-10-04';
    const calc = calculateBill({ units: 240, billingCycle: 'bi-monthly', phase: 'single' });

    const profile: SavedHomeProfile = {
      id: 'home_test',
      name: 'Home',
      providerId: 'kseb',
      providerName: 'Kerala State Electricity Board',
      providerShortName: 'KSEB',
      state: 'Kerala',
      billingCycle: 'bi-monthly',
      tariff: 'LT-1A',
      phase: 'single',
      connectedLoadWatts: 2000,
      lastBillAmount: calc.total,
      lastBillUnits: 240,
      lastBillDate: today,
      lastReading: 0, // No meter reading yet
      lastReadingDate: today,
      currentReading: undefined, // Crucial: must NOT be 240
      currentReadingDate: undefined,
      latestPrediction: {
        estimatedBill: calc.total,
        likelyRangeMin: Math.round(calc.total * 0.95),
        likelyRangeMax: Math.round(calc.total * 1.05),
        projectedUnits: 240,
        unitsPerDay: 4.0,
        daysElapsed: 60,
        daysRemaining: 0,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageManager.saveHome(profile);
    const retrieved = storageManager.getSavedHome();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.lastReading).toBe(0);
    expect(retrieved?.currentReading).toBeUndefined();
    expect(retrieved?.lastBillAmount).toBe(1148);
  });

  it('allows setting day-1 baseline meter reading without triggering 10,000-unit bill', () => {
    const today = '2026-10-04';
    // User sets up home with baseline meter reading 10450
    const baselineProfile: SavedHomeProfile = {
      id: 'home_test',
      name: 'Home',
      providerId: 'kseb',
      providerName: 'KSEB',
      providerShortName: 'KSEB',
      state: 'Kerala',
      billingCycle: 'bi-monthly',
      tariff: 'LT-1A',
      phase: 'single',
      connectedLoadWatts: 2000,
      lastReading: 10450,
      lastReadingDate: today,
      currentReading: undefined,
      currentReadingDate: undefined,
      latestPrediction: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageManager.saveHome(baselineProfile);
    const saved = storageManager.getSavedHome();
    expect(saved?.lastReading).toBe(10450);

    // After 10 days, user checks meter again and sees 10490 (40 units in 10 days = 4 u/day)
    const newReading = 10490;
    const daysElapsed = 10;
    const pred = predictUsage({
      previousReading: saved!.lastReading,
      currentReading: newReading,
      daysElapsed,
      totalCycleDays: 60,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });

    expect(pred.currentUnits).toBe(40);
    expect(pred.unitsPerDay).toBe(4.0);
    expect(pred.projectedUnits).toBe(240); // 4.0 * 60 = 240
    expect(pred.estimatedBill).toBe(1148); // Golden reference 240 units = 1148
  });

  it('supports full 2-reading baseline during onboarding for instant projection', () => {
    // User enters both past bill reading 10210 and today's reading 10450
    const prevReading = 10210;
    const currentReading = 10450;
    const pred = predictUsage({
      previousReading: prevReading,
      currentReading: currentReading,
      daysElapsed: 30,
      totalCycleDays: 60,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });

    expect(pred.currentUnits).toBe(240); // 10450 - 10210 = 240
    expect(pred.unitsPerDay).toBe(8.0);
    expect(pred.projectedUnits).toBe(480);
    expect(pred.estimatedBill).toBeGreaterThan(1148);
  });

  it('persists selected electricity provider across sessions', () => {
    const profile: SavedHomeProfile = {
      id: 'home_bescom',
      name: 'Bengaluru Flat',
      providerId: 'bescom',
      providerName: 'Bangalore Electricity Supply Company Limited',
      providerShortName: 'BESCOM',
      state: 'Karnataka',
      billingCycle: 'monthly',
      tariff: 'LT-2',
      phase: 'single',
      connectedLoadWatts: 3000,
      lastReading: 5420,
      lastReadingDate: '2026-10-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageManager.saveHome(profile);
    const retrieved = storageManager.getSavedHome();
    expect(retrieved?.providerId).toBe('bescom');
    expect(retrieved?.providerShortName).toBe('BESCOM');
    expect(retrieved?.state).toBe('Karnataka');
  });
});
