import { TariffVersion, TariffVersionValidationResult, TariffDiffItem } from '@/types';
import { validateTariffVersion, CURRENT_KSEB_TARIFF_VERSION } from './ksebTariff2024';
import { computeTariffDiff } from './diff';
import { calculateBill } from '@/lib/calculation/engine';

export interface TariffIngestionReport {
  isValid: boolean;
  validationErrors: string[];
  diffItems: TariffDiffItem[];
  referenceImpact: {
    units: number;
    previousBill: number;
    projectedBill: number;
    deltaRupees: number;
    percentageChange: number;
  };
  recommendedAction: 'PROCEED_TO_REVIEW' | 'REJECT_INVALID_PARAMETERS';
}

/**
 * Official-Source Tariff Ingestion & Safety Evaluator.
 * Follows the workflow:
 * SOURCE FOUND ➔ PARSE ➔ VALIDATE ➔ SHOW DIFF ➔ HUMAN REVIEW ➔ PUBLISH
 */
export function evaluateTariffIngestion(
  candidateTariff: TariffVersion,
  currentTariff: TariffVersion = CURRENT_KSEB_TARIFF_VERSION
): TariffIngestionReport {
  // 1. Validate Schema
  const validation: TariffVersionValidationResult = validateTariffVersion(candidateTariff);

  // 2. Compute Structural Diff
  const diffItems = computeTariffDiff(currentTariff, candidateTariff);

  // 3. Test on standard 240 unit reference bill
  let prevTotal = 1148;
  let nextTotal = 1148;
  let deltaRupees = 0;
  let percentageChange = 0;

  if (validation.isValid) {
    try {
      const prevCalc = calculateBill({
        units: 240,
        billingCycle: 'bi-monthly',
        phase: 'single',
        tariffVersionId: currentTariff.id,
      });
      const nextCalc = calculateBill({
        units: 240,
        billingCycle: 'bi-monthly',
        phase: 'single',
        tariffVersionId: candidateTariff.id,
      });

      prevTotal = prevCalc.total;
      nextTotal = nextCalc.total;
      deltaRupees = nextCalc.total - prevCalc.total;
      percentageChange = Number(((deltaRupees / prevCalc.total) * 100).toFixed(1));
    } catch (e: unknown) {
      validation.isValid = false;
      validation.errors.push(`Reference calculation failed: ${(e as Error).message}`);
    }
  }

  return {
    isValid: validation.isValid,
    validationErrors: validation.errors,
    diffItems,
    referenceImpact: {
      units: 240,
      previousBill: prevTotal,
      projectedBill: nextTotal,
      deltaRupees,
      percentageChange,
    },
    recommendedAction: validation.isValid ? 'PROCEED_TO_REVIEW' : 'REJECT_INVALID_PARAMETERS',
  };
}
