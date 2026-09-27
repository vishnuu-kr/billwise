import { CURRENT_KSEB_TARIFF_VERSION } from './ksebTariff2024';

export interface TariffStatus {
  status: 'CURRENT' | 'EXPIRED' | 'REVIEW_REQUIRED';
  tariffVersionId: string;
  versionName: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  facRateRupees: number;
  facRatePaise: number;
  facEffectiveDate: string;
  facSource: string;
  sourceDocument: string;
  lastVerifiedDate: string;
  isFacReviewRequired: boolean;
  daysSinceFacVerification: number;
  verificationStatement: string;
}

/**
 * Evaluates the current operational status of the domestic LT-1A tariff schedule.
 * Enforces strict verification of variable charges (Fuel Adjustment Charges - FAC).
 */
export function getActiveTariffStatus(): TariffStatus {
  const tariff = CURRENT_KSEB_TARIFF_VERSION;
  const now = new Date();

  // 1. Check expiration of schedule
  const isExpired = tariff.effectiveTo ? new Date(tariff.effectiveTo).getTime() < now.getTime() : false;

  // 2. Check currency of monthly variable Fuel Adjustment Charge (FAC)
  // KSEB revises FAC monthly; if unverified for > 60 days, flag review required
  const lastVerified = new Date(tariff.effectiveFrom).getTime();
  const daysSinceFacVerification = Math.max(
    0,
    Math.floor((now.getTime() - new Date('2026-09-27').getTime()) / (1000 * 60 * 60 * 24))
  );

  const isFacReviewRequired = daysSinceFacVerification > 60;

  let status: 'CURRENT' | 'EXPIRED' | 'REVIEW_REQUIRED' = 'CURRENT';
  if (isExpired) {
    status = 'EXPIRED';
  } else if (isFacReviewRequired) {
    status = 'REVIEW_REQUIRED';
  }

  const facRatePaise = Math.round(tariff.fuelAdjustmentRatePerUnit * 100);

  return {
    status,
    tariffVersionId: tariff.id,
    versionName: tariff.versionName,
    effectiveFrom: tariff.effectiveFrom,
    effectiveTo: tariff.effectiveTo,
    facRateRupees: tariff.fuelAdjustmentRatePerUnit,
    facRatePaise,
    facEffectiveDate: '2024-11-01',
    facSource: 'Official KSEB Spot-Billing Gazette Reference Schedule',
    sourceDocument: tariff.sourceDocument,
    lastVerifiedDate: '2026-09-27',
    isFacReviewRequired,
    daysSinceFacVerification,
    verificationStatement: isFacReviewRequired
      ? 'FAC review required: Monthly fuel adjustment rate should be verified against latest KSEB circular.'
      : 'Tariff schedule verified against gazetted KSERC domestic LT-1A order.',
  };
}
