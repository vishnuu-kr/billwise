/**
 * Canonical Data Access Layer for National Electricity Providers & Tariffs
 * Unified interface for UI and domain layers to query provider and tariff information.
 */

import {
  ElectricityProvider,
  UniversalTariffVersion,
  ProviderCapabilityFlags,
  CoverageQualityScore,
  ProviderSearchOptions,
  ProviderSearchResult,
  NationalCoverageSummary,
  CoverageStatus,
} from './types';
import {
  NATIONAL_PROVIDER_REGISTRY,
  getProviderById as lookupProviderById,
  getAllProviders as lookupAllProviders,
  getProvidersByState as lookupProvidersByState,
} from './providers';
import {
  UNIVERSAL_TARIFF_REGISTRY,
  getTariffByProviderId,
  getActiveTariffForDate,
} from './tariffs/registry';
import { calculateProviderQualityScore } from './scoring';

export function getProviderById(id: string): ElectricityProvider | undefined {
  if (!id) return undefined;
  return lookupProviderById(id);
}

export function getAllProviders(): ElectricityProvider[] {
  return lookupAllProviders();
}

export function getProvidersByState(stateOrCode: string): ElectricityProvider[] {
  return lookupProvidersByState(stateOrCode);
}

export function searchProviders(
  query: string,
  options?: ProviderSearchOptions
): ProviderSearchResult[] {
  const all = getAllProviders();
  const q = (query || '').trim().toLowerCase();

  let filtered = all;
  if (options?.state) {
    const s = options.state.toLowerCase();
    filtered = filtered.filter(p => p.state.toLowerCase() === s || p.stateCode.toLowerCase() === s);
  }
  if (options?.coverageStatus) {
    filtered = filtered.filter(p => p.coverageStatus === options.coverageStatus);
  }
  if (options?.providerType) {
    filtered = filtered.filter(p => p.providerType === options.providerType);
  }

  if (!q) {
    return filtered.map(provider => ({
      provider,
      matchScore: 1.0,
      matchedField: 'all',
    }));
  }

  const results: ProviderSearchResult[] = [];

  for (const provider of filtered) {
    let score = 0;
    let matchedField = '';

    // Exact ID or shortName match
    if (provider.id === q || provider.shortName.toLowerCase() === q) {
      score = 1.0;
      matchedField = 'shortName';
    } else if (provider.displayName.toLowerCase().includes(q)) {
      score = 0.85;
      matchedField = 'displayName';
    } else if (provider.legalName.toLowerCase().includes(q)) {
      score = 0.75;
      matchedField = 'legalName';
    } else if (provider.aliases.some(a => a.toLowerCase().includes(q))) {
      score = 0.8;
      matchedField = 'alias';
    } else if (provider.state.toLowerCase().includes(q) || provider.stateCode.toLowerCase() === q) {
      score = 0.7;
      matchedField = 'state';
    } else if (provider.serviceAreas.some(area => area.toLowerCase().includes(q))) {
      score = 0.65;
      matchedField = 'serviceArea';
    } else if (provider.searchKeywords.some(kw => kw.includes(q))) {
      score = 0.55;
      matchedField = 'keyword';
    }

    if (score > 0) {
      results.push({ provider, matchScore: score, matchedField });
    }
  }

  // Sort by relevance score descending, then FULL coverage first
  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    const rank: Record<CoverageStatus, number> = {
      FULL: 1,
      PARTIAL: 2,
      CALCULATOR_ONLY: 3,
      PARSER_ONLY: 4,
      DETECTION_ONLY: 5,
      UNDER_REVIEW: 6,
      UNSUPPORTED: 7,
    };
    return rank[a.provider.coverageStatus] - rank[b.provider.coverageStatus];
  });
}

export function getTariffConfigurations(providerId: string): UniversalTariffVersion[] {
  const norm = providerId.toLowerCase();
  return Object.values(UNIVERSAL_TARIFF_REGISTRY).filter(
    t => t.providerId.toLowerCase() === norm
  );
}

export function getActiveTariff(
  providerId: string,
  asOfDate?: string
): UniversalTariffVersion | undefined {
  return getActiveTariffForDate(providerId, asOfDate) || getTariffByProviderId(providerId);
}

export function getProviderCapabilities(providerId: string): ProviderCapabilityFlags {
  const provider = getProviderById(providerId);
  if (!provider) {
    return {
      supportsMeterReading: false,
      supportsToD: false,
      supportsSolarNetMetering: false,
      supportsDemandCharges: false,
      supportsPrepaid: false,
      supportsPrediction: false,
      supportsBudgetInverse: false,
      supportsSubsidies: false,
      supportsWheelingCharges: false,
    };
  }
  return provider.capabilities;
}

export function getCoverageQualityScore(providerId: string): CoverageQualityScore {
  const provider = getProviderById(providerId);
  if (!provider) {
    return {
      providerId,
      dataCoverageScore: 0,
      calculationCoverageScore: 0,
      scanCoverageScore: 0,
      overallQualityScore: 0,
      breakdown: {
        hasAuthoritativeSource: false,
        hasActiveTariff: false,
        hasGoldenBill: false,
        hasValidationPassed: false,
        hasOcrSignature: false,
        supportsPrediction: false,
      },
    };
  }
  const tariff = getActiveTariff(providerId);
  const isFull = provider.coverageStatus === 'FULL';
  return calculateProviderQualityScore(provider, tariff, isFull, isFull);
}

export function getNationalCoverageSummary(): NationalCoverageSummary {
  const providers = getAllProviders();
  const states = new Set(providers.map(p => p.state));
  const counts: Record<CoverageStatus, number> = {
    FULL: 0,
    PARTIAL: 0,
    CALCULATOR_ONLY: 0,
    PARSER_ONLY: 0,
    DETECTION_ONLY: 0,
    UNSUPPORTED: 0,
    UNDER_REVIEW: 0,
  };

  let totalScore = 0;
  const fullCoverageProviders: string[] = [];

  for (const p of providers) {
    counts[p.coverageStatus] = (counts[p.coverageStatus] || 0) + 1;
    const score = getCoverageQualityScore(p.id);
    totalScore += score.overallQualityScore;
    if (p.coverageStatus === 'FULL') {
      fullCoverageProviders.push(p.shortName);
    }
  }

  return {
    totalProviders: providers.length,
    coveredStates: states.size,
    coverageCounts: counts,
    averageQualityScore: Math.round(totalScore / (providers.length || 1)),
    fullCoverageProviders,
    lastUpdated: '2026-10-04',
  };
}
