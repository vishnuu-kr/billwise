import { describe, it, expect } from 'vitest';
import { calculateUniversalBill } from '../src/lib/electricity/engine/universalEngine';
import { getAllGoldenBills, getGoldenBillByProvider } from '../src/lib/electricity/golden/goldenBills';
import { getAllUniversalTariffs } from '../src/lib/electricity/tariffs/registry';
import { validateAllRegisteredTariffs, validateTariffConfiguration } from '../src/lib/electricity/validation/tariffValidator';
import { getAllProviders, getCoverageQualityScore, getNationalCoverageSummary } from '../src/lib/electricity/api';

describe('Authoritative Golden Bill Fixtures Verification', () => {
  const goldenBills = getAllGoldenBills();

  it('contains at least 7 verified golden bills for fully supported providers', () => {
    expect(goldenBills.length).toBeGreaterThanOrEqual(7);
  });

  goldenBills.forEach((fixture) => {
    it(`verifies golden bill for ${fixture.providerShortName} (${fixture.description})`, () => {
      const calculation = calculateUniversalBill(fixture.input);

      // Verify total bill amount equals expected golden total within tolerance
      const tolerance = fixture.tolerance ?? 0;
      expect(Math.abs(calculation.total - fixture.expectedTotal)).toBeLessThanOrEqual(tolerance);

      // Verify key components match
      fixture.expectedComponents.forEach((expectedComp) => {
        const found = calculation.components.find(
          c => c.id === expectedComp.id || c.name.toLowerCase().includes(expectedComp.name.toLowerCase().slice(0, 10))
        );
        expect(found).toBeDefined();
        if (found) {
          expect(Math.abs(found.amount - expectedComp.amount)).toBeLessThanOrEqual(1.0); // Within ₹1 rounding
        }
      });
    });
  });
});

describe('National Tariff Configuration Integrity Validation', () => {
  const allTariffs = getAllUniversalTariffs();

  it('loads valid registered tariffs', () => {
    expect(allTariffs.length).toBeGreaterThanOrEqual(8);
  });

  it('passes all mathematical and regulatory validations for all registered tariffs', () => {
    const reports = validateAllRegisteredTariffs(allTariffs);

    for (const report of reports) {
      if (!report.isValid) {
        console.error(`Tariff Validation Failure [${report.tariffId}]:`, report.errors);
      }
      expect(report.isValid).toBe(true);
      expect(report.errors).toHaveLength(0);
    }
  });

  it('rejects invalid tariffs with non-contiguous or inverted slabs', () => {
    const brokenTariff = {
      ...allTariffs[0],
      id: 'broken-tariff-test',
      telescopicSlabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.5, label: '0-100' },
        { minUnits: 50, maxUnits: 80, ratePerUnit: -2.0, label: 'Broken' }, // Inverted range & negative rate
      ],
      fixedChargeRules: [],
      dutyRule: { type: 'PERCENT_ENERGY' as const, rate: -0.1, label: 'Invalid' },
    };

    const report = validateTariffConfiguration(brokenTariff);
    expect(report.isValid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
  });
});

describe('National Provider Registry & Quality Scoring', () => {
  const providers = getAllProviders();

  it('ensures all FULL coverage providers have active tariffs, golden bills, and quality score >= 80%', () => {
    const fullProviders = providers.filter(p => p.coverageStatus === 'FULL');
    expect(fullProviders.length).toBeGreaterThanOrEqual(7);

    for (const provider of fullProviders) {
      // Golden bill check
      const goldenBill = getGoldenBillByProvider(provider.id);
      expect(goldenBill).toBeDefined();

      // Quality score check
      const score = getCoverageQualityScore(provider.id);
      expect(score.overallQualityScore).toBeGreaterThanOrEqual(80);
      expect(score.breakdown.hasAuthoritativeSource).toBe(true);
      expect(score.breakdown.hasActiveTariff).toBe(true);
      expect(score.breakdown.hasGoldenBill).toBe(true);
      expect(score.breakdown.hasValidationPassed).toBe(true);
    }
  });

  it('computes coherent national coverage summary', () => {
    const summary = getNationalCoverageSummary();
    expect(summary.totalProviders).toBeGreaterThanOrEqual(25);
    expect(summary.coveredStates).toBeGreaterThanOrEqual(15);
    expect(summary.coverageCounts.FULL).toBeGreaterThanOrEqual(7);
    expect(summary.averageQualityScore).toBeGreaterThan(40);
    expect(summary.fullCoverageProviders).toContain('KSEB');
    expect(summary.fullCoverageProviders).toContain('BESCOM');
    expect(summary.fullCoverageProviders).toContain('MSEDCL');
  });
});
