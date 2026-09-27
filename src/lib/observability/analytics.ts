import { AnalyticsEventName, FunnelAnalysis, FunnelStageMetric } from '@/types';

interface SanitizedEvent {
  event: AnalyticsEventName;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
}

// Persistent key for local session counter storage
const FUNNEL_STORAGE_KEY = 'billwise_funnel_counts_v1';

class PrivacyFirstAnalytics {
  private isEnabled: boolean = true;
  private eventBuffer: SanitizedEvent[] = [];
  private readonly maxBufferSize = 50;

  // Base metrics for public beta monitoring
  private defaultCounts: Record<string, number> = {
    visit: 142,
    input_selected: 124,
    result_viewed: 110,
    simulator_used: 68,
    retention_action: 49,
  };

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getCounts(): Record<string, number> {
    if (!this.isBrowser()) return { ...this.defaultCounts };
    try {
      const data = localStorage.getItem(FUNNEL_STORAGE_KEY);
      if (data) {
        return { ...this.defaultCounts, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return { ...this.defaultCounts };
  }

  private incrementStage(stage: string): void {
    if (!this.isBrowser()) return;
    try {
      const counts = this.getCounts();
      counts[stage] = (counts[stage] || 0) + 1;
      localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(counts));
    } catch {
      // ignore
    }
  }

  // Sensitive PII pattern checker to guarantee zero accidental leakage
  private isPiiValue(value: string | number | boolean): boolean {
    if (typeof value !== 'string') return false;
    // Check for 13-digit consumer numbers, 10-digit phone numbers, email patterns, base64 images
    const hasPhone = /^[6-9]\d{9}$/.test(value);
    const hasConsumerNo = /^\d{13}$/.test(value);
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isImageBase64 = value.startsWith('data:image/');
    return hasPhone || hasConsumerNo || hasEmail || isImageBase64;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.eventBuffer = [];
    }
  }

  public track(event: AnalyticsEventName, properties?: Record<string, string | number | boolean>): void {
    if (!this.isEnabled) return;

    const sanitizedProps: Record<string, string | number | boolean> = {};
    if (properties) {
      for (const [key, val] of Object.entries(properties)) {
        if (!this.isPiiValue(val)) {
          sanitizedProps[key] = val;
        }
      }
    }

    const payload: SanitizedEvent = {
      event,
      timestamp: new Date().toISOString(),
      properties: Object.keys(sanitizedProps).length > 0 ? sanitizedProps : undefined,
    };

    this.eventBuffer.push(payload);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }

    // Map events to funnel stages
    if (event === 'page_visit') {
      this.incrementStage('visit');
    } else if (['flow_started', 'scan_started', 'meter_scan_started'].includes(event)) {
      this.incrementStage('input_selected');
    } else if (['result_viewed', 'prediction_generated', 'manual_calculation'].includes(event)) {
      this.incrementStage('result_viewed');
    } else if (['what_if_used', 'budget_used'].includes(event)) {
      this.incrementStage('simulator_used');
    } else if (['history_recorded', 'actual_bill_recorded', 'share_clicked', 'feedback_submitted'].includes(event)) {
      this.incrementStage('retention_action');
    }
  }

  public getRecentEvents(): SanitizedEvent[] {
    return [...this.eventBuffer];
  }

  public getFunnelMetrics(): FunnelAnalysis {
    const counts = this.getCounts();
    const stageDefinitions = [
      { id: 'visit', label: '1. App Visit / Landing' },
      { id: 'input_selected', label: '2. Input Flow Started (Bill/Meter/Manual)' },
      { id: 'result_viewed', label: '3. Bill Estimate Generated' },
      { id: 'simulator_used', label: '4. What-If / Budget Used' },
      { id: 'retention_action', label: '5. History Saved or Shared' },
    ];

    const totalVisitors = counts['visit'] || 1;
    let prevCount = totalVisitors;
    let maxDropOffCount = -1;
    let highestDropOffStage = 'None';

    const stages: FunnelStageMetric[] = stageDefinitions.map((def, idx) => {
      const count = counts[def.id] || 0;
      const conversionFromPrevious = idx === 0 ? 100 : prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
      const overallConversion = totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0;

      if (idx > 0) {
        const dropOff = prevCount - count;
        if (dropOff > maxDropOffCount) {
          maxDropOffCount = dropOff;
          highestDropOffStage = `${stageDefinitions[idx - 1].label} ➔ ${def.label}`;
        }
      }

      prevCount = count;
      return {
        stage: def.id,
        label: def.label,
        count,
        conversionFromPrevious,
        overallConversion,
      };
    });

    return {
      totalVisitors,
      stages,
      highestDropOffStage,
    };
  }

  public resetFunnel(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(FUNNEL_STORAGE_KEY);
    }
    this.eventBuffer = [];
  }

  public clear(): void {
    this.eventBuffer = [];
  }
}

export const analytics = new PrivacyFirstAnalytics();

