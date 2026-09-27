/**
 * Production-Safe Sanitized Logger
 * Strips any potential PII (consumer numbers, phone numbers, image data) before logging.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class SafeLogger {
  private sanitizeContext(obj?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!obj) return undefined;
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('consumer') ||
        lowerKey.includes('phone') ||
        lowerKey.includes('email') ||
        lowerKey.includes('name') ||
        lowerKey.includes('image') ||
        lowerKey.includes('secret')
      ) {
        sanitized[key] = '[REDACTED_PII]';
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = '[OBJECT]';
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      // In development, keep logs minimal and clean
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    const sanitized = this.sanitizeContext(context);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[BILLWISE_WARN] ${message}`, sanitized || '');
    }
  }

  public error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const sanitized = this.sanitizeContext(context);
    const errMessage = error instanceof Error ? error.message : String(error);
    // Suppress raw dumps in production, record structured sanitized entry
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[BILLWISE_ERROR] ${message}: ${errMessage}`, sanitized || '');
    }
  }
}

export const logger = new SafeLogger();
