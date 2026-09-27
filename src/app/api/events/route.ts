import { NextRequest, NextResponse } from 'next/server';
import { telemetryStore, AnonymousServerEvent } from '@/lib/server/telemetryStore';
import { SITE_CONFIG } from '@/lib/config/site';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. IP rate limiting (anonymized IP hash)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const isAllowed = telemetryStore.checkRateLimit(`ip-${ip}`, 120, 60000); // 120 events/min max
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // 2. Parse body
    const body = await req.json();
    if (!body || !body.event) {
      return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
    }

    const eventPayload: AnonymousServerEvent = {
      event: String(body.event).slice(0, 50),
      timestamp: body.timestamp || new Date().toISOString(),
      appVersion: body.appVersion || SITE_CONFIG.appVersion,
      feature: body.feature ? String(body.feature).slice(0, 50) : undefined,
      locale: body.locale ? String(body.locale).slice(0, 10) : 'en',
    };

    telemetryStore.recordEvent(eventPayload);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    // Fail quietly without throwing
    return NextResponse.json({ received: false }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  // Return aggregated anonymous summary
  const summary = telemetryStore.getSummary();
  return NextResponse.json(summary, { status: 200 });
}
