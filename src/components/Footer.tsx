'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();

  const groups = [
    {
      heading: lang === 'ml' ? 'ടൂളുകൾ' : 'Tools',
      links: [
        { href: '/predict', label: lang === 'ml' ? 'ബിൽ കണക്കാക്കൂ' : 'Predict bill' },
        { href: '/scan', label: lang === 'ml' ? 'ബിൽ സ്കാൻ' : 'Scan bill' },
        { href: '/manual', label: lang === 'ml' ? 'മാനുവൽ' : 'Manual calculator' },
        { href: '/what-if', label: lang === 'ml' ? 'What-If' : 'What-If simulator' },
        { href: '/budget', label: lang === 'ml' ? 'ബജറ്റ്' : 'Budget target' },
        { href: '/appliances', label: lang === 'ml' ? 'ഉപകരണങ്ങൾ' : 'Appliances' },
      ],
    },
    {
      heading: lang === 'ml' ? 'മനസ്സിലാക്കൂ' : 'Learn',
      links: [
        { href: '/providers', label: lang === 'ml' ? 'വൈദ്യുതി ബോർഡുകൾ' : 'National Providers' },
        { href: '/electricity-tariffs', label: lang === 'ml' ? 'ദേശീയ താരിഫുകൾ' : 'National Tariffs' },
        { href: '/how-it-works', label: lang === 'ml' ? 'ബില്ലിംഗ് രീതി' : 'How billing works' },
        { href: '/tariff', label: lang === 'ml' ? 'LT-1A താരിഫ്' : 'Tariff rates (LT-1A)' },
        { href: '/kseb-meter-reading', label: lang === 'ml' ? 'മീറ്റർ വായിക്കൂ' : 'Read your meter' },
        { href: '/kseb-bill-explained', label: lang === 'ml' ? 'ബിൽ ഘടകങ്ങൾ' : 'Bill explained' },
      ],
    },
    {
      heading: lang === 'ml' ? 'ആപ്പ്' : 'App',
      links: [
        { href: '/about', label: lang === 'ml' ? 'ആബൗട്ട്' : 'About BILLWISE' },
        { href: '/privacy', label: lang === 'ml' ? 'സ്വകാര്യത' : 'Privacy' },
        { href: '/settings', label: lang === 'ml' ? 'ക്രമീകരണം' : 'Settings & data' },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
      }}
      className="md:!pb-12"
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '48px clamp(16px, 5vw, 48px) 0',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
        }}
        className="md:!grid-cols-[200px_1fr_1fr_1fr]"
      >
        {/* Brand */}
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '12px' }}>
            <svg width="16" height="18" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 1L2 11.5H8.5L7 19L16 8.5H9.5L11 1Z" fill="var(--accent)"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
              BILLWISE
            </span>
          </Link>
          <p style={{ fontSize: '12px', color: 'var(--secondary)', lineHeight: 1.6, maxWidth: '180px' }}>
            {lang === 'ml'
              ? 'ഇന്ത്യയിലെ വൈദ്യുതി ഉപഭോക്താക്കൾക്കായുള്ള സ്വതന്ത്ര ബില്ലിംഗ് ഉപകരണം.'
              : 'Independent electricity bill intelligence for consumers across India.'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--tertiary)', marginTop: '10px' }}>
            {lang === 'ml' ? '100% ഡിവൈസ് · ലോഗിൻ ഇല്ല' : '100% on-device · No login'}
          </p>
        </div>

        {/* Link groups */}
        {groups.map(group => (
          <div key={group.heading}>
            <span className="label-caps" style={{ display: 'block', marginBottom: '14px' }}>
              {group.heading}
            </span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{ fontSize: '13px', color: 'var(--secondary)', textDecoration: 'none' }}
                    className="hover:!text-[var(--foreground)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: '1100px',
          margin: '32px auto 0',
          padding: '16px clamp(16px, 5vw, 48px)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--tertiary)',
        }}
      >
        <span>© {new Date().getFullYear()} BILLWISE. Deterministic client-side calculations.</span>
        <span>Not affiliated with KSEBL or KSERC.</span>
      </div>
    </footer>
  );
}
