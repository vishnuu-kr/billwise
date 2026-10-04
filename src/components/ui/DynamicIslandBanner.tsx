'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import { ShieldCheck, AlertTriangle, AlertOctagon, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export interface DynamicIslandBannerProps {
  units: number;
  className?: string;
}

export function DynamicIslandBanner({ units, className }: DynamicIslandBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const safeUnits = Math.max(0, units || 0);

  // Status calculation
  let status: 'safe' | 'approaching' | 'forfeited' | 'critical' = 'safe';
  if (safeUnits > 500) {
    status = 'critical';
  } else if (safeUnits > 240) {
    status = 'forfeited';
  } else if (safeUnits >= 210) {
    status = 'approaching';
  }

  const statusConfig = {
    safe: {
      color: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30',
      icon: ShieldCheck,
      shortText: `${safeUnits}u — Safe Telescopic Tier`,
      badge: 'Subsidy Safe',
      expandedText: 'Your consumption is well within the telescopic subsidy slabs. You receive the full Kerala Government domestic tariff subsidy.',
      malayalamTip: 'സബ്സിഡി സുരക്ഷിത പരിധിയിലാണ് (240 യൂണിറ്റിൽ താഴെ).',
    },
    approaching: {
      color: 'bg-amber-500/15 text-amber-800 border-amber-500/40',
      icon: AlertTriangle,
      shortText: safeUnits === 240 ? 'At 240u Subsidy Ceiling!' : `${240 - safeUnits}u until 240u Subsidy Cliff!`,
      badge: 'Cliff Alert',
      expandedText: safeUnits === 240
        ? 'You have reached exactly 240 kWh. Any additional unit will forfeit ₹240+ in Kerala State subsidies for this entire bimonthly cycle!'
        : `You are only ${240 - safeUnits} units away from crossing 240 kWh. If you exceed 240 units, you permanently forfeit ₹240+ in Kerala State subsidies for this entire bimonthly cycle!`,
      malayalamTip: '240 യൂണിറ്റ് കഴിഞ്ഞാൽ സർക്കാരിന്റെ ₹240+ സബ്സിഡി നഷ്ടപ്പെടും!',
    },
    forfeited: {
      color: 'bg-orange-500/15 text-orange-800 border-orange-500/40',
      icon: AlertOctagon,
      shortText: 'Subsidy Forfeited (>240u)',
      badge: 'Subsidy Lost',
      expandedText: 'Bimonthly units exceed 240. The ₹240+ Kerala Government domestic subsidy is no longer applicable. Try reducing 1 AC run hour to drop back under 240u.',
      malayalamTip: 'സബ്സിഡി നഷ്ടമായി. ഉപയോഗം 240 യൂണിറ്റിന് താഴെ എത്തിക്കാൻ ശ്രമിക്കുക.',
    },
    critical: {
      color: 'bg-rose-500/15 text-rose-800 border-rose-500/40',
      icon: AlertOctagon,
      shortText: 'Non-Telescopic Punitive Rate (>500u)',
      badge: 'Heavy Penalty',
      expandedText: 'CRITICAL: Crossing 500 kWh triggers the KSEB non-telescopic punitive tariff. All telescopic lower-slab protections are abolished and all units are billed at a single flat rate (~₹8.50 - ₹9.90/u)!',
      malayalamTip: '500 യൂണിറ്റ് കഴിഞ്ഞാൽ നോൺ-ടെലിസ്കോപ്പിക് ഫ്ലാറ്റ് റേറ്റ് ബാധകമാകും!',
    },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <div className={cn('flex justify-center w-full my-2', className)}>
      <motion.div
        layout
        onClick={() => setExpanded(!expanded)}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className={cn(
          'cursor-pointer select-none rounded-2xl border px-3.5 py-1.5 backdrop-blur-xl transition-all shadow-md hover:shadow-lg',
          statusConfig.color,
          expanded ? 'w-full max-w-md p-4' : 'max-w-fit'
        )}
      >
        <motion.div layout="position" className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0" />
            <span className="text-xs font-semibold tracking-tight">
              {statusConfig.shortText}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-black/10">
              {statusConfig.badge}
            </span>
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5 opacity-60" />}
          </div>
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-black/10 space-y-2 text-xs"
            >
              <p className="leading-relaxed opacity-90">{statusConfig.expandedText}</p>
              <div className="flex items-start gap-1.5 rounded-xl bg-black/5 p-2 text-[11px] font-medium">
                <Sparkles className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
                <span>{statusConfig.malayalamTip}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
