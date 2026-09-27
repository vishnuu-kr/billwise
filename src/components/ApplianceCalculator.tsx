'use client';

import React, { useState, useMemo } from 'react';
import { ApplianceItem } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Wind,
  Refrigerator,
  Tv,
  Fan,
  Flame,
  Shirt,
  Droplets,
  Monitor,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

const INITIAL_APPLIANCES: ApplianceItem[] = [
  {
    id: 'app-ac',
    name: 'Air Conditioner (1.5 Ton Inverter)',
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
    name: 'Refrigerator (Double Door)',
    nameMl: 'ഫ്രിഡ്ജ് (Refrigerator)',
    category: 'cooling',
    typicalWatts: 150,
    userWatts: 150,
    hoursPerDay: 24, // duty cycle approx 35% handled in calculation
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'fridge',
  },
  {
    id: 'app-fan',
    name: 'Ceiling Fans',
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
    id: 'app-pump',
    name: 'Water Pump (1 HP)',
    nameMl: 'മോട്ടോർ പമ്പ് (1 HP)',
    category: 'other',
    typicalWatts: 750,
    userWatts: 750,
    hoursPerDay: 0.75,
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'droplets',
  },
  {
    id: 'app-tv',
    name: 'LED TV & Setup Box',
    nameMl: 'ടിവി (Television)',
    category: 'entertainment',
    typicalWatts: 100,
    userWatts: 100,
    hoursPerDay: 5,
    daysPerMonth: 30,
    quantity: 1,
    iconName: 'tv',
  },
];

export default function ApplianceCalculator() {
  const { lang, t } = useLanguage();
  const [appliances, setAppliances] = useState<ApplianceItem[]>(INITIAL_APPLIANCES);

  // Calculate monthly kWh per appliance
  const stats = useMemo(() => {
    let totalKwh = 0;
    const computed = appliances.map(app => {
      // For fridge, duty cycle is roughly 35% of run time
      const effectiveHours = app.category === 'cooling' && app.id.includes('fridge')
        ? app.hoursPerDay * 0.35
        : app.hoursPerDay;

      const monthlyKwh = ((app.userWatts * effectiveHours * app.daysPerMonth * app.quantity) / 1000);
      totalKwh += monthlyKwh;
      return {
        ...app,
        monthlyKwh: Math.round(monthlyKwh),
        biMonthlyKwh: Math.round(monthlyKwh * 2),
      };
    });

    // Approximate average LT-1A unit cost ~₹5.50
    const costPerKwh = 5.50;

    const withShares = computed.map(c => {
      const share = totalKwh > 0 ? Math.round((c.monthlyKwh / totalKwh) * 100) : 0;
      const estimatedCost = Math.round(c.biMonthlyKwh * costPerKwh);
      return {
        ...c,
        sharePct: share,
        estimatedBiMonthlyCost: estimatedCost,
      };
    }).sort((a, b) => b.monthlyKwh - a.monthlyKwh);

    return {
      totalMonthlyKwh: Math.round(totalKwh),
      totalBiMonthlyKwh: Math.round(totalKwh * 2),
      items: withShares,
    };
  }, [appliances]);

  const updateHours = (id: string, hours: number) => {
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, hoursPerDay: Math.max(0, hours) } : app))
    );
  };

  const updateQuantity = (id: string, qty: number) => {
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, quantity: Math.max(1, qty) } : app))
    );
  };

  const removeAppliance = (id: string) => {
    setAppliances(prev => prev.filter(app => app.id !== id));
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {lang === 'ml' ? 'ഉപകരണ എസ്റ്റിമേറ്റർ' : 'Appliance Estimator'}
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
          {lang === 'ml' ? 'കൂടുതൽ വൈദ്യുതി ഉപയോഗിക്കുന്നത് എന്തെല്ലാം?' : "What's using the most electricity?"}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {lang === 'ml'
            ? 'വീട്ടിലെ പ്രധാന ഉപകരണങ്ങളുടെ ഉപയോഗ സമയം നൽകി ഓരോന്നിന്റെയും പങ്കാളിത്തം പരിശോധിക്കാം.'
            : 'Estimate the monthly consumption and cost share of household appliances.'}
        </p>
      </div>

      {/* Hero Overview */}
      <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 font-medium">Estimated Cycle Usage</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-3xl font-extrabold text-slate-900 num-tabular">
              {stats.totalBiMonthlyKwh}
            </span>
            <span className="text-xs font-semibold text-slate-500">{t.units} / bi-monthly</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 font-medium">Monthly Equivalent</div>
          <div className="mt-1 font-mono text-xl font-bold text-sky-700 num-tabular">
            ~{stats.totalMonthlyKwh} kWh
          </div>
        </div>
      </div>

      {/* Appliance Breakdown List */}
      <div className="space-y-4">
        {stats.items.map(app => (
          <div
            key={app.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-slate-200 transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  {lang === 'ml' ? app.nameMl : app.name}
                </h4>
                <div className="text-[11px] text-slate-500">
                  {app.userWatts} W • Qty: {app.quantity}
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-900 num-tabular">
                  {app.sharePct}%
                </span>
                <div className="text-[10px] text-slate-400">
                  ~₹{app.estimatedBiMonthlyCost.toLocaleString('en-IN')} / cycle
                </div>
              </div>
            </div>

            {/* Visual Proportional Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-600 transition-all duration-300"
                style={{ width: `${Math.min(100, app.sharePct)}%` }}
              />
            </div>

            {/* Quick Adjustment Sliders / Inputs */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-2">
                <span>Hours/day:</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="24"
                  step="0.5"
                  value={app.hoursPerDay}
                  onChange={e => updateHours(app.id, Number(e.target.value))}
                  className="w-16 rounded border border-slate-300 p-1 text-center font-mono font-semibold"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span>Qty:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={app.quantity}
                    onChange={e => updateQuantity(app.id, Number(e.target.value))}
                    className="w-12 rounded border border-slate-300 p-1 text-center font-mono font-semibold"
                  />
                </div>
                <button
                  onClick={() => removeAppliance(app.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Remove appliance"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Honest Labeling Disclaimer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'ml'
            ? 'ശ്രദ്ധിക്കുക: ഇത് നിങ്ങൾ നൽകിയ വിവരങ്ങളെ അടിസ്ഥാനമാക്കിയുള്ള ഏകദേശ കണക്കാണ്. യഥാർത്ഥ മീറ്റർ റീഡിംഗുമായി വ്യത്യാസമുണ്ടാകാം.'
            : 'Estimated from the information you entered. These are statistical models, not direct smart-meter sub-measurements.'}
        </p>
      </div>
    </div>
  );
}
