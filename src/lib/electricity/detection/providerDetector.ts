import { ElectricityProvider, CoverageStatus, UniversalBillInput } from '../types';
import { getAllProviders, NATIONAL_PROVIDER_REGISTRY } from '../providers';

export interface ProviderDetectionResult {
  detectedProvider: ElectricityProvider | null;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0 to 1
  matchedKeywords: string[];
  suggestedTariffCategory?: string;
  isSupported: boolean;
  coverageStatus: CoverageStatus;
  normalizedBillInput?: Partial<UniversalBillInput>;
  rawSnippetMatched?: string;
}

/**
 * Universal Provider Detection and Bill Terminology Normalization Engine
 * Analyzes OCR text or bill headers to identify the Indian electricity provider and category.
 */
export function detectProviderFromBillText(rawText: string): ProviderDetectionResult {
  if (!rawText || !rawText.trim()) {
    return {
      detectedProvider: null,
      confidence: 'low',
      confidenceScore: 0,
      matchedKeywords: [],
      isSupported: false,
      coverageStatus: 'UNSUPPORTED',
    };
  }

  const textLower = rawText.toLowerCase();
  const allProviders = getAllProviders();

  let bestMatch: ElectricityProvider | null = null;
  let highestScore = 0;
  let bestKeywords: string[] = [];

  for (const provider of allProviders) {
    let score = 0;
    const matched: string[] = [];

    // 1. Direct Regex Pattern Match
    if (provider.sampleBillIdentifierPattern) {
      const regex = new RegExp(provider.sampleBillIdentifierPattern, 'i');
      if (regex.test(rawText)) {
        score += 0.6;
        matched.push('regex_pattern_match');
      }
    }

    // 2. Short name / Acronym match (word boundary check)
    const shortNameRegex = new RegExp(`\\b${provider.shortName}\\b`, 'i');
    if (shortNameRegex.test(rawText)) {
      score += 0.45;
      matched.push(`acronym:${provider.shortName}`);
    }

    // 3. Display name or Legal name check
    if (textLower.includes(provider.displayName.toLowerCase())) {
      score += 0.35;
      matched.push('display_name');
    }
    if (textLower.includes(provider.legalName.toLowerCase())) {
      score += 0.4;
      matched.push('legal_name');
    }

    // 4. Aliases
    for (const alias of provider.aliases) {
      if (textLower.includes(alias.toLowerCase())) {
        score += 0.3;
        matched.push(`alias:${alias}`);
        break;
      }
    }

    // 5. Website domain match
    try {
      const host = new URL(provider.website).hostname.replace('www.', '');
      if (textLower.includes(host)) {
        score += 0.5;
        matched.push(`domain:${host}`);
      }
    } catch {
      // ignore
    }

    // 6. Keywords & Service Areas
    let kwHits = 0;
    for (const kw of provider.searchKeywords) {
      if (textLower.includes(kw.toLowerCase())) {
        kwHits++;
      }
    }
    if (kwHits > 0) {
      score += Math.min(0.25, kwHits * 0.08);
      matched.push(`keywords:${kwHits}`);
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = provider;
      bestKeywords = matched;
    }
  }

  // Fallback heuristic: check state names if no strong provider hit
  if (!bestMatch || highestScore < 0.25) {
    if (textLower.includes('kerala')) {
      bestMatch = NATIONAL_PROVIDER_REGISTRY['kseb'];
      highestScore = 0.3;
      bestKeywords.push('state:kerala');
    } else if (textLower.includes('karnataka') || textLower.includes('bangalore') || textLower.includes('bengaluru')) {
      bestMatch = NATIONAL_PROVIDER_REGISTRY['bescom'];
      highestScore = 0.3;
      bestKeywords.push('state:karnataka');
    } else if (textLower.includes('maharashtra') || textLower.includes('mumbai') || textLower.includes('pune')) {
      bestMatch = NATIONAL_PROVIDER_REGISTRY['msedcl'];
      highestScore = 0.3;
      bestKeywords.push('state:maharashtra');
    } else if (textLower.includes('delhi')) {
      bestMatch = NATIONAL_PROVIDER_REGISTRY['tpddl'];
      highestScore = 0.3;
      bestKeywords.push('state:delhi');
    }
  }

  const confidenceScore = Math.min(1, Number(highestScore.toFixed(2)));
  const confidence: 'high' | 'medium' | 'low' =
    confidenceScore >= 0.6 ? 'high' : confidenceScore >= 0.3 ? 'medium' : 'low';

  const isSupported = bestMatch
    ? (bestMatch.coverageStatus === 'FULL' || bestMatch.coverageStatus === 'PARTIAL' || bestMatch.coverageStatus === 'CALCULATOR_ONLY')
    : false;

  // Extract normalized fields
  const normalizedBillInput = extractNormalizedFields(rawText, bestMatch);

  return {
    detectedProvider: bestMatch,
    confidence,
    confidenceScore,
    matchedKeywords: bestKeywords,
    suggestedTariffCategory: bestMatch?.supportedTariffCategories[0],
    isSupported,
    coverageStatus: bestMatch ? bestMatch.coverageStatus : 'UNSUPPORTED',
    normalizedBillInput,
  };
}

/**
 * Normalizes provider-specific bill terminology into a universal input structure
 */
function extractNormalizedFields(rawText: string, provider: ElectricityProvider | null): Partial<UniversalBillInput> {
  const input: Partial<UniversalBillInput> = {};
  if (provider) {
    input.providerId = provider.id;
    input.billingCycle = provider.billingCycles[0] || 'MONTHLY';
  }

  // 1. Units consumed
  const unitPatterns = [
    /(?:units\s*(?:consumed|billed)?|consumption|kwh)\s*[:=-]?\s*(\d{1,5})/i,
    /(?:total\s*units)\s*[:=-]?\s*(\d{1,5})/i,
    /(?:billed\s*units)\s*[:=-]?\s*(\d{1,5})/i,
  ];
  for (const regex of unitPatterns) {
    const match = rawText.match(regex);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val > 0 && val < 50000) {
        input.units = val;
        break;
      }
    }
  }

  // 2. Readings
  const prevReadingMatch = rawText.match(/(?:previous|prev|initial)\s*(?:reading|rdg)?\s*[:=-]?\s*(\d{1,7})/i);
  if (prevReadingMatch && prevReadingMatch[1]) {
    input.previousReading = parseInt(prevReadingMatch[1], 10);
  }

  const currReadingMatch = rawText.match(/(?:present|current|final)\s*(?:reading|rdg)?\s*[:=-]?\s*(\d{1,7})/i);
  if (currReadingMatch && currReadingMatch[1]) {
    input.presentReading = parseInt(currReadingMatch[1], 10);
  }

  // 3. Phase detection
  if (/three\s*[- ]?phase|3\s*[- ]?ph|3\s*[- ]?phase/i.test(rawText)) {
    input.phase = 'three';
  } else if (/single\s*[- ]?phase|1\s*[- ]?ph|1\s*[- ]?phase/i.test(rawText)) {
    input.phase = 'single';
  }

  // 4. Connected load / Sanctioned load
  const loadMatch = rawText.match(/(?:sanctioned|connected|contract)\s*load\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(kw|hp|kva|w)?/i);
  if (loadMatch && loadMatch[1]) {
    let load = parseFloat(loadMatch[1]);
    const unit = (loadMatch[2] || 'kw').toLowerCase();
    if (unit === 'w') load = load / 1000;
    if (unit === 'hp') load = load * 0.746;
    input.connectedLoadKw = Math.round(load * 10) / 10;
  }

  return input;
}
