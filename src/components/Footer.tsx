'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ShieldCheck, Info, FileText, Lock } from 'lucide-react';

export default function Footer() {
  const { lang, t } = useLanguage();

  return (
    <footer className="w-full border-t border-slate-200 bg-white pb-20 md:pb-8 pt-10 text-slate-600">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Unofficial Reassurance Banner */}
        <div className="mb-8 rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0" />
            <span>{t.independentNotice}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{t.noAccount}</span>
            <span>•</span>
            <span>{t.secureLocal}</span>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm mb-8">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2.5 text-xs uppercase tracking-wider">
              {lang === 'ml' ? 'സവിശേഷതകൾ' : 'Features'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/predict" className="hover:text-sky-600">{t.predictMyBill}</Link></li>
              <li><Link href="/scan" className="hover:text-sky-600">{t.scanMyBill}</Link></li>
              <li><Link href="/manual" className="hover:text-sky-600">{t.calculateManually}</Link></li>
              <li><Link href="/what-if" className="hover:text-sky-600">{lang === 'ml' ? 'ഉപയോഗ സിമുലേറ്റർ' : 'What-If Simulator'}</Link></li>
              <li><Link href="/budget" className="hover:text-sky-600">{lang === 'ml' ? 'ബജറ്റ് കൺട്രോൾ' : 'Budget Control'}</Link></li>
              <li><Link href="/appliances" className="hover:text-sky-600">{lang === 'ml' ? 'ഉപകരണ എസ്റ്റിമേറ്റർ' : 'Appliance Estimator'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2.5 text-xs uppercase tracking-wider">
              {lang === 'ml' ? 'വിവരങ്ങൾ & ഗൈഡുകൾ' : 'Guides & Tariff'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/tariff" className="hover:text-sky-600">{lang === 'ml' ? 'KSEB താരിഫ് നിരക്കുകൾ' : 'KSEB Tariff Rates'}</Link></li>
              <li><Link href="/kseb-bill-calculator" className="hover:text-sky-600">KSEB Bill Calculator</Link></li>
              <li><Link href="/kseb-bill-predictor" className="hover:text-sky-600">KSEB Bill Predictor</Link></li>
              <li><Link href="/kseb-meter-reading" className="hover:text-sky-600">How to Read Meter</Link></li>
              <li><Link href="/kseb-bill-explained" className="hover:text-sky-600">Where Your Money Goes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2.5 text-xs uppercase tracking-wider">
              {lang === 'ml' ? 'സുരക്ഷ & സ്വകാര്യത' : 'Privacy & Trust'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-sky-600">{lang === 'ml' ? 'സ്വകാര്യതാ നയം' : 'Zero-Data Privacy'}</Link></li>
              <li><Link href="/about" className="hover:text-sky-600">{lang === 'ml' ? 'ഞങ്ങളെക്കുറിച്ച്' : 'About Billwise'}</Link></li>
              <li><Link href="/settings" className="hover:text-sky-600">{lang === 'ml' ? 'ഡാറ്റ മായ്ക്കുക' : 'Clear Device Data'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2.5 text-xs uppercase tracking-wider">
              {lang === 'ml' ? 'സിസ്റ്റം' : 'System'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/admin" className="hover:text-sky-600">{lang === 'ml' ? 'താരിഫ് അഡ്മിൻ' : 'Tariff Schedule Admin'}</Link></li>
              <li className="text-slate-400">Tariff: Nov 2024 Order</li>
              <li className="text-slate-400">PWA Offline Enabled</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} BILLWISE. Independent consumer software built for Kerala.</p>
          <p>Deterministic calculations. Privacy by design.</p>
        </div>
      </div>
    </footer>
  );
}
