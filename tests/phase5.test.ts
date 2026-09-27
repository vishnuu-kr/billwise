import { describe, it, expect, beforeEach } from 'vitest';
import { storageManager } from '../src/lib/storage';
import { analytics } from '../src/lib/observability/analytics';
import { computeTariffDiff } from '../src/lib/tariffs/diff';
import { CURRENT_KSEB_TARIFF_VERSION, PREVIOUS_KSEB_TARIFF_2023 } from '../src/lib/tariffs/ksebTariff2024';
import { APP_CONFIG, FEATURE_FLAGS } from '../src/lib/config/flags';

describe('Phase 5: Public Beta & Launch Readiness', () => {
  beforeEach(() => {
    storageManager.clearFeedback();
  });

  describe('User Feedback System & PII Sanitization', () => {
    it('saves a positive feedback record without comment', () => {
      const fb = storageManager.saveFeedback({
        context: 'prediction_result',
        sentiment: 'positive',
        units: 240,
        predictedBill: 1150,
      });

      expect(fb.id).toBeDefined();
      expect(fb.sentiment).toBe('positive');
      expect(fb.units).toBe(240);

      const all = storageManager.getFeedback();
      expect(all.length).toBe(1);
      expect(all[0].id).toBe(fb.id);
    });

    it('sanitizes mobile phone numbers from user feedback comments', () => {
      const fb = storageManager.saveFeedback({
        context: 'prediction_result',
        sentiment: 'negative',
        category: 'too_high',
        comment: 'Please contact me at 9847123456 to clarify my slab bill.',
      });

      expect(fb.comment).toContain('[REDACTED_PHONE]');
      expect(fb.comment).not.toContain('9847123456');
    });

    it('sanitizes 13-digit KSEB consumer numbers from user feedback comments', () => {
      const fb = storageManager.saveFeedback({
        context: 'scanner',
        sentiment: 'negative',
        category: 'scanner_error',
        comment: 'Bill scanner missed my consumer number 1155823456789 on the receipt.',
      });

      expect(fb.comment).toContain('[REDACTED_CONSUMER_NO]');
      expect(fb.comment).not.toContain('1155823456789');
    });

    it('sanitizes email addresses from user feedback comments', () => {
      const fb = storageManager.saveFeedback({
        context: 'general',
        sentiment: 'neutral',
        category: 'other',
        comment: 'Send updates to testuser.kerala@example.com please.',
      });

      expect(fb.comment).toContain('[REDACTED_EMAIL]');
      expect(fb.comment).not.toContain('testuser.kerala@example.com');
    });

    it('calculates feedback summary stats accurately', () => {
      storageManager.saveFeedback({ context: 'prediction_result', sentiment: 'positive' });
      storageManager.saveFeedback({ context: 'prediction_result', sentiment: 'positive' });
      storageManager.saveFeedback({ context: 'prediction_result', sentiment: 'negative', category: 'too_high' });
      storageManager.saveFeedback({
        context: 'history_actual_bill',
        sentiment: 'positive',
        accuracyRating: 'accurate',
      });

      const stats = storageManager.getFeedbackStats();
      expect(stats.totalFeedback).toBe(4);
      expect(stats.positiveCount).toBe(3);
      expect(stats.negativeCount).toBe(1);
      expect(stats.helpfulRatioPct).toBe(75);
      expect(stats.categoryBreakdown['too_high']).toBe(1);
      expect(stats.accuracyRatings.accurate).toBe(1);
    });
  });

  describe('Analytics Funnel Pipeline', () => {
    it('returns complete 5-stage user funnel with valid conversion metrics', () => {
      const funnel = analytics.getFunnelMetrics();
      expect(funnel.stages.length).toBe(5);
      expect(funnel.stages[0].stage).toBe('visit');
      expect(funnel.stages[1].stage).toBe('input_selected');
      expect(funnel.stages[2].stage).toBe('result_viewed');
      expect(funnel.stages[3].stage).toBe('simulator_used');
      expect(funnel.stages[4].stage).toBe('retention_action');

      // Conversion rates should be percentages between 0 and 100
      for (const st of funnel.stages) {
        expect(st.conversionFromPrevious).toBeGreaterThanOrEqual(0);
        expect(st.conversionFromPrevious).toBeLessThanOrEqual(100);
        expect(st.overallConversion).toBeGreaterThanOrEqual(0);
        expect(st.overallConversion).toBeLessThanOrEqual(100);
      }
    });

    it('tracks flow events and updates stage drop-off detection', () => {
      analytics.track('flow_started', { flow: 'direct_units' });
      analytics.track('result_viewed', { units: 200 });
      const funnel = analytics.getFunnelMetrics();
      expect(funnel.totalVisitors).toBeGreaterThan(0);
      expect(funnel.highestDropOffStage).toBeDefined();
    });
  });

  describe('Tariff Diff & Evolution Engine', () => {
    it('computes exact structural differences between 2023 and 2024 tariffs', () => {
      const diffs = computeTariffDiff(PREVIOUS_KSEB_TARIFF_2023, CURRENT_KSEB_TARIFF_VERSION);
      expect(diffs.length).toBeGreaterThan(0);

      // Should have telescopic energy diff items
      const telescopicDiffs = diffs.filter(d => d.category === 'telescopic_energy');
      expect(telescopicDiffs.length).toBeGreaterThan(0);

      // Should have fixed charge diff items
      const fixedDiffs = diffs.filter(d => d.category === 'fixed_charge');
      expect(fixedDiffs.length).toBeGreaterThan(0);

      // Should have levy and subsidy items
      const levyDiffs = diffs.filter(d => d.category === 'levy_subsidy');
      expect(levyDiffs.length).toBeGreaterThan(0);

      // Formatted delta should be human readable
      for (const d of diffs) {
        expect(typeof d.formattedDelta).toBe('string');
        expect(d.delta).toBeDefined();
      }
    });
  });

  describe('Feature Flags & Release Configuration', () => {
    it('provides valid release metadata and stage', () => {
      expect(APP_CONFIG.appName).toBe('BILLWISE');
      expect(APP_CONFIG.version).toMatch(/^0\.[56]\.0-beta$/);
      expect(APP_CONFIG.releaseStage).toMatch(/beta/i);
      expect(APP_CONFIG.zeroPiiGuarantee).toBe(true);
    });

    it('has core features activated under FEATURE_FLAGS', () => {
      expect(FEATURE_FLAGS.enableMeterOcr).toBe(true);
      expect(FEATURE_FLAGS.enableBillOcr).toBe(true);
      expect(FEATURE_FLAGS.enableAnalytics).toBe(true);
      expect(FEATURE_FLAGS.enableFeedbackWidget).toBe(true);
      expect(FEATURE_FLAGS.enableShareModal).toBe(true);
    });

    it('tracks onboarding completion flag in storage', () => {
      storageManager.setOnboardingCompleted(false);
      expect(storageManager.isOnboardingCompleted()).toBe(false);

      storageManager.setOnboardingCompleted(true);
      expect(storageManager.isOnboardingCompleted()).toBe(true);
    });
  });
});
