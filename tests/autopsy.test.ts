import { describe, it, expect } from 'vitest';
import { reverseEstimateUnitsFromBill, performBillAutopsy } from '../src/lib/billing/autopsy';

describe('Bill Autopsy & Cliff Detection Engine', () => {
  it('correctly reverse-engineers 240 units from golden bill ₹1,148', () => {
    const units = reverseEstimateUnitsFromBill(1148, 'single', 'bi-monthly');
    expect(units).toBe(240);
  });

  it('correctly detects cliff crossing when bill is ₹1,600', () => {
    const report = performBillAutopsy({ billAmount: 1600, phase: 'single' });
    expect(report.isCliffCrossed).toBe(true);
    expect(report.estimatedUnits).toBeGreaterThan(240);
    expect(report.lostSubsidyAmount).toBe(148); // Full ₹148 subsidy lost
    expect(report.totalAvoidablePenalty).toBeGreaterThan(0);
    expect(report.effectiveMarginalRate).toBeGreaterThan(5); // Premium rate
  });

  it('identifies safe subsidy capture when bill is ₹850', () => {
    const report = performBillAutopsy({ billAmount: 850, phase: 'single' });
    expect(report.isCliffCrossed).toBe(false);
    expect(report.estimatedUnits).toBeLessThanOrEqual(240);
    expect(report.safeBufferUnits).toBeGreaterThan(0);
  });

  it('correctly handles direct unit input for autopsy', () => {
    const report = performBillAutopsy({ units: 250, phase: 'single' });
    expect(report.isExactUnitsInput).toBe(true);
    expect(report.isCliffCrossed).toBe(true);
    expect(report.estimatedUnits).toBe(250);
  });
});
