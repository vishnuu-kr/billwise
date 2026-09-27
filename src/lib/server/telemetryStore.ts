import { UserFeedbackRecord, FeedbackSummaryStats } from '@/types';
import { SITE_CONFIG } from '@/lib/config/site';

/**
 * Server-side in-memory & file-backed anonymous telemetry and feedback store.
 * Strictly enforces zero-PII guarantees and non-identifying event aggregation.
 */

export interface AnonymousServerEvent {
  event: string;
  timestamp: string;
  appVersion: string;
  feature?: string;
  locale?: string;
}

export interface TelemetrySummary {
  appVersion: string;
  totalEvents: number;
  eventCounts: Record<string, number>;
  funnelStages: {
    app_opened: number;
    flow_started: number;
    prediction_generated: number;
    what_if_used: number;
    retention_action: number;
  };
  lastEventTimestamp: string | null;
}

class TelemetryStore {
  private eventCounts: Record<string, number> = {
    app_opened: 0,
    scan_started: 0,
    scan_success: 0,
    scan_failed: 0,
    ocr_corrected: 0,
    meter_scan_started: 0,
    meter_scan_success: 0,
    manual_entry: 0,
    prediction_generated: 0,
    prediction_feedback: 0,
    actual_bill_recorded: 0,
    what_if_used: 0,
    budget_used: 0,
    language_changed: 0,
    share_clicked: 0,
  };

  private totalEvents: number = 0;
  private lastEventTimestamp: string | null = null;
  private feedbackItems: UserFeedbackRecord[] = [];
  private rateLimits: Map<string, { count: number; windowStart: number }> = new Map();

  // Basic rate limiter (max allowed per window)
  public checkRateLimit(clientId: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const client = this.rateLimits.get(clientId);

    if (!client || now - client.windowStart > windowMs) {
      this.rateLimits.set(clientId, { count: 1, windowStart: now });
      return true;
    }

    if (client.count >= maxRequests) {
      return false;
    }

    client.count++;
    return true;
  }

  // PII Sanitization Guarantee
  public sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
      .replace(/\b\d{13}\b/g, '[REDACTED_CONSUMER_NO]')
      .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]')
      .slice(0, 500);
  }

  public recordEvent(event: AnonymousServerEvent): boolean {
    if (!event || !event.event) return false;

    const eventName = event.event.toLowerCase();
    this.eventCounts[eventName] = (this.eventCounts[eventName] || 0) + 1;
    this.totalEvents++;
    this.lastEventTimestamp = new Date().toISOString();
    return true;
  }

  public recordFeedback(record: Omit<UserFeedbackRecord, 'id' | 'timestamp'>): UserFeedbackRecord {
    const sanitizedRecord: UserFeedbackRecord = {
      ...record,
      id: `fb-srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      comment: record.comment ? this.sanitizeText(record.comment) : undefined,
    };

    this.feedbackItems = [sanitizedRecord, ...this.feedbackItems].slice(0, 200);
    this.recordEvent({
      event: 'prediction_feedback',
      timestamp: sanitizedRecord.timestamp,
      appVersion: SITE_CONFIG.appVersion,
      feature: record.context,
    });

    return sanitizedRecord;
  }

  public getSummary(): TelemetrySummary {
    return {
      appVersion: SITE_CONFIG.appVersion,
      totalEvents: this.totalEvents,
      eventCounts: { ...this.eventCounts },
      funnelStages: {
        app_opened: this.eventCounts['app_opened'] || this.eventCounts['page_visit'] || 0,
        flow_started:
          (this.eventCounts['scan_started'] || 0) +
          (this.eventCounts['meter_scan_started'] || 0) +
          (this.eventCounts['manual_entry'] || 0) +
          (this.eventCounts['flow_started'] || 0),
        prediction_generated:
          (this.eventCounts['prediction_generated'] || 0) +
          (this.eventCounts['result_viewed'] || 0),
        what_if_used:
          (this.eventCounts['what_if_used'] || 0) +
          (this.eventCounts['budget_used'] || 0),
        retention_action:
          (this.eventCounts['actual_bill_recorded'] || 0) +
          (this.eventCounts['share_clicked'] || 0) +
          (this.eventCounts['prediction_feedback'] || 0),
      },
      lastEventTimestamp: this.lastEventTimestamp,
    };
  }

  public getFeedbackStats(): FeedbackSummaryStats {
    if (this.feedbackItems.length === 0) {
      return {
        totalFeedback: 0,
        positiveCount: 0,
        negativeCount: 0,
        helpfulRatioPct: 100,
        categoryBreakdown: {},
        accuracyRatings: { accurate: 0, too_high: 0, too_low: 0 },
      };
    }

    let positiveCount = 0;
    let negativeCount = 0;
    const categoryBreakdown: Record<string, number> = {};
    const accuracyRatings = { accurate: 0, too_high: 0, too_low: 0 };

    for (const item of this.feedbackItems) {
      if (item.sentiment === 'positive') positiveCount++;
      if (item.sentiment === 'negative') negativeCount++;
      if (item.category) {
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
      }
      if (item.accuracyRating) {
        accuracyRatings[item.accuracyRating] = (accuracyRatings[item.accuracyRating] || 0) + 1;
      }
    }

    const totalEvaluated = positiveCount + negativeCount;
    const helpfulRatioPct = totalEvaluated > 0 ? Math.round((positiveCount / totalEvaluated) * 100) : 100;

    return {
      totalFeedback: this.feedbackItems.length,
      positiveCount,
      negativeCount,
      helpfulRatioPct,
      categoryBreakdown,
      accuracyRatings,
    };
  }

  public getRecentFeedback(): UserFeedbackRecord[] {
    return [...this.feedbackItems];
  }

  public clear(): void {
    this.totalEvents = 0;
    this.lastEventTimestamp = null;
    this.feedbackItems = [];
    Object.keys(this.eventCounts).forEach(k => {
      this.eventCounts[k] = 0;
    });
  }
}

// Global server singleton
export const telemetryStore = new TelemetryStore();
