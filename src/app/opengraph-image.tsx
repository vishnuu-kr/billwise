import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'BILLWISE — Kerala Electricity Intelligence & KSEB Bill Predictor';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#0F1015',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(0, 111, 238, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 90%, rgba(23, 201, 100, 0.15) 0%, transparent 50%)',
          color: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Custom SVG Lightning Shard */}
            <svg width="48" height="48" viewBox="0 0 256 256" fill="none">
              <polygon points="144,16 64,132 118,132 156,94 132,94" fill="#006FEE" />
              <polygon points="112,240 192,124 138,124 100,162 124,162" fill="#FFFFFF" />
            </svg>
            <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: '#FFFFFF' }}>
              BILLWISE
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 12px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Kerala
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '16px',
              color: '#A1A1AA',
            }}
          >
            <span>KSEB LT-1A Domestic</span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px' }}>
          <h1
            style={{
              fontSize: '62px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Know your KSEB bill before it arrives.
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#A1A1AA',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Telescopic slab alerts, bi-monthly meter pace tracking, and rupee accuracy for Kerala households. Zero login required.
          </p>
        </div>

        {/* Bottom Metrics Pill Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#17C964', fontSize: '18px', fontWeight: 600 }}>
              <span>• Official KSERC Tariff</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontSize: '18px', fontWeight: 600 }}>
              <span>• 240u Subsidy Warnings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F5A524', fontSize: '18px', fontWeight: 600 }}>
              <span>• 100% Private & Local</span>
            </div>
          </div>

          <span style={{ fontSize: '18px', color: '#71717A', fontWeight: 500 }}>
            billwise-eight.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
