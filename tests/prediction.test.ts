import { describe, it, expect } from 'vitest';
import { predictUsage } from '../src/lib/prediction/engine';

describe('Prediction Engine & Band Alert Tests', () => {
  it('correctly calculates units per day and projects full cycle (e.g. 117 units in 30 days of 60-day cycle)', () => {
    const result = predictUsage({
      currentCycleUnits: 117,
      daysElapsed: 30,
      totalCycleDays: 60,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });

    expect(result.daysElapsed).toBe(30);
    expect(result.daysRemaining).toBe(30);
    expect(result.unitsPerDay).toBeCloseTo(3.9, 1);
    expect(result.projectedUnits).toBe(234);
    expect(result.estimatedBill).toBeGreaterThan(0);
    // Range must be provided rather than false precision
    expect(result.likelyRangeMin).toBeLessThanOrEqual(result.estimatedBill);
    expect(result.likelyRangeMax).toBeGreaterThanOrEqual(result.estimatedBill);
  });

  it('detects subsidy cliff warning near 240 units', () => {
    // 217 units in 50 days -> ~4.34/day -> projects ~260 units (approaching/exceeding 240 ceiling)
    const result = predictUsage({
      currentCycleUnits: 217,
      daysElapsed: 50,
      totalCycleDays: 60,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });

    expect(result.approachingSlab).not.toBeNull();
    if (result.approachingSlab) {
      expect(result.approachingSlab.isApproaching).toBe(true);
      expect(result.approachingSlab.warningMessage).toContain('subsidy');
    }
  });

  it('adjusts confidence label based on elapsed days', () => {
    const early = predictUsage({ currentCycleUnits: 20, daysElapsed: 5, totalCycleDays: 60 });
    expect(early.confidence).toBe('low');

    const late = predictUsage({ currentCycleUnits: 180, daysElapsed: 45, totalCycleDays: 60 });
    expect(late.confidence).toBe('high');
  });
});
