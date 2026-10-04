'use client';

import React from 'react';
import { CURRENT_KSEB_TARIFF_VERSION } from '@/lib/tariffs/ksebTariff2024';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  FileText,
  Building,
  Scale,
  Gift,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { KsebSlabStorageMeter } from '@/components/ui/KsebSlabStorageMeter';
import { TimeOfDayClock } from '@/components/ui/TimeOfDayClock';
import { RubberStamp } from '@/components/ui/RubberStamp';
import { ScrollSpine, SpineSection } from '@/components/ui/ScrollSpine';

export default function TariffPage() {
  const { lang } = useLanguage();
  const tariff = CURRENT_KSEB_TARIFF_VERSION;

  const spineSections: SpineSection[] = [
    { id: 'section-meter', title: lang === 'ml' ? 'സ്ലാബ് വിഹിതം' : 'Slab Allocation', subtitle: 'Telescopic meter' },
    { id: 'section-tod', title: lang === 'ml' ? 'സമയ നിരക്ക്' : 'Peak Hours', subtitle: 'ToD Tariff' },
    { id: 'section-core', title: lang === 'ml' ? 'പ്രധാന നിയമം' : 'Telescopic vs Cliff', subtitle: '500u threshold' },
    { id: 'section-slabs', title: lang === 'ml' ? 'സ്ലാബ് നിരക്കുകൾ' : 'Energy Slabs', subtitle: 'LT-1A rates' },
    { id: 'section-subsidy', title: lang === 'ml' ? 'സബ്‌സിഡി' : 'Govt Subsidy', subtitle: 'Up to 240 units' },
    { id: 'section-statutory', title: lang === 'ml' ? 'മറ്റ് ചാർജ്ജുകൾ' : 'Statutory Fees', subtitle: 'Duty & Fixed charges' },
  ];

  return (
    <div className="relative">
      {/* ScrollSpine vertical reading progress spine (visible on desktop) */}
      <div className="hidden xl:block fixed left-6 top-32 w-56 z-20">
        <ScrollSpine sections={spineSections} />
      </div>

      <div className="max-w-[430px] mx-auto px-4 pt-3 pb-4 space-y-6">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--secondary)] hover:text-[var(--foreground)] active:opacity-60 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{lang === 'ml' ? 'ഹോം' : 'Home'}</span>
          </Link>

          {/* Verification Stamp */}
          <RubberStamp text="KSERC 24-25" subtext="OFFICIAL" color="emerald" />
        </div>

        {/* Title */}
        <div>
          <span className="text-[12px] font-medium text-[var(--tertiary)] block mb-1">
            {lang === 'ml' ? `KSERC LT-1A · ${tariff.effectiveFrom} മുതൽ` : `KSERC LT-1A · Effective ${tariff.effectiveFrom}`}
          </span>
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--foreground)] leading-tight">
            {lang === 'ml' ? 'KSEB വൈദ്യുതി നിരക്കുകൾ' : 'How electricity pricing works'}
          </h1>
          <p className="text-[14px] text-[var(--secondary)] mt-1.5 leading-relaxed">
            {lang === 'ml'
              ? 'ഗാർഹിക LT-1A താരിഫ് സ്ലാബുകൾ ലളിതമായ ഭാഷയിൽ.'
              : 'Kerala State Electricity Regulatory Commission domestic LT-1A tariff rules explained clearly.'}
          </p>
        </div>

        {/* Visual Slab Meter Breakdown */}
        <div id="section-meter">
          <KsebSlabStorageMeter units={240} maxScale={500} />
        </div>

        {/* Time of Day (ToD) Tariff Clock */}
        <div id="section-tod">
          <TimeOfDayClock />
        </div>

        {/* Core Concept: Telescopic vs Cliff */}
        <div id="section-core" className="bg-[var(--surface)] border border-[var(--separator)] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--secondary)]">
          <Layers className="h-4 w-4 text-[var(--accent)]" />
          <span>{lang === 'ml' ? 'പ്രധാന നിയമം' : 'Core concept'}</span>
        </div>
        <h2 className="text-[17px] font-semibold text-[var(--foreground)]">
          {lang === 'ml' ? 'ടെലിസ്കോപ്പിക് സ്ലാബും 500-യൂണിറ്റ് പരിധിയും' : 'Telescopic slabs vs the 500-unit limit'}
        </h2>
        <p className="text-[13px] text-[var(--secondary)] leading-relaxed">
          {lang === 'ml'
            ? 'സാധാരണ ഗാർഹിക ഉപഭോക്താക്കൾക്ക് രണ്ട് മാസത്തിലൊരിക്കലാണ് ബിൽ വരുന്നത്. 500 യൂണിറ്റോ അതിൽ കുറവോ ആണെങ്കിൽ കുറഞ്ഞ സ്ലാബ് നിരക്കുകൾ നിലനിൽക്കും (ആദ്യ 80 യൂണിറ്റിന് ₹3.25, അടുത്ത 80 യൂണിറ്റിന് ₹4.05 എന്നിങ്ങനെ).'
            : 'For most households billed bi-monthly, consumption up to 500 units receives telescopic pricing: the first 80 units are billed at ₹3.25, the next 80 at ₹4.05, and so on.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="rounded-xl border border-[var(--separator)] bg-[var(--surface-muted)] p-3 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--accent)]">
              {lang === 'ml' ? '500 യൂണിറ്റ് വരെ (ടെലിസ്കോപ്പിക്)' : 'Up to 500 units (Telescopic)'}
            </span>
            <p className="text-[12px] text-[var(--foreground)]">
              {lang === 'ml' ? 'താഴത്തെ സ്ലാബുകളിലെ കുറഞ്ഞ നിരക്കുകൾ നിലനിൽക്കും.' : 'Slab-by-slab pricing. Initial units stay at lower rates.'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--separator)] bg-[var(--surface-muted)] p-3 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--amber)]">
              {lang === 'ml' ? '500 യൂണിറ്റിൽ കൂടുതൽ' : 'Above 500 units'}
            </span>
            <p className="text-[12px] text-[var(--foreground)]">
              {lang === 'ml' ? 'ടെലിസ്കോപ്പിക് ആനുകൂല്യം നഷ്ടപ്പെട്ട് എല്ലാ യൂണിറ്റിനും ഒരൊറ്റ ഉയർന്ന നിരക്ക്.' : 'All units charged at a single flat high rate.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 pt-2 text-[12px] text-[var(--secondary)]">
          <AlertCircle className="h-4 w-4 text-[var(--amber)] shrink-0 mt-0.5" />
          <span>
            {lang === 'ml'
              ? '500 യൂണിറ്റ് കവിഞ്ഞാൽ ആദ്യത്തെ കുറഞ്ഞ നിരക്കുകൾ നഷ്ടപ്പെട്ട് ബിൽ തുക പെട്ടെന്ന് ഉയരുന്നു.'
              : 'Crossing 500 units triggers a sharp jump in your bill because earlier lower-tier rates are forfeited.'}
          </span>
        </div>
      </div>

      {/* Slabs Grouped Table */}
      <div id="section-slabs" className="space-y-2">
        <div className="px-1 text-[13px] font-medium text-[var(--secondary)]">
          {lang === 'ml' ? 'രണ്ട് മാസത്തെ സ്ലാബ് നിരക്കുകൾ (500 യൂണിറ്റ് വരെ)' : 'Bi-monthly energy slabs (up to 500 units)'}
        </div>
        <div className="bg-[var(--surface)] border border-[var(--separator)] rounded-2xl divide-y divide-[var(--separator)] overflow-hidden">
          {tariff.telescopicSlabsBiMonthly.map(slab => (
            <div key={slab.minUnits} className="p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[14px] font-medium text-[var(--foreground)]">
                  {slab.minUnits} – {slab.maxUnits} {lang === 'ml' ? 'യൂണിറ്റ്' : 'units'}
                </div>
                <div className="text-[11px] text-[var(--secondary)]">
                  {Math.round(slab.minUnits / 2)} – {Math.round((slab.maxUnits ?? 0) / 2)} {lang === 'ml' ? 'യൂണിറ്റ് / മാസം' : 'units / month'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-semibold text-[var(--foreground)] num-tabular">
                  ₹{Number(slab.ratePerUnit.toFixed(3))}
                </div>
                <div className="text-[11px] text-[var(--tertiary)]">
                  {lang === 'ml' ? 'പ്രതി യൂണിറ്റ്' : 'per unit'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subsidies Section */}
      <div id="section-subsidy" className="space-y-2">
        <div className="px-1 text-[13px] font-medium text-[var(--secondary)]">
          {lang === 'ml' ? 'സർക്കാർ സബ്‌സിഡി (240 യൂണിറ്റ് വരെ)' : 'Government subsidy (up to 240 units)'}
        </div>
        <div className="bg-[var(--surface)] border border-[var(--separator)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--positive)]">
            <Gift className="h-4 w-4" />
            <span>{lang === 'ml' ? 'കേരള സർക്കാർ ഗാർഹിക സബ്‌സിഡി' : 'Kerala domestic consumer subsidy'}</span>
          </div>
          <div className="space-y-2 text-[13px] text-[var(--secondary)]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--positive)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--foreground)] font-medium">₹40 fixed charge waiver:</strong> reduces standard ₹210 fixed charge to ₹170.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--positive)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--foreground)] font-medium">Up to ₹108 energy rebate:</strong> subsidised at ₹0.45/unit up to 240 units.
              </span>
            </div>
          </div>
          <div className="pt-1 text-[12px] font-medium text-[var(--positive)]">
            Total benefit: ₹148 directly deducted on qualifying bills.
          </div>
        </div>
      </div>

      {/* Statutory Charges */}
      <div id="section-statutory" className="space-y-2">
        <div className="px-1 text-[13px] font-medium text-[var(--secondary)]">
          {lang === 'ml' ? 'മറ്റ് സ്ഥിര നിരക്കുകൾ' : 'Other standard charges'}
        </div>
        <div className="bg-[var(--surface)] border border-[var(--separator)] rounded-2xl divide-y divide-[var(--separator)] overflow-hidden">
          <div className="p-3.5 flex items-start gap-3">
            <Scale className="h-4 w-4 text-[var(--secondary)] shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-medium text-[var(--foreground)]">Electricity Duty</div>
              <div className="text-[12px] text-[var(--secondary)]">Statutory 10% levied on energy charges (Kerala Electricity Duty Act).</div>
            </div>
          </div>
          <div className="p-3.5 flex items-start gap-3">
            <Building className="h-4 w-4 text-[var(--secondary)] shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-medium text-[var(--foreground)]">Fixed Charge</div>
              <div className="text-[12px] text-[var(--secondary)]">Bi-monthly base charge ranging from ₹70 to ₹380 by consumption tier.</div>
            </div>
          </div>
          <div className="p-3.5 flex items-start gap-3">
            <FileText className="h-4 w-4 text-[var(--secondary)] shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-medium text-[var(--foreground)]">Fuel Surcharge (FAC)</div>
              <div className="text-[12px] text-[var(--secondary)]">Fuel cost variance (1 to 2 paise per unit) approved by KSERC.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator link */}
      <div className="pt-2">
        <Link
          href="/what-if"
          className="flex items-center justify-between w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--separator)] text-[14px] font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)] active:scale-[0.98] transition-all touch-target"
        >
          <span>{lang === 'ml' ? 'വാട്ട്-ഇഫ് സിമുലേറ്ററിൽ പരീക്ഷിക്കുക' : 'Test these slabs in the What-If Simulator'}</span>
          <ChevronRight className="h-4 w-4 text-[var(--tertiary)]" />
        </Link>
      </div>
    </div>
  </div>
);
}
