export const APP_CONFIG = {
  appName: 'BILLWISE',
  version: '0.5.0-beta',
  releaseStage: 'public-beta',
  tariffVersionLabel: 'KSERC Nov 2024 (LT-1A)',
  activeTariffId: 'kseb-kserc-2024-v1',
  supportEmail: 'feedback@billwise.app',
  zeroPiiGuarantee: true,
  buildDate: '2026-09-27',
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
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
