import { TariffVersion, TariffDiffItem } from '@/types';

/**
 * Computes a precise structural difference between two KSEB tariff schedule versions.
 * Helps administrators, auditors, and users verify exact rate alterations across gazette revisions.
 */
export function computeTariffDiff(
  baseVersion: TariffVersion,
  comparedVersion: TariffVersion
): TariffDiffItem[] {
  const diffs: TariffDiffItem[] = [];

  // 1. Telescopic Energy Slabs (Bi-Monthly)
  const baseTelescopic = baseVersion.telescopicSlabsBiMonthly;
  const comparedTelescopic = comparedVersion.telescopicSlabsBiMonthly;

  const maxSlabs = Math.max(baseTelescopic.length, comparedTelescopic.length);
  for (let i = 0; i < maxSlabs; i++) {
    const baseSlab = baseTelescopic[i];
    const compSlab = comparedTelescopic[i];

    if (baseSlab && compSlab) {
      const delta = Number((compSlab.ratePerUnit - baseSlab.ratePerUnit).toFixed(2));
      const pct = baseSlab.ratePerUnit > 0 ? Number(((delta / baseSlab.ratePerUnit) * 100).toFixed(1)) : 0;
      const unitRange = `${baseSlab.minUnits}–${baseSlab.maxUnits ?? '∞'} units`;

      diffs.push({
        category: 'telescopic_energy',
        label: `Telescopic Slab: ${unitRange}`,
        unitRange,
        baseValue: baseSlab.ratePerUnit,
        comparedValue: compSlab.ratePerUnit,
        delta,
        percentageDelta: pct,
        formattedDelta: delta > 0 ? `+₹${delta.toFixed(2)}/u (+${pct}%)` : delta < 0 ? `-₹${Math.abs(delta).toFixed(2)}/u (${pct}%)` : 'No change (₹0.00)',
      });
    }
  }

  // 2. Fixed Charges (Bi-monthly Single Phase)
  const baseFixedSingle = baseVersion.singlePhaseFixedChargesBiMonthly;
  const compFixedSingle = comparedVersion.singlePhaseFixedChargesBiMonthly;

  const maxFixed = Math.max(baseFixedSingle.length, compFixedSingle.length);
  for (let i = 0; i < maxFixed; i++) {
    const baseBracket = baseFixedSingle[i];
    const compBracket = compFixedSingle[i];

    if (baseBracket && compBracket) {
      const delta = Number((compBracket.charge - baseBracket.charge).toFixed(2));
      const pct = baseBracket.charge > 0 ? Number(((delta / baseBracket.charge) * 100).toFixed(1)) : 0;
      const unitRange = `${baseBracket.minUnits}–${baseBracket.maxUnits ?? '∞'} units`;

      diffs.push({
        category: 'fixed_charge',
        label: `1-Phase Fixed Charge: ${unitRange}`,
        unitRange,
        baseValue: baseBracket.charge,
        comparedValue: compBracket.charge,
        delta,
        percentageDelta: pct,
        formattedDelta: delta > 0 ? `+₹${delta} (+${pct}%)` : delta < 0 ? `-₹${Math.abs(delta)} (${pct}%)` : 'No change',
      });
    }
  }

  // 3. Levies, Meter Rent, and Subsidies
  const levyItems: Array<{ label: string; baseVal: number; compVal: number; unitStr: string }> = [
    {
      label: 'Electricity Duty Rate',
      baseVal: baseVersion.electricityDutyRate * 100,
      compVal: comparedVersion.electricityDutyRate * 100,
      unitStr: '%',
    },
    {
      label: 'Fuel Adjustment (FAC) Rate',
      baseVal: baseVersion.fuelAdjustmentRatePerUnit,
      compVal: comparedVersion.fuelAdjustmentRatePerUnit,
      unitStr: '₹/u',
    },
    {
      label: 'Single-Phase Meter Rent',
      baseVal: baseVersion.meterRentSinglePhase,
      compVal: comparedVersion.meterRentSinglePhase,
      unitStr: '₹',
    },
    {
      label: 'Fixed Charge Subsidy',
      baseVal: baseVersion.subsidies.fixedChargeSubsidy,
      compVal: comparedVersion.subsidies.fixedChargeSubsidy,
      unitStr: '₹',
    },
    {
      label: 'Max Energy Subsidy',
      baseVal: baseVersion.subsidies.energySubsidyMaxAmount,
      compVal: comparedVersion.subsidies.energySubsidyMaxAmount,
      unitStr: '₹',
    },
  ];

  for (const item of levyItems) {
    const delta = Number((item.compVal - item.baseVal).toFixed(2));
    const pct = item.baseVal > 0 ? Number(((delta / item.baseVal) * 100).toFixed(1)) : 0;

    diffs.push({
      category: 'levy_subsidy',
      label: item.label,
      baseValue: item.baseVal,
      comparedValue: item.compVal,
      delta,
      percentageDelta: pct,
      formattedDelta: delta > 0 ? `+${delta}${item.unitStr}` : delta < 0 ? `-${Math.abs(delta)}${item.unitStr}` : 'No change',
    });
  }

  return diffs;
}
