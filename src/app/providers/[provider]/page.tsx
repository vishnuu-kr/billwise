import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProviderById, getAllProviders } from '@/lib/electricity/providers';
import { getTariffByProviderId } from '@/lib/electricity/tariffs/registry';
import { REGULATOR_REGISTRY } from '@/lib/electricity/regulators';
import ProviderCalculatorClient from './ProviderCalculatorClient';
import { ShieldCheck, MapPin, Building, ExternalLink, ArrowLeft, Camera, FileText } from 'lucide-react';

interface PageProps {
  params: Promise<{ provider: string }>;
}

export async function generateStaticParams() {
  const providers = getAllProviders();
  return providers.map(p => ({ provider: p.id }));
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const { provider: providerId } = await params;
  const provider = getProviderById(providerId);

  if (!provider) {
    notFound();
  }

  const tariff = getTariffByProviderId(provider.id);
  const regulator = REGULATOR_REGISTRY[provider.regulatorId];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Navigation breadcrumb */}
      <div>
        <Link
          href="/providers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Indian Providers</span>
        </Link>
      </div>

      {/* Provider Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-base">
              ⚡
            </span>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {provider.state} · Electricity Distribution Licensee
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {provider.displayName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {provider.coverageStatus === 'FULL' && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                FULL SUPPORT
              </span>
            )}
            {provider.coverageStatus === 'PARTIAL' && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                VERIFIED RATES
              </span>
            )}
            {provider.coverageStatus === 'CALCULATOR_ONLY' && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                CALCULATOR
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {provider.legalName} is the licensed retail supplier for {provider.serviceAreas.join(', ')}.
        </p>

        {/* Regulatory & Portal Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          {regulator && (
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Regulatory Commission</span>
              <a
                href={regulator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 hover:text-amber-600 inline-flex items-center gap-1"
              >
                <span>{regulator.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          )}

          {provider.website && (
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Official Website</span>
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 hover:text-amber-600 inline-flex items-center gap-1"
              >
                <span>{new URL(provider.website).hostname}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          )}

          {tariff && tariff.orderReference && (
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Tariff Order Reference</span>
              <a
                href={tariff.sourceDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 hover:text-amber-600 inline-flex items-center gap-1"
              >
                <span>{tariff.orderReference}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Direct Interactive Calculator Client Component */}
      <ProviderCalculatorClient provider={provider} tariff={tariff} />

      {/* Quick Action: Scan Bill */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-white">Have a printed {provider.shortName} bill?</h3>
          <p className="text-xs text-slate-400 mt-1">
            Scan your bill photo to verify readings and detect slab consumption automatically.
          </p>
        </div>
        <Link
          href="/scan"
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 inline-flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>Scan {provider.shortName} Bill</span>
        </Link>
      </div>
    </div>
  );
}
