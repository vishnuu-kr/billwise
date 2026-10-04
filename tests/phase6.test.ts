import { describe, it, expect, beforeEach } from 'vitest';
import { SITE_CONFIG, getCanonicalUrl, getShareUrl } from '@/lib/config/site';
import { getActiveTariffStatus } from '@/lib/tariffs/status';
import { evaluateTariffIngestion } from '@/lib/tariffs/ingestion';
import { calculateBill } from '@/lib/calculation/engine';
import { predictUsage } from '@/lib/prediction/engine';
import { storageManager } from '@/lib/storage';
import { telemetryStore } from '@/lib/server/telemetryStore';
import { CURRENT_KSEB_TARIFF_VERSION } from '@/lib/tariffs/ksebTariff2024';

describe('Phase 6: Production Infrastructure & Live Service Readiness', () => {
  describe('Site Configuration & Canonical Domain Architecture', () => {
    it('enforces a single canonical domain without trailing slash', () => {
      expect(SITE_CONFIG.domain).toBe('https://billwise.app');
      expect(SITE_CONFIG.domain.endsWith('/')).toBe(false);
    });

    it('generates fully qualified canonical URLs accurately', () => {
      expect(getCanonicalUrl('')).toBe('https://billwise.app/');
      expect(getCanonicalUrl('/')).toBe('https://billwise.app/');
      expect(getCanonicalUrl('predict')).toBe('https://billwise.app/predict');
      expect(getCanonicalUrl('/kseb-tariff')).toBe('https://billwise.app/kseb-tariff');
    });

    it('generates reproducible share URLs with parameter encoding', () => {
      expect(getShareUrl()).toBe('https://billwise.app/predict');
      expect(getShareUrl(240)).toBe('https://billwise.app/predict?units=240');
    });

    it('stamps semantic production versioning', () => {
      expect(SITE_CONFIG.appVersion).toBe('0.6.0-rc.1');
      expect(SITE_CONFIG.calculationEngineVersion).toBe('v1-kserc-deterministic');
      expect(SITE_CONFIG.predictionModelVersion).toBe('v1-daily-run-rate');
      expect(SITE_CONFIG.cacheVersion).toBe('billwise-v0.6.0-rc1');
    });
  });

  describe('Tariff Currency, Status & Ingestion Pipeline', () => {
    it('reports valid operational tariff status and FAC tracking', () => {
      const status = getActiveTariffStatus();
      expect(status.status).toBe('CURRENT');
      expect(status.tariffVersionId).toBe('kseb-kserc-2024-v1');
      expect(status.facRateRupees).toBe(0.01);
      expect(status.facRatePaise).toBe(1);
      expect(status.daysSinceFacVerification).toBeGreaterThanOrEqual(0);
      expect(status.isFacReviewRequired).toBe(false);
      expect(status.verificationStatement).toContain('KSERC');
    });

    it('evaluates tariff ingestion candidates against schema and reference impact', () => {
      const report = evaluateTariffIngestion(CURRENT_KSEB_TARIFF_VERSION);
      expect(report.isValid).toBe(true);
      expect(report.validationErrors).toHaveLength(0);
      expect(report.diffItems).toBeDefined();
      expect(report.referenceImpact.projectedBill).toBe(1148);
    });

    it('rejects invalid candidate tariffs with malformed slabs or negative rates', () => {
      const invalidCandidate = {
        ...CURRENT_KSEB_TARIFF_VERSION,
        telescopicSlabsBiMonthly: [
          { minUnits: 0, maxUnits: 80, ratePerUnit: -5.0, isTelescopic: true }, // negative rate
        ],
      };
      const report = evaluateTariffIngestion(invalidCandidate);
      expect(report.isValid).toBe(false);
      expect(report.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Engine Versioning & Calculation Reproducibility', () => {
    it('stamps calculationEngineVersion on every BillCalculationResult', () => {
      const result = calculateBill({
        units: 240,
        billingCycle: 'bi-monthly',
        phase: 'single',
        connectedLoadWatts: 3000,
      });

      expect(result.calculationEngineVersion).toBe('v1-kserc-deterministic');
      expect(result.effectiveTariffVersion).toBe(CURRENT_KSEB_TARIFF_VERSION.versionName);
      expect(result.total).toBe(1148); // Deterministic reference bill
    });

    it('stamps predictionModelVersion on every PredictionResult', () => {
      const pred = predictUsage({
        currentReading: 10100,
        previousReading: 10000,
        daysElapsed: 25,
        totalCycleDays: 60,
        phase: 'single',
      });

      expect(pred.predictionModelVersion).toBe('v1-daily-run-rate');
      expect(pred.projectedUnits).toBe(240);
      expect(pred.estimatedBill).toBe(1148);
    });

    it('stamps engine and tariff versions on new HistoryRecord creations', () => {
      const newRecord = storageManager.addRecord({
        dateLabel: 'Oct 2026',
        meterReading: 10295,
        consumedUnits: 240,
        predictedBill: 1148,
        billingCycle: 'bi-monthly',
        source: 'manual',
      });

      expect(newRecord.calculationEngineVersion).toBe(SITE_CONFIG.calculationEngineVersion);
      expect(newRecord.predictionModelVersion).toBe(SITE_CONFIG.predictionModelVersion);
      expect(newRecord.tariffVersionId).toBe(SITE_CONFIG.activeTariffId);
    });
  });

  describe('Server Telemetry & Feedback Store (Zero-PII)', () => {
    beforeEach(() => {
      telemetryStore.clear();
    });

    it('enforces IP rate limiting on client actions', () => {
      const clientId = 'test-client-ip-1';
      // Allow 5 requests max
      for (let i = 0; i < 5; i++) {
        expect(telemetryStore.checkRateLimit(clientId, 5, 10000)).toBe(true);
      }
      // 6th request must be rejected
      expect(telemetryStore.checkRateLimit(clientId, 5, 10000)).toBe(false);
    });

    it('aggregates anonymous event counts into funnel metrics', () => {
      telemetryStore.recordEvent({
        event: 'app_opened',
        timestamp: new Date().toISOString(),
        appVersion: '0.6.0-beta',
      });
      telemetryStore.recordEvent({
        event: 'prediction_generated',
        timestamp: new Date().toISOString(),
        appVersion: '0.6.0-beta',
      });

      const summary = telemetryStore.getSummary();
      expect(summary.totalEvents).toBe(2);
      expect(summary.funnelStages.app_opened).toBe(1);
      expect(summary.funnelStages.prediction_generated).toBe(1);
    });

    it('strictly sanitizes PII from feedback submissions on server', () => {
      const record = telemetryStore.recordFeedback({
        context: 'prediction_result',
        sentiment: 'negative',
        category: 'too_high',
        comment: 'My phone is 9876543210 and consumer number is 1155123456789. Email me at user@gmail.com!',
        units: 240,
        predictedBill: 1148,
        actualBill: 1200,
      });

      expect(record.comment).not.toContain('9876543210');
      expect(record.comment).not.toContain('1155123456789');
      expect(record.comment).not.toContain('user@gmail.com');
      expect(record.comment).toContain('[REDACTED_PHONE]');
      expect(record.comment).toContain('[REDACTED_CONSUMER_NO]');
      expect(record.comment).toContain('[REDACTED_EMAIL]');

      const stats = telemetryStore.getFeedbackStats();
      expect(stats.totalFeedback).toBe(1);
      expect(stats.negativeCount).toBe(1);
    });
  });
});
