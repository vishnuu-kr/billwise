import { describe, it, expect } from 'vitest';
import {
  CURRENT_KSEB_TARIFF_VERSION,
  PREVIOUS_KSEB_TARIFF_2023,
  validateTariffVersion,
  getTariffForDate,
} from '../src/lib/tariffs/ksebTariff2024';
import { calculateBill, reconcileBillComponents } from '../src/lib/calculation/engine';
import { TariffVersion, ComponentReconciliationItem } from '../src/types';

describe('Tariff Schema Validation & Update Safety', () => {
  it('validates that official CURRENT_KSEB_TARIFF_VERSION passes all schema constraints', () => {
    const report = validateTariffVersion(CURRENT_KSEB_TARIFF_VERSION);
    expect(report.isValid).toBe(true);
    expect(report.errors.length).toBe(0);
  });

  it('validates that PREVIOUS_KSEB_TARIFF_2023 passes all schema constraints', () => {
    const report = validateTariffVersion(PREVIOUS_KSEB_TARIFF_2023);
    expect(report.isValid).toBe(true);
    expect(report.errors.length).toBe(0);
  });

  it('rejects a tariff configuration with negative slab rates', () => {
    const corruptedTariff: TariffVersion = {
      ...CURRENT_KSEB_TARIFF_VERSION,
      telescopicSlabsBiMonthly: [
        { minUnits: 0, maxUnits: 80, ratePerUnit: -3.25, isTelescopic: true },
      ],
    };
    const report = validateTariffVersion(corruptedTariff);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e: string) => e.includes('negative'))).toBe(true);
  });

  it('rejects a tariff configuration with out-of-order slab limits (maxUnits < minUnits)', () => {
    const corruptedTariff: TariffVersion = {
      ...CURRENT_KSEB_TARIFF_VERSION,
      telescopicSlabsBiMonthly: [
        { minUnits: 100, maxUnits: 50, ratePerUnit: 4.50, isTelescopic: true },
      ],
    };
    const report = validateTariffVersion(corruptedTariff);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e: string) => e.includes('maxUnits cannot be less than minUnits'))).toBe(true);
  });

  it('rejects a tariff configuration where effectiveTo is earlier than effectiveFrom', () => {
    const corruptedTariff: TariffVersion = {
      ...CURRENT_KSEB_TARIFF_VERSION,
      effectiveFrom: '2025-01-01',
      effectiveTo: '2024-01-01',
    };
    const report = validateTariffVersion(corruptedTariff);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e: string) => e.includes('effectiveTo cannot be earlier'))).toBe(true);
  });

  it('rejects a tariff with duty rate exceeding 100% (> 1.0)', () => {
    const corruptedTariff: TariffVersion = {
      ...CURRENT_KSEB_TARIFF_VERSION,
      electricityDutyRate: 1.5,
    };
    const report = validateTariffVersion(corruptedTariff);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e: string) => e.includes('electricityDutyRate'))).toBe(true);
  });
});

describe('Date-Based Tariff Version Lookup', () => {
  it('selects 2023 tariff order for dates in late 2023 / early 2024', () => {
    const tariff = getTariffForDate('2024-03-15');
    expect(tariff.id).toBe(PREVIOUS_KSEB_TARIFF_2023.id);
  });

  it('selects active current tariff for dates after Nov 2024', () => {
    const tariff = getTariffForDate('2026-10-04');
    expect(tariff.id).toBe(CURRENT_KSEB_TARIFF_VERSION.id);
    expect(tariff.isCurrent).toBe(true);
  });

  it('safely falls back to current tariff when date is invalid or undefined', () => {
    expect(getTariffForDate(undefined).id).toBe(CURRENT_KSEB_TARIFF_VERSION.id);
    expect(getTariffForDate('invalid-date').id).toBe(CURRENT_KSEB_TARIFF_VERSION.id);
  });
});

describe('Component-Level Bill Reconciliation Engine', () => {
  const calculated = calculateBill({
    previousReading: 10055,
    presentReading: 10295,
    billingCycle: 'bi-monthly',
    phase: 'single',
    connectedLoadWatts: 982,
  });

  it('reconciles exact component match against reference bill', () => {
    const actualBreakdown = {
      grossEnergyCharge: 974,
      grossFixedCharge: 210,
      electricityDuty: 97.40,
      fuelAdjustment: 2.40,
      meterRent: 12.00,
      totalSubsidies: 148.00,
      roundOff: 0.20,
      total: 1148,
    };

    const reconciliation = reconcileBillComponents(calculated, actualBreakdown);

    expect(reconciliation.isExactMatch).toBe(true);
    expect(reconciliation.totalDifference).toBe(0);
    expect(reconciliation.components.every((c: ComponentReconciliationItem) => c.isMatch)).toBe(true);
    expect(reconciliation.primaryVarianceInsight).toContain('matches the actual bill');
  });

  it('correctly pinpoints and explains the ₹2 fuel surcharge variance (1p vs 2p)', () => {
    // Some physical bills or third party calculators apply 2p FAC (₹4.80 instead of ₹2.40)
    const actualBreakdownWith2pFAC = {
      grossEnergyCharge: 974,
      grossFixedCharge: 210,
      electricityDuty: 97.40,
      fuelAdjustment: 4.80, // +₹2.40 variance
      meterRent: 12.00,
      totalSubsidies: 148.00,
      roundOff: 0,
      total: 1150, // Total is ₹1,150 instead of ₹1,148
    };

    const reconciliation = reconcileBillComponents(calculated, actualBreakdownWith2pFAC);

    expect(reconciliation.isExactMatch).toBe(false);
    expect(reconciliation.totalDifference).toBe(-2);
    
    const facItem = reconciliation.components.find((c: ComponentReconciliationItem) => c.componentKey === 'fac');
    expect(facItem).toBeDefined();
    expect(facItem?.isMatch).toBe(false);
    expect(facItem?.differenceAmount).toBe(-2.40);
    expect(reconciliation.primaryVarianceInsight).toContain('Fuel Adjustment Charge');
    expect(reconciliation.primaryVarianceInsight).toContain('1p vs 2p');
  });
});
