import { UniversalTariffVersion, TariffValidationReport } from '../types';

/**
 * Build & Test Time Tariff Validation Engine
 * Enforces mathematical and regulatory integrity across all onboarded electricity tariffs.
 */
export function validateTariffConfiguration(tariff: UniversalTariffVersion): TariffValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Mandatory Schema Identifiers
  if (!tariff.id || typeof tariff.id !== 'string') {
    errors.push('Tariff ID must be a non-empty string.');
  }
  if (!tariff.providerId || typeof tariff.providerId !== 'string') {
    errors.push('providerId is required and must reference a valid provider.');
  }
  if (!tariff.regulatorId || typeof tariff.regulatorId !== 'string') {
    errors.push('regulatorId is required and must reference an authoritative regulator.');
  }
  if (!tariff.categoryCode) {
    errors.push('categoryCode is required (e.g. LT-1A, LT-2a).');
  }

  // 2. Date Integrity
  if (!tariff.effectiveFrom || isNaN(Date.parse(tariff.effectiveFrom))) {
    errors.push('effectiveFrom must be a valid ISO date string (YYYY-MM-DD).');
  }
  if (tariff.effectiveTo) {
    if (isNaN(Date.parse(tariff.effectiveTo))) {
      errors.push('effectiveTo must be a valid ISO date string if provided.');
    } else if (new Date(tariff.effectiveTo) <= new Date(tariff.effectiveFrom)) {
      errors.push('effectiveTo must be strictly after effectiveFrom.');
    }
  }

  // 3. Regulatory Source Reference
  if (!tariff.orderReference) {
    warnings.push('Official tariff order reference number is missing.');
  }
  if (!tariff.sourceDocumentUrl) {
    warnings.push('Official source document URL is missing.');
  }

  // 4. Energy Slabs Integrity Check
  if (tariff.energySlabType === 'TELESCOPIC' || tariff.energySlabType === 'MIXED') {
    if (!tariff.telescopicSlabs || tariff.telescopicSlabs.length === 0) {
      errors.push('Telescopic tariff must contain at least one energy slab.');
    } else {
      let prevMax = -1;
      tariff.telescopicSlabs.forEach((slab, idx) => {
        if (slab.minUnits < 0) {
          errors.push(`Slab ${idx + 1}: minUnits cannot be negative.`);
        }
        if (slab.ratePerUnit < 0) {
          errors.push(`Slab ${idx + 1}: ratePerUnit (${slab.ratePerUnit}) cannot be negative.`);
        }
        if (slab.maxUnits !== null && slab.maxUnits < slab.minUnits) {
          errors.push(`Slab ${idx + 1}: maxUnits (${slab.maxUnits}) must be greater than or equal to minUnits (${slab.minUnits}).`);
        }

        // Continuity check: minUnits should be prevMax + 1 (or 0 for first slab)
        if (idx === 0) {
          if (slab.minUnits !== 0) {
            warnings.push(`First slab should typically begin at 0 units, found ${slab.minUnits}.`);
          }
        } else if (prevMax !== -1 && prevMax !== null) {
          if (slab.minUnits !== prevMax + 1 && slab.minUnits !== prevMax) {
            warnings.push(`Discontinuity detected between slab ${idx} (max ${prevMax}) and slab ${idx + 1} (min ${slab.minUnits}).`);
          }
        }
        prevMax = slab.maxUnits ?? -1;
      });
    }
  }

  // Non-telescopic slabs validation (e.g. KSEB > 500 units)
  if (tariff.nonTelescopicSlabs && tariff.nonTelescopicSlabs.length > 0) {
    tariff.nonTelescopicSlabs.forEach((slab, idx) => {
      if (slab.ratePerUnit < 0) {
        errors.push(`Non-telescopic Slab ${idx + 1}: ratePerUnit cannot be negative.`);
      }
      if (slab.maxUnits !== null && slab.maxUnits < slab.minUnits) {
        errors.push(`Non-telescopic Slab ${idx + 1}: maxUnits cannot be less than minUnits.`);
      }
    });
  }

  // 5. Fixed Charges Integrity Check
  if (!tariff.fixedChargeRules || tariff.fixedChargeRules.length === 0) {
    errors.push('Tariff must declare at least one fixed charge rule.');
  } else {
    tariff.fixedChargeRules.forEach((rule, idx) => {
      if (rule.amount < 0) {
        errors.push(`Fixed charge rule ${idx + 1}: amount cannot be negative.`);
      }
      if (rule.perKwAboveThresholdRate && rule.perKwAboveThresholdRate < 0) {
        errors.push(`Fixed charge rule ${idx + 1}: perKwAboveThresholdRate cannot be negative.`);
      }
    });
  }

  // 6. Duty Rule Integrity Check
  if (!tariff.dutyRule) {
    errors.push('Tariff must declare an electricity duty rule.');
  } else {
    if (tariff.dutyRule.rate < 0) {
      errors.push(`Duty rate (${tariff.dutyRule.rate}) cannot be negative.`);
    }
    if (tariff.dutyRule.type.startsWith('PERCENT') && tariff.dutyRule.rate > 0.50) {
      warnings.push(`Duty percentage (${(tariff.dutyRule.rate * 100).toFixed(0)}%) appears unusually high (> 50%).`);
    }
  }

  // 7. Adjustments & Subsidies
  if (tariff.variableAdjustment && tariff.variableAdjustment.ratePerUnit < 0) {
    warnings.push(`Negative variable adjustment rate: ${tariff.variableAdjustment.ratePerUnit}`);
  }
  if (tariff.subsidies) {
    tariff.subsidies.forEach((sub, idx) => {
      if (sub.fixedAmount && sub.fixedAmount < 0) {
        errors.push(`Subsidy ${idx + 1} (${sub.name}): fixedAmount cannot be negative.`);
      }
      if (sub.discountPerUnit && sub.discountPerUnit < 0) {
        errors.push(`Subsidy ${idx + 1} (${sub.name}): discountPerUnit cannot be negative.`);
      }
    });
  }

  return {
    tariffId: tariff.id,
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedAt: new Date().toISOString(),
  };
}

export function validateAllRegisteredTariffs(tariffs: UniversalTariffVersion[]): TariffValidationReport[] {
  return tariffs.map(t => validateTariffConfiguration(t));
}
