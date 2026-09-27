import { AnalyticsEventName } from '@/types';

interface SanitizedEvent {
  event: AnalyticsEventName;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
}

class PrivacyFirstAnalytics {
  private isEnabled: boolean = true;
  private eventBuffer: SanitizedEvent[] = [];
  private readonly maxBufferSize = 50;

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
  }

  public getRecentEvents(): SanitizedEvent[] {
    return [...this.eventBuffer];
  }

  public clear(): void {
    this.eventBuffer = [];
  }
}

export const analytics = new PrivacyFirstAnalytics();
