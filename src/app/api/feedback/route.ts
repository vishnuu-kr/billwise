import { NextRequest, NextResponse } from 'next/server';
import { telemetryStore } from '@/lib/server/telemetryStore';
import { SITE_CONFIG } from '@/lib/config/site';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    // Rate limit feedback: max 15 per hour per client
    const isAllowed = telemetryStore.checkRateLimit(`fb-${ip}`, 15, 3600000);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Feedback rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    if (!body || !body.sentiment) {
      return NextResponse.json({ error: 'Missing feedback sentiment' }, { status: 400 });
    }

    const saved = telemetryStore.recordFeedback({
      context: body.context || 'general',
      sentiment: body.sentiment,
      category: body.category,
      comment: body.comment,
      accuracyRating: body.accuracyRating,
      units: typeof body.units === 'number' ? body.units : undefined,
      predictedBill: typeof body.predictedBill === 'number' ? body.predictedBill : undefined,
      actualBill: typeof body.actualBill === 'number' ? body.actualBill : undefined,
    });

    return NextResponse.json({ saved: true, id: saved.id }, { status: 201 });
  } catch {
    return NextResponse.json({ saved: false }, { status: 500 });
  }
}

export async function GET() {
  const stats = telemetryStore.getFeedbackStats();
  const recent = telemetryStore.getRecentFeedback().slice(0, 50);
  return NextResponse.json({ stats, recent }, { status: 200 });
}

export async function DELETE() {
  telemetryStore.clear();
  return NextResponse.json({ cleared: true }, { status: 200 });
}
