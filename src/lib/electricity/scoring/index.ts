import { ElectricityProvider, CoverageQualityScore, UniversalTariffVersion } from '../types';
import { getTariffByProviderId } from '../tariffs/registry';

export function calculateProviderQualityScore(
  provider: ElectricityProvider,
  tariff?: UniversalTariffVersion,
  hasGoldenBill: boolean = false,
  hasValidationPassed: boolean = true
): CoverageQualityScore {
  const activeTariff = tariff || getTariffByProviderId(provider.id);

  // 1. Data Coverage Score (0 - 100)
  let dataScore = 0;
  if (provider.website) dataScore += 20;
  if (provider.regulatorId) dataScore += 20;
  if (provider.tariffSourceUrl) dataScore += 30;
  if (provider.consumerPortal || provider.billingPortal) dataScore += 15;
  if (provider.verificationStatus === 'verified') dataScore += 15;

  // 2. Calculation Coverage Score (0 - 100)
  let calcScore = 0;
  if (activeTariff) {
    calcScore += 35; // Active tariff loaded
    if (activeTariff.telescopicSlabs.length > 0 || (activeTariff.nonTelescopicSlabs && activeTariff.nonTelescopicSlabs.length > 0)) {
      calcScore += 25; // Slabs verified
    }
    if (activeTariff.fixedChargeRules.length > 0) {
      calcScore += 15; // Standing charges verified
    }
    if (activeTariff.dutyRule) {
      calcScore += 15; // Statutory duty verified
    }
    if (activeTariff.variableAdjustment || activeTariff.subsidies) {
      calcScore += 10; // Adjustments or subsidies modeled
    }
  }

  // 3. Scan Coverage Score (0 - 100)
  let scanScore = 0;
  if (provider.sampleBillIdentifierPattern) scanScore += 45;
  if (provider.shortName && provider.shortName.length >= 2) scanScore += 25;
  if (provider.searchKeywords.length >= 3) scanScore += 30;

  // Weighted Composite Quality Score
  const overall = Math.round(dataScore * 0.35 + calcScore * 0.40 + scanScore * 0.25);

  return {
    providerId: provider.id,
    dataCoverageScore: Math.min(100, dataScore),
    calculationCoverageScore: Math.min(100, calcScore),
    scanCoverageScore: Math.min(100, scanScore),
    overallQualityScore: Math.min(100, overall),
    breakdown: {
      hasAuthoritativeSource: !!provider.tariffSourceUrl && !!activeTariff?.orderReference,
      hasActiveTariff: !!activeTariff,
      hasGoldenBill,
      hasValidationPassed,
      hasOcrSignature: !!provider.sampleBillIdentifierPattern,
      supportsPrediction: provider.capabilities.supportsPrediction,
    },
  };
}
