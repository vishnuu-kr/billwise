/**
 * BILLWISE Canonical Site & Service Configuration
 * Single source of truth for domain, versions, and service endpoints.
 */

const RAW_DOMAIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'test'
    ? 'https://billwise.app'
    : 'https://billwise-eight.vercel.app');
// Strip trailing slash if present to guarantee uniform URL construction
const NORMALIZED_DOMAIN = RAW_DOMAIN.replace(/\/+$/, '');

export const SITE_CONFIG = {
  name: 'BILLWISE',
  title: 'BILLWISE — India Electricity Intelligence & Bill Predictor (25+ Boards)',
  tagline: 'Know your electricity bill before it arrives',
  description:
    'Smart electricity intelligence for households across India. Predict your next bill for Kerala (KSEB), Karnataka (BESCOM), Maharashtra (MSEDCL), Delhi, Tamil Nadu, and 15+ states without technical jargon.',
  domain: NORMALIZED_DOMAIN,
  supportEmail: 'feedback@billwise.app',
  releaseStage: 'Launch Candidate 1 (v0.6.0-rc.1)',

  // Versioning Architecture (Launch Candidate)
  appVersion: '0.6.0-rc.1',
  calculationEngineVersion: 'v1-kserc-deterministic',
  predictionModelVersion: 'v1-daily-run-rate',
  cacheVersion: 'billwise-v0.6.0-rc1',
  schemaVersion: 1,

  // Tariff Baseline Reference
  activeTariffId: 'kseb-kserc-2024-v1',
  activeTariffLabel: 'KSERC Nov 2024 (LT-1A)',
  activeFacRate: 0.01, // 1 paisa/unit reference baseline
  facEffectiveDate: '2024-11-01',
  facLastVerifiedDate: '2026-09-27',

  // Operational Flags
  isPublicBeta: true,
} as const;

/**
 * Constructs a fully qualified canonical URL from a relative path.
 */
export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.domain}${cleanPath}`;
}

/**
 * Returns the shareable link for bill predictions.
 */
export function getShareUrl(units?: number): string {
  if (typeof units === 'number' && units > 0) {
    return `${SITE_CONFIG.domain}/predict?units=${units}`;
  }
  return `${SITE_CONFIG.domain}/predict`;
}
