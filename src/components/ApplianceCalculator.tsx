'use client';

import React, { useState, useMemo } from 'react';
import { ApplianceItem } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Plus, X } from 'lucide-react';
import { KsebOdometer } from '@/components/ui/KsebOdometer';
import { KsebSlabStorageMeter } from '@/components/ui/KsebSlabStorageMeter';
import dynamic from 'next/dynamic';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { ScrubInput } from '@/components/ui/ScrubInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { DonutSlice } from '@/components/ui/DonutChart';

const DonutChart = dynamic(
  () => import('@/components/ui/DonutChart').then((m) => m.DonutChart),
  {
    ssr: false,
    loading: () => <div className="h-44 w-full rounded-2xl bg-black/[0.02] animate-pulse" />,
  }
);

const INITIAL_APPLIANCES: ApplianceItem[] = [
  {
    id: 'app-ac',
    name: 'Air Conditioner (1.5 Ton)',
    nameMl: 'എയർ കണ്ടീഷണർ (AC)',
    category: 'cooling',
    typicalWatts: 1200,
    userWatts: 1200,
    hoursPerDay: 7,
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'wind',
  },
  {
    id: 'app-fridge',
    name: 'Refrigerator',
    nameMl: 'ഫ്രിഡ്ജ് (Refrigerator)',
    category: 'cooling',
    typicalWatts: 150,
    userWatts: 150,
    hoursPerDay: 24,
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'fridge',
  },
  {
    id: 'app-fan',
    name: 'Ceiling Fans (3x)',
    nameMl: 'ഫാൻ (Ceiling Fan)',
    category: 'cooling',
    typicalWatts: 70,
    userWatts: 70,
    hoursPerDay: 12,
    daysPerMonth: 30,
    quantity: 3,
    iconName: 'fan',
  },
  {
    id: 'app-heater',
    name: 'Water Heater / Geyser',
    nameMl: 'വാട്ടർ ഹീറ്റർ (Geyser)',
    category: 'heating',
    typicalWatts: 2000,
    userWatts: 2000,
    hoursPerDay: 1,
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'flame',
  },
  {
    id: 'app-tv',
    name: 'Smart Television',
    nameMl: 'ടെലിവിഷൻ (TV)',
    category: 'entertainment',
    typicalWatts: 100,
    userWatts: 100,
    hoursPerDay: 5,
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'tv',
  },
  {
    id: 'app-pump',
    name: 'Water Pump (1 HP)',
    nameMl: 'മോട്ടോർ പമ്പ് (Pump)',
    category: 'other',
    typicalWatts: 750,
    userWatts: 750,
    hoursPerDay: 0.75,
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'droplets',
  },
];

export default function ApplianceCalculator() {
  const { lang } = useLanguage();
  const [appliances, setAppliances] = useState<ApplianceItem[]>(INITIAL_APPLIANCES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWatts, setCustomWatts] = useState(1000);
  const [customHours, setCustomHours] = useState(1);

  const stats = useMemo(() => {
    const computed = appliances.map(app => {
      const effectiveHours = app.category === 'cooling' && app.id.includes('fridge')
        ? app.hoursPerDay * 0.35
        : app.hoursPerDay;

      const monthlyKwh = ((app.userWatts * effectiveHours * app.daysPerMonth * app.quantity) / 1000);
      const biMonthlyKwh = Math.round(monthlyKwh * 2);
      return {
        ...app,
        monthlyKwh: Math.round(monthlyKwh),
        biMonthlyKwh,
      };
    });

    const totalBiMonthlyKwh = computed.reduce((sum, item) => sum + item.biMonthlyKwh, 0);
    const totalMonthlyKwh = Math.round(totalBiMonthlyKwh / 2);
    const costPerKwh = 5.50;

    const withShares = computed.map(c => {
      const share = totalBiMonthlyKwh > 0 ? Math.round((c.biMonthlyKwh / totalBiMonthlyKwh) * 100) : 0;
      const estimatedCost = Math.round(c.biMonthlyKwh * costPerKwh);
      return {
        ...c,
        sharePct: share,
        estimatedBiMonthlyCost: estimatedCost,
      };
    }).sort((a, b) => b.biMonthlyKwh - a.biMonthlyKwh);

    return {
      totalMonthlyKwh,
      totalBiMonthlyKwh,
      items: withShares,
    };
  }, [appliances]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return stats.items;
    return stats.items.filter(item => item.category === selectedCategory);
  }, [stats.items, selectedCategory]);

  const applianceSlices: DonutSlice[] = useMemo(() => {
    if (stats.items.length === 0 || stats.totalBiMonthlyKwh === 0) return [];
    const colors = ['#006FEE', '#17C964', '#F5A524', '#8B5CF6', '#EC4899', '#71717A'];

    const top4 = stats.items.slice(0, 4);
    const rest = stats.items.slice(4);
    const restKwh = rest.reduce((sum, item) => sum + item.biMonthlyKwh, 0);

    const slices: DonutSlice[] = top4.map((item, idx) => ({
      label: lang === 'ml' ? item.nameMl.split(' (')[0] : item.name.split(' (')[0],
      value: item.biMonthlyKwh,
      color: colors[idx % colors.length],
    }));

    if (restKwh > 0) {
      slices.push({
        label: lang === 'ml' ? 'മറ്റുള്ളവ' : 'Other Devices',
        value: restKwh,
        color: '#71717A',
      });
    }

    return slices;
  }, [stats.items, stats.totalBiMonthlyKwh, lang]);

  const updateHours = (id: string, hours: number) => {
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, hoursPerDay: Math.max(0, hours) } : app))
    );
  };

  const updateWatts = (id: string, watts: number) => {
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, userWatts: Math.max(1, watts) } : app))
    );
  };

  const updateQuantity = (id: string, qty: number) => {
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, quantity: Math.max(0, qty) } : app))
    );
  };


  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: ApplianceItem = {
      id: `custom-${Date.now()}`,
      name: customName,
      nameMl: customName,
      category: 'other',
      typicalWatts: customWatts,
      userWatts: customWatts,
      hoursPerDay: customHours,
      daysPerMonth: 30,
      quantity: 1,
      iconName: 'custom',
    };

    setAppliances(prev => [newItem, ...prev]);
    setCustomName('');
    setIsAddingCustom(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#71717A] block">
          {lang === 'ml' ? 'ഉപകരണ വിശകലനം' : 'Appliance audit'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#17171C]">
          {lang === 'ml' ? 'ഏറ്റവും കൂടുതൽ കറണ്ട് എടുക്കുന്നത് എന്താകാം?' : 'What might be using the most?'}
        </h1>
        <p className="text-[13px] text-[#71717A] leading-relaxed">
          {lang === 'ml'
            ? 'നിങ്ങൾ നൽകിയ വിവരങ്ങൾ അടിസ്ഥാനമാക്കിയുള്ള ഏകദേശ കണക്ക്.'
            : 'Estimate based on your inputs.'}
        </p>
      </div>

      {/* Hero Overview */}
      <div className="glass-card p-5 sm:p-6 space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#71717A] block">
          {lang === 'ml' ? 'കണക്കാക്കിയ 2-മാസ ഉപയോഗം' : 'Estimated bi-monthly consumption'}
        </span>
        <div className="flex items-baseline gap-2 pt-1">
          <KsebOdometer value={stats.totalBiMonthlyKwh} size="2xl" prefix="" />
          <span className="text-[15px] font-medium text-[#71717A]">
            {lang === 'ml' ? 'യൂണിറ്റ് / 60 ദിവസം' : 'units / 60 days'}
          </span>
        </div>
        <p className="text-[13px] text-[#71717A]">
          ~{stats.totalMonthlyKwh} {lang === 'ml' ? 'യൂണിറ്റ് / മാസം' : 'units / month'}
        </p>

        {/* Telescopic Slab Quota Meter */}
        <div className="pt-2">
          <KsebSlabStorageMeter units={stats.totalBiMonthlyKwh} maxScale={500} />
        </div>
      </div>

      {/* Interactive Appliance Share Donut */}
      {applianceSlices.length > 0 && (
        <div className="glass-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--secondary)] block">
                {lang === 'ml' ? 'ഉപകരണ അനുപാതം' : 'Consumption Share'}
              </span>
              <p className="text-[13px] text-[var(--secondary)]">
                {lang === 'ml'
                  ? 'ഓരോ ഉപകരണവും എടുക്കുന്ന യൂണിറ്റ് പങ്ക്'
                  : 'Proportional unit breakdown across appliances'}
              </p>
            </div>
            <span className="text-[11px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full">
              {lang === 'ml' ? 'ഇന്ററാക്ടീവ്' : 'Interactive'}
            </span>
          </div>

          <div className="py-2 flex justify-center">
            <DonutChart
              data={applianceSlices}
              label={lang === 'ml' ? 'ഉപകരണ പങ്ക്' : 'Appliance Unit Breakdown'}
              totalLabel={lang === 'ml' ? 'ആകെ യൂണിറ്റ്' : 'Total Units'}
              valueSuffix=" u"
              className="w-full justify-around"
            />
          </div>
        </div>
      )}

      {/* Category selector */}
      <div className="w-full overflow-x-auto no-scrollbar py-0.5">
        <SegmentedControl
          options={[
            { value: 'all', label: lang === 'ml' ? 'എല്ലാം' : 'All' },
            { value: 'cooling', label: lang === 'ml' ? 'കൂളിംഗ്' : 'Cooling' },
            { value: 'heating', label: lang === 'ml' ? 'ഹീറ്റിംഗ്' : 'Heat & Water' },
            { value: 'entertainment', label: lang === 'ml' ? 'ലിവിംഗ്' : 'TV & Media' },
            { value: 'other', label: lang === 'ml' ? 'മറ്റ്' : 'Other' },
          ]}
          value={selectedCategory}
          onChange={(v) => setSelectedCategory(v)}
          size="sm"
          className="min-w-max w-full"
        />
      </div>

      {/* Appliance Grouped List */}
      <div className="glass-card divide-y divide-black/[0.04] overflow-hidden">
        {filteredItems.map(item => (
          <div key={item.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[14px] sm:text-[15px] font-semibold text-[#17171C] block truncate">
                  {lang === 'ml' ? item.nameMl : item.name}
                </span>
                <span className="text-[12px] text-[#71717A] block truncate">
                  {item.userWatts}W · {item.hoursPerDay} hrs/day
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="num-tabular text-[14px] sm:text-[15px] font-bold text-[#17171C] block">
                  {item.biMonthlyKwh} u
                </span>
                <span className="text-[11px] font-medium text-[#71717A] num-tabular block">
                  {item.sharePct}% share
                </span>
              </div>
            </div>

            {/* Tactile Controls: Stepper, Scrub Input, Hours Slider */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/[0.04]">
              <NumberStepper
                value={item.quantity}
                onChange={(q) => updateQuantity(item.id, q)}
                label="Qty:"
              />

              <ScrubInput
                value={item.userWatts}
                unit="W"
                onChange={(w) => updateWatts(item.id, w)}
                label="Power:"
              />
            </div>

            {/* Slider for Hours */}
            <div className="flex items-center gap-3 pt-0.5">
              <input
                type="range"
                min={0}
                max={24}
                step={0.5}
                value={item.hoursPerDay}
                onChange={e => updateHours(item.id, Number(e.target.value))}
                className="flex-1"
                aria-label={`Hours for ${item.name}`}
              />
              <span className="text-[12px] font-mono text-[#71717A] w-12 text-right num-tabular font-medium shrink-0">
                {item.hoursPerDay}h/d
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Appliance */}
      {!isAddingCustom ? (
        <button
          type="button"
          onClick={() => setIsAddingCustom(true)}
          className="ios-btn-secondary w-full"
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>{lang === 'ml' ? 'മറ്റൊരു ഉപകരണം ചേർക്കുക' : 'Add custom appliance'}</span>
        </button>
      ) : (
        <form onSubmit={handleAddCustom} className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#17171C]">
              {lang === 'ml' ? 'പുതിയ ഉപകരണം' : 'New appliance'}
            </span>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#17171C] hover:bg-black/[0.04] transition-colors"
              aria-label="Close add appliance form"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Appliance name (e.g. Induction Cooker)"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            aria-label="Appliance name"
            className="w-full h-11 rounded-xl bg-[#F7F7F5] px-3.5 text-[14px] text-[#17171C] border border-black/[0.08] outline-none focus:border-[#006FEE] focus:bg-white transition-all"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-medium text-[#71717A] block mb-1">Watts</span>
              <input
                type="number"
                value={customWatts}
                onChange={e => setCustomWatts(Number(e.target.value))}
                aria-label="Appliance power in Watts"
                className="w-full h-10 rounded-xl bg-[#F7F7F5] px-3 text-[13px] text-[#17171C] border border-black/[0.08] outline-none focus:border-[#006FEE] focus:bg-white transition-all"
              />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#71717A] block mb-1">Hours / day</span>
              <input
                type="number"
                step="0.5"
                value={customHours}
                onChange={e => setCustomHours(Number(e.target.value))}
                aria-label="Hours used per day"
                className="w-full h-10 rounded-xl bg-[#F7F7F5] px-3 text-[13px] text-[#17171C] border border-black/[0.08] outline-none focus:border-[#006FEE] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="ios-btn-primary w-full"
          >
            <span>Add appliance</span>
          </button>
        </form>
      )}
    </div>
  );
}
