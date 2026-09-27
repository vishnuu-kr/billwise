import { NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/lib/config/site';
import { tariffRepo } from '@/lib/tariffs';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET() {
  const currentTariff = tariffRepo.getCurrentTariff();

  // Check if FAC is outdated (> 60 days since verification)
  const lastVerified = new Date(SITE_CONFIG.facLastVerifiedDate).getTime();
  const daysSinceFacCheck = Math.floor((Date.now() - lastVerified) / (1000 * 60 * 60 * 24));
  const isFacReviewRequired = daysSinceFacCheck > 60;

  const health = {
    status: 'HEALTHY',
    service: SITE_CONFIG.name,
    appVersion: SITE_CONFIG.appVersion,
    calculationEngineVersion: SITE_CONFIG.calculationEngineVersion,
    predictionModelVersion: SITE_CONFIG.predictionModelVersion,
    tariff: {
      id: currentTariff.id,
      name: currentTariff.versionName,
      status: currentTariff.isCurrent ? 'CURRENT' : 'ARCHIVED',
      effectiveFrom: currentTariff.effectiveFrom,
      effectiveTo: currentTariff.effectiveTo,
      facRateRupees: currentTariff.fuelAdjustmentRatePerUnit,
      dutyRate: currentTariff.electricityDutyRate,
      isFacReviewRequired,
      daysSinceFacCheck,
    },
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(health, { status: 200 });
}
