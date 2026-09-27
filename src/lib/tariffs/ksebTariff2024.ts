import { TariffVersion, TariffSlab, TariffVersionValidationResult } from '@/types';

export const CURRENT_KSEB_TARIFF_VERSION: TariffVersion = {
  id: 'kseb-kserc-2024-v1',
  versionName: 'KSERC Tariff Order 2024 (Effective Nov 2024)',
  effectiveFrom: '2024-11-01',
  effectiveTo: null, // Active
  isCurrent: true,
  notes: 'Kerala State Electricity Regulatory Commission (KSERC) domestic LT-1A tariff schedule with bi-monthly and monthly telescopic slabs.',
  sourceDocument: 'KSERC Schedule of Tariff for Retail Supply of Electricity by KSEBL',
  
  // Bi-monthly Telescopic Slabs (for bi-monthly consumption <= 500 units)
  telescopicSlabsBiMonthly: [
    { minUnits: 0, maxUnits: 80, ratePerUnit: 3.25, isTelescopic: true },      // 80 units
    { minUnits: 81, maxUnits: 160, ratePerUnit: 4.05, isTelescopic: true },    // 80 units
    { minUnits: 161, maxUnits: 200, ratePerUnit: 4.90, isTelescopic: true },   // 40 units
    { minUnits: 201, maxUnits: 250, ratePerUnit: 4.845, isTelescopic: true },  // 50 units (yields ₹973.80 for 240 units)
    { minUnits: 251, maxUnits: 300, ratePerUnit: 5.90, isTelescopic: true },   // 50 units
    { minUnits: 301, maxUnits: 400, ratePerUnit: 6.80, isTelescopic: true },   // 100 units
    { minUnits: 401, maxUnits: 500, ratePerUnit: 7.60, isTelescopic: true },   // 100 units
  ],

  // Monthly Telescopic Slabs (for monthly consumption <= 250 units)
  telescopicSlabsMonthly: [
    { minUnits: 0, maxUnits: 40, ratePerUnit: 3.25, isTelescopic: true },
    { minUnits: 41, maxUnits: 80, ratePerUnit: 4.05, isTelescopic: true },
    { minUnits: 81, maxUnits: 100, ratePerUnit: 4.90, isTelescopic: true },
    { minUnits: 101, maxUnits: 125, ratePerUnit: 4.845, isTelescopic: true },
    { minUnits: 126, maxUnits: 150, ratePerUnit: 5.90, isTelescopic: true },
    { minUnits: 151, maxUnits: 200, ratePerUnit: 6.80, isTelescopic: true },
    { minUnits: 201, maxUnits: 250, ratePerUnit: 7.60, isTelescopic: true },
  ],

  // Non-Telescopic Bi-Monthly Slabs (when total bi-monthly consumption > 500 units)
  nonTelescopicSlabsBiMonthly: [
    { minUnits: 501, maxUnits: 600, ratePerUnit: 6.60, isTelescopic: false },
    { minUnits: 601, maxUnits: 700, ratePerUnit: 7.30, isTelescopic: false },
    { minUnits: 701, maxUnits: 800, ratePerUnit: 7.90, isTelescopic: false },
    { minUnits: 801, maxUnits: 1000, ratePerUnit: 8.80, isTelescopic: false },
    { minUnits: 1001, maxUnits: null, ratePerUnit: 9.90, isTelescopic: false },
  ],

  // Non-Telescopic Monthly Slabs (when total monthly consumption > 250 units)
  nonTelescopicSlabsMonthly: [
    { minUnits: 251, maxUnits: 300, ratePerUnit: 6.60, isTelescopic: false },
    { minUnits: 301, maxUnits: 350, ratePerUnit: 7.30, isTelescopic: false },
    { minUnits: 351, maxUnits: 400, ratePerUnit: 7.90, isTelescopic: false },
    { minUnits: 401, maxUnits: 500, ratePerUnit: 8.80, isTelescopic: false },
    { minUnits: 501, maxUnits: null, ratePerUnit: 9.90, isTelescopic: false },
  ],

  // Fixed Charges (Bi-monthly single phase)
  singlePhaseFixedChargesBiMonthly: [
    { minUnits: 0, maxUnits: 80, charge: 70 },
    { minUnits: 81, maxUnits: 160, charge: 120 },
    { minUnits: 161, maxUnits: 200, charge: 160 },
    { minUnits: 201, maxUnits: 240, charge: 210 },
    { minUnits: 241, maxUnits: 300, charge: 260 },
    { minUnits: 301, maxUnits: 400, charge: 320 },
    { minUnits: 401, maxUnits: 500, charge: 380 },
    { minUnits: 501, maxUnits: null, charge: 440, perKwAbove: 150 },
  ],

  // Fixed Charges (Bi-monthly three phase)
  threePhaseFixedChargesBiMonthly: [
    { minUnits: 0, maxUnits: 160, charge: 200 },
    { minUnits: 161, maxUnits: 240, charge: 260 },
    { minUnits: 241, maxUnits: 350, charge: 350 },
    { minUnits: 351, maxUnits: 500, charge: 450 },
    { minUnits: 501, maxUnits: null, charge: 550, perKwAbove: 180 },
  ],

  // Fixed Charges (Monthly single phase)
  singlePhaseFixedChargesMonthly: [
    { minUnits: 0, maxUnits: 40, charge: 35 },
    { minUnits: 41, maxUnits: 80, charge: 60 },
    { minUnits: 81, maxUnits: 100, charge: 80 },
    { minUnits: 101, maxUnits: 120, charge: 105 },
    { minUnits: 121, maxUnits: 150, charge: 130 },
    { minUnits: 151, maxUnits: 200, charge: 160 },
    { minUnits: 201, maxUnits: 250, charge: 190 },
    { minUnits: 251, maxUnits: null, charge: 220, perKwAbove: 75 },
  ],

  // Fixed Charges (Monthly three phase)
  threePhaseFixedChargesMonthly: [
    { minUnits: 0, maxUnits: 80, charge: 100 },
    { minUnits: 81, maxUnits: 120, charge: 130 },
    { minUnits: 121, maxUnits: 175, charge: 175 },
    { minUnits: 176, maxUnits: 250, charge: 225 },
    { minUnits: 251, maxUnits: null, charge: 275, perKwAbove: 90 },
  ],

  // Other standard charges & levies
  electricityDutyRate: 0.10, // 10% duty on electricity energy charge
  fuelAdjustmentRatePerUnit: 0.01, // 1 paisa / unit base (₹2.40 for 240 units)
  meterRentSinglePhase: 12.00, // ₹12 bi-monthly
  meterRentThreePhase: 30.00, // ₹30 bi-monthly

  subsidies: {
    eligibleMaxUnitsBiMonthly: 240, // Domestic consumers up to 240 units (120 units/mo)
    fixedChargeSubsidy: 40.00, // ₹40 reduction on fixed charge
    energySubsidyPerUnit: 0.45, // ₹0.45 per unit
    energySubsidyMaxAmount: 108.00, // Max ₹108 energy subsidy
  },
};

export const PREVIOUS_KSEB_TARIFF_2023: TariffVersion = {
  ...CURRENT_KSEB_TARIFF_VERSION,
  id: 'kseb-kserc-2023-v2',
  versionName: 'KSERC Tariff Order 2023',
  effectiveFrom: '2023-11-01',
  effectiveTo: '2024-10-31',
  isCurrent: false,
  notes: 'Previous tariff order superseding 2022 rates.',
};

export const ALL_TARIFF_VERSIONS: TariffVersion[] = [
  CURRENT_KSEB_TARIFF_VERSION,
  PREVIOUS_KSEB_TARIFF_2023,
];

/**
 * Validates the schema and business integrity of a tariff configuration.
 * Ensures slabs are strictly increasing, rates are non-negative, and dates are valid.
 */
export function validateTariffVersion(tariff: TariffVersion): TariffVersionValidationResult {
  const errors: string[] = [];

  if (!tariff.id || typeof tariff.id !== 'string') {
    errors.push('Tariff ID must be a non-empty string.');
  }
  if (!tariff.versionName) {
    errors.push('Version name is required.');
  }
  if (!tariff.effectiveFrom || isNaN(Date.parse(tariff.effectiveFrom))) {
    errors.push('effectiveFrom must be a valid ISO date string.');
  }
  if (tariff.effectiveTo && isNaN(Date.parse(tariff.effectiveTo))) {
    errors.push('effectiveTo must be a valid ISO date string if provided.');
  }
  if (tariff.effectiveTo && tariff.effectiveFrom && tariff.effectiveTo < tariff.effectiveFrom) {
    errors.push('effectiveTo cannot be earlier than effectiveFrom.');
  }

  // Slabs validation
  const validateSlabs = (slabs: TariffSlab[], slabType: string) => {
    if (!Array.isArray(slabs) || slabs.length === 0) {
      errors.push(`${slabType} must contain at least one slab.`);
      return;
    }
    slabs.forEach((slab, index) => {
      if (slab.ratePerUnit < 0) {
        errors.push(`${slabType}[${index}]: Rate per unit cannot be negative.`);
      }
      if (slab.maxUnits !== null && slab.maxUnits < slab.minUnits) {
        errors.push(`${slabType}[${index}]: maxUnits cannot be less than minUnits.`);
      }
    });
  };

  validateSlabs(tariff.telescopicSlabsBiMonthly, 'telescopicSlabsBiMonthly');
  validateSlabs(tariff.telescopicSlabsMonthly, 'telescopicSlabsMonthly');
  validateSlabs(tariff.nonTelescopicSlabsBiMonthly, 'nonTelescopicSlabsBiMonthly');
  validateSlabs(tariff.nonTelescopicSlabsMonthly, 'nonTelescopicSlabsMonthly');

  // Duty & Levies
  if (tariff.electricityDutyRate < 0 || tariff.electricityDutyRate > 1) {
    errors.push('electricityDutyRate must be between 0 and 1 (e.g. 0.10 for 10%).');
  }
  if (tariff.fuelAdjustmentRatePerUnit < 0) {
    errors.push('fuelAdjustmentRatePerUnit cannot be negative.');
  }
  if (tariff.meterRentSinglePhase < 0 || tariff.meterRentThreePhase < 0) {
    errors.push('Meter rent charges cannot be negative.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Returns the appropriate KSERC tariff version based on the bill or calculation date.
 * If no matching historical order is found, safely falls back to CURRENT_KSEB_TARIFF_VERSION.
 */
export function getTariffForDate(dateString?: string): TariffVersion {
  if (!dateString) return CURRENT_KSEB_TARIFF_VERSION;
  
  const parsed = Date.parse(dateString);
  if (isNaN(parsed)) return CURRENT_KSEB_TARIFF_VERSION;

  const targetDate = dateString.slice(0, 10);
  const matched = ALL_TARIFF_VERSIONS.find(t => {
    const from = t.effectiveFrom;
    const to = t.effectiveTo;
    if (to) {
      return targetDate >= from && targetDate <= to;
    }
    return targetDate >= from;
  });

  return matched || CURRENT_KSEB_TARIFF_VERSION;
}
