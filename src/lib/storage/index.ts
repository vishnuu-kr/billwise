import { HistoryRecord, BudgetConfig, UserFeedbackRecord, FeedbackSummaryStats } from '@/types';

export const CURRENT_SCHEMA_VERSION = 1;

const STORAGE_KEYS = {
  SCHEMA_VERSION: 'billwise_schema_version',
  HISTORY: 'billwise_history_v1',
  BUDGET: 'billwise_budget_v1',
  LAST_READING: 'billwise_last_reading_v1',
  LANGUAGE: 'billwise_lang_v1',
  DISMISSED_NOTICES: 'billwise_notices_v1',
  FEEDBACK: 'billwise_feedback_v1',
  ONBOARDING: 'billwise_onboarding_completed',
};

// Initial realistic seed history for Kerala domestic user (based on actual reference bill)
const SEED_HISTORY: HistoryRecord[] = [
  {
    id: 'hist-001',
    timestamp: '2026-06-05T10:00:00Z',
    dateLabel: 'Jun 2026',
    meterReading: 9815,
    consumedUnits: 215,
    predictedBill: 1010,
    actualBill: 1012,
    billingCycle: 'bi-monthly',
    source: 'manual',
    notes: 'Pre-monsoon cycle',
  },
  {
    id: 'hist-002',
    timestamp: '2026-08-04T10:00:00Z',
    dateLabel: 'Aug 2026',
    meterReading: 10055,
    consumedUnits: 240,
    predictedBill: 1150,
    actualBill: 1148,
    billingCycle: 'bi-monthly',
    source: 'scan',
    notes: 'Reference fixture bill',
  },
];

export class StorageManager {
  private memoryStore: Map<string, string> = new Map();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getItem(key: string): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(key);
    }
    return this.memoryStore.get(key) || null;
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    } else {
      this.memoryStore.set(key, value);
    }
  }

  private removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  hasHistory(): boolean {
    try {
      const data = this.getItem(STORAGE_KEYS.HISTORY);
      return !!data && JSON.parse(data).length > 0;
    } catch {
      return false;
    }
  }

  getHistory(): HistoryRecord[] {
    try {
      const data = this.getItem(STORAGE_KEYS.HISTORY);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  saveHistory(records: HistoryRecord[]): void {
    try {
      this.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }

  loadSampleData(): void {
    this.saveHistory(SEED_HISTORY);
  }

  addRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord {
    const records = this.getHistory();
    const newRecord: HistoryRecord = {
      ...record,
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newRecord, ...records];
    this.saveHistory(updated);
    
    // Also save last reading for easy carry-forward
    if (record.meterReading) {
      this.saveLastReading(record.meterReading, record.dateLabel);
    }
    
    return newRecord;
  }

  getLastReading(): { reading: number; date: string } | null {
    try {
      const val = this.getItem(STORAGE_KEYS.LAST_READING);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  saveLastReading(reading: number, date?: string): void {
    try {
      this.setItem(STORAGE_KEYS.LAST_READING, JSON.stringify({
        reading,
        date: date || new Date().toISOString().slice(0, 10),
      }));
    } catch (e) {
      console.error('Failed to save last reading', e);
    }
  }

  recordActualBill(recordId: string, actualBill: number): boolean {
    const records = this.getHistory();
    const target = records.find(r => r.id === recordId);
    if (!target) return false;
    target.actualBill = actualBill;
    this.saveHistory(records);
    return true;
  }

  getPredictionAccuracyStats(): {
    totalEvaluated: number;
    averageErrorRupees: number;
    accuracyStatement: string;
  } {
    const records = this.getHistory().filter(r => r.predictedBill > 0 && typeof r.actualBill === 'number');
    if (records.length === 0) {
      return {
        totalEvaluated: 0,
        averageErrorRupees: 0,
        accuracyStatement: 'Enter your actual bill when it arrives to see prediction accuracy calibration.',
      };
    }

    const totalDiff = records.reduce((sum, r) => sum + Math.abs((r.actualBill as number) - r.predictedBill), 0);
    const avgDiff = Math.round(totalDiff / records.length);

    return {
      totalEvaluated: records.length,
      averageErrorRupees: avgDiff,
      accuracyStatement: `Based on ${records.length} evaluated billing cycle${records.length > 1 ? 's' : ''}, estimates have been within approx ₹${avgDiff} of actual KSEB bills.`,
    };
  }

  getBudget(): BudgetConfig {
    const defaultBudget: BudgetConfig = {
      monthlyTargetRupees: 1000,
      billingCycleTargetRupees: 2000,
      createdDate: new Date().toISOString(),
    };
    try {
      const data = this.getItem(STORAGE_KEYS.BUDGET);
      return data ? JSON.parse(data) : defaultBudget;
    } catch {
      return defaultBudget;
    }
  }

  saveBudget(budget: BudgetConfig): void {
    try {
      this.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    } catch (e) {
      console.error('Failed to save budget', e);
    }
  }

  exportData(): string {
    const payload = {
      history: this.getHistory(),
      budget: this.getBudget(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(payload, null, 2);
  }

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.history)) {
        this.saveHistory(parsed.history);
      }
      if (parsed.budget) {
        this.saveBudget(parsed.budget);
      }
      return true;
    } catch {
      return false;
    }
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
    this.memoryStore.clear();
  }

  getUsageTrendStats(): {
    averageUnits: number;
    averageBill: number;
    trendPercentage: number;
    highestRecord: HistoryRecord | null;
    lowestRecord: HistoryRecord | null;
    trendStatement: string;
  } {
    const history = this.getHistory();
    if (history.length === 0) {
      return {
        averageUnits: 0,
        averageBill: 0,
        trendPercentage: 0,
        highestRecord: null,
        lowestRecord: null,
        trendStatement: 'No readings recorded yet.',
      };
    }

    const totalUnits = history.reduce((sum, h) => sum + h.consumedUnits, 0);
    const averageUnits = Math.round(totalUnits / history.length);

    const totalBill = history.reduce((sum, h) => sum + (h.actualBill ?? h.predictedBill), 0);
    const averageBill = Math.round(totalBill / history.length);

    let highestRecord = history[0];
    let lowestRecord = history[0];

    for (const h of history) {
      if (h.consumedUnits > highestRecord.consumedUnits) highestRecord = h;
      if (h.consumedUnits < lowestRecord.consumedUnits) lowestRecord = h;
    }

    // Compare latest vs average
    const latest = history[0];
    let trendPercentage = 0;
    let trendStatement = 'Your average usage has stayed similar.';

    if (history.length >= 2 && averageUnits > 0) {
      trendPercentage = Math.round(((latest.consumedUnits - averageUnits) / averageUnits) * 100);
      if (trendPercentage > 5) {
        trendStatement = `Your latest usage (${latest.consumedUnits} units) is up ${trendPercentage}% compared with your recent average.`;
      } else if (trendPercentage < -5) {
        trendStatement = `Your latest usage (${latest.consumedUnits} units) is down ${Math.abs(trendPercentage)}% compared with your recent average.`;
      } else {
        trendStatement = `Your usage has remained steady within normal limits around ${averageUnits} units.`;
      }
    }

    return {
      averageUnits,
      averageBill,
      trendPercentage,
      highestRecord,
      lowestRecord,
      trendStatement,
    };
  }

  // ==========================================
  // Phase 5: Feedback & Onboarding Methods
  // ==========================================

  public sanitizeFeedbackText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
      .replace(/\b\d{13}\b/g, '[REDACTED_CONSUMER_NO]')
      .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]')
      .slice(0, 500); // Guard max length
  }

  getFeedback(): UserFeedbackRecord[] {
    try {
      const data = this.getItem(STORAGE_KEYS.FEEDBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveFeedback(record: Omit<UserFeedbackRecord, 'id' | 'timestamp'>): UserFeedbackRecord {
    const feedbackList = this.getFeedback();
    const sanitizedRecord: UserFeedbackRecord = {
      ...record,
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      comment: record.comment ? this.sanitizeFeedbackText(record.comment) : undefined,
    };

    const updated = [sanitizedRecord, ...feedbackList].slice(0, 100); // keep up to 100 recent
    try {
      this.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save feedback', e);
    }
    return sanitizedRecord;
  }

  getFeedbackStats(): FeedbackSummaryStats {
    const feedbackList = this.getFeedback();
    if (feedbackList.length === 0) {
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

    for (const item of feedbackList) {
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
      totalFeedback: feedbackList.length,
      positiveCount,
      negativeCount,
      helpfulRatioPct,
      categoryBreakdown,
      accuracyRatings,
    };
  }

  clearFeedback(): void {
    this.removeItem(STORAGE_KEYS.FEEDBACK);
  }

  isOnboardingCompleted(): boolean {
    return this.getItem(STORAGE_KEYS.ONBOARDING) === 'true';
  }

  setOnboardingCompleted(completed: boolean = true): void {
    this.setItem(STORAGE_KEYS.ONBOARDING, completed ? 'true' : 'false');
  }

  // ==========================================
  // Schema Versioning & Self-Healing Migration
  // ==========================================

  getSchemaVersion(): number {
    try {
      const v = this.getItem(STORAGE_KEYS.SCHEMA_VERSION);
      return v ? parseInt(v, 10) : 1;
    } catch {
      return 1;
    }
  }

  migrateSchema(targetVersion: number = CURRENT_SCHEMA_VERSION): {
    oldVersion: number;
    newVersion: number;
    success: boolean;
  } {
    const oldVersion = this.getSchemaVersion();
    if (oldVersion >= targetVersion) {
      return { oldVersion, newVersion: oldVersion, success: true };
    }

    try {
      // Step-by-step migrations
      if (oldVersion < 1) {
        // Migration to v1: Ensure valid JSON in history & budget
        const rawHistory = this.getItem(STORAGE_KEYS.HISTORY);
        if (rawHistory) {
          try {
            JSON.parse(rawHistory);
          } catch {
            // Self-healing: Reset corrupted history to empty array
            this.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
          }
        }
      }

      this.setItem(STORAGE_KEYS.SCHEMA_VERSION, targetVersion.toString());
      return { oldVersion, newVersion: targetVersion, success: true };
    } catch (e) {
      console.error('Schema migration failed, retaining current schema', e);
      return { oldVersion, newVersion: oldVersion, success: false };
    }
  }
}

export const storageManager = new StorageManager();
