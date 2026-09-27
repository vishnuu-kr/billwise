import { SITE_CONFIG } from './site';

export const APP_CONFIG = {
  appName: SITE_CONFIG.name,
  version: SITE_CONFIG.appVersion,
  releaseStage: SITE_CONFIG.releaseStage,
  tariffVersionLabel: SITE_CONFIG.activeTariffLabel,
  activeTariffId: SITE_CONFIG.activeTariffId,
  supportEmail: SITE_CONFIG.supportEmail,
  zeroPiiGuarantee: true,
  buildDate: '2026-09-27',
  domain: SITE_CONFIG.domain,
} as const;

export const FEATURE_FLAGS = {
  enableMeterOcr: true,
  enableBillOcr: true,
  enableAnalytics: true,
  enableShareModal: true,
  enableFeedbackWidget: true,
  enableOnboardingGuide: true,
  enableTariffAuditConsole: true,
  showBetaBadge: true,
  // Staged feature rollout percentages (0, 10, 50, 100) as per Section 39
  rolloutPercentages: {
    meterOcr: 100,
    billOcr: 100,
    remoteTelemetry: 100,
    experimentalPrediction: 0, // Disabled in production
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
