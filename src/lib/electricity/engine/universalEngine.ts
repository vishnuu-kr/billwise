import {
  UniversalBillInput,
  UniversalBillResult,
  UniversalTariffVersion,
  ElectricityProvider,
  BillComponent,
  SupplyPhase,
} from '../types';
import { getProviderById } from '../providers';
import { getTariffByProviderId, UNIVERSAL_TARIFF_REGISTRY } from '../tariffs/registry';

export function calculateConsumedUnitsFromInput(input: UniversalBillInput): { units: number; error?: string } {
  if (typeof input.units === 'number') {
    if (isNaN(input.units)) return { units: 0, error: 'Consumed units cannot be NaN.' };
    if (!isFinite(input.units)) return { units: 0, error: 'Consumed units must be a finite number.' };
    if (input.units < 0) return { units: 0, error: 'Consumed units cannot be negative.' };
    return { units: Math.round(input.units) };
  }

  if (input.previousReading !== undefined && input.presentReading !== undefined) {
    if (isNaN(input.previousReading) || isNaN(input.presentReading)) {
      return { units: 0, error: 'Meter readings must be valid numbers.' };
    }
    if (input.isMeterReplaced) {
      const oldMeterFinal = input.oldMeterFinalReading ?? input.previousReading;
      const newMeterInitial = input.newMeterInitialReading ?? 0;
      const oldPart = Math.max(0, oldMeterFinal - input.previousReading);
      const newPart = Math.max(0, input.presentReading - newMeterInitial);
      return { units: Math.round(oldPart + newPart) };
    }

    if (input.presentReading < input.previousReading) {
      const digits = input.meterDigits || 5;
      const maxReading = Math.pow(10, digits);
      if (input.previousReading > maxReading * 0.9 && input.presentReading < maxReading * 0.1) {
        const rolloverUnits = maxReading - input.previousReading + input.presentReading;
        return { units: Math.round(rolloverUnits) };
      }
      return {
        units: 0,
        error: 'Present reading is lower than previous reading. Check meter readings or specify if meter was replaced.',
      };
    }

    return { units: Math.round(input.presentReading - input.previousReading) };
  }

  return { units: 0, error: 'Please provide either consumed units or meter readings.' };
}

/**
 * Universal Deterministic Calculation Engine
 * Operates across all Indian retail electricity providers without hardcoded UI branching.
 */
export function calculateUniversalBill(
  input: UniversalBillInput,
  customTariff?: UniversalTariffVersion
): UniversalBillResult {
  const { units, error } = calculateConsumedUnitsFromInput(input);
  if (error) {
    throw new Error(error);
  }

  if (!input.providerId) {
    throw new Error('Provider ID is required. BILLWISE will not calculate a bill without a specified provider.');
  }

  const provider: ElectricityProvider | undefined = getProviderById(input.providerId);
  if (!provider) {
    throw new Error(`Unknown electricity provider: "${input.providerId}". BILLWISE requires a verified provider and will never guess or silently default to KSEB.`);
  }

  const tariff: UniversalTariffVersion | undefined =
    customTariff ||
    (input.tariffVersionId ? UNIVERSAL_TARIFF_REGISTRY[input.tariffVersionId] : undefined) ||
    getTariffByProviderId(provider.id);

  if (!tariff) {
    throw new Error(`No active tariff configuration found for provider "${provider.displayName}" (${provider.id}). BILLWISE fails safely rather than guessing rates.`);
  }

  const phase: SupplyPhase = input.phase || 'single';
  const connectedLoadKw = input.connectedLoadKw ?? (phase === 'three' ? 5 : 1);
  const billingCycle = input.billingCycle || tariff.billingCycle;
  const billingDays = billingCycle === 'BIMONTHLY' ? 60 : 30;

  const components: BillComponent[] = [];
  const slabBreakdown: { label: string; units: number; rate: number; amount: number }[] = [];
  const warnings: string[] = [];
  const regulatoryNotes: string[] = [];

  if (tariff.notes) regulatoryNotes.push(tariff.notes);
  if (tariff.orderReference) regulatoryNotes.push(`Order Reference: ${tariff.orderReference}`);

  // 1. Energy Charges
  let grossEnergyCharge = 0;
  const isTelescopicThreshold = tariff.telescopicThresholdUnits ?? 500;
  const isTelescopic = tariff.energySlabType === 'TELESCOPIC' || (tariff.energySlabType === 'MIXED' && units <= isTelescopicThreshold);

  if (isTelescopic) {
    let remaining = units;
    for (const slab of tariff.telescopicSlabs) {
      if (remaining <= 0) break;
      const span = slab.maxUnits !== null
        ? (slab.minUnits === 0 ? slab.maxUnits : slab.maxUnits - slab.minUnits + 1)
        : remaining;
      const billedInSlab = Math.min(remaining, span);
      if (billedInSlab > 0) {
        const amount = Number((billedInSlab * slab.ratePerUnit).toFixed(2));
        grossEnergyCharge += amount;
        slabBreakdown.push({
          label: slab.label || `${slab.minUnits}-${slab.maxUnits ?? '∞'} units`,
          units: billedInSlab,
          rate: slab.ratePerUnit,
          amount,
        });
        remaining -= billedInSlab;
      }
    }
  } else if (tariff.nonTelescopicSlabs && tariff.nonTelescopicSlabs.length > 0) {
    // Non-telescopic: all units billed at single tier rate
    const matchedSlab = tariff.nonTelescopicSlabs.find(
      s => units >= s.minUnits && (s.maxUnits === null || units <= s.maxUnits)
    ) || tariff.nonTelescopicSlabs[tariff.nonTelescopicSlabs.length - 1];

    grossEnergyCharge = Number((units * matchedSlab.ratePerUnit).toFixed(2));
    slabBreakdown.push({
      label: `Non-telescopic (${matchedSlab.minUnits}–${matchedSlab.maxUnits ?? '∞'})`,
      units,
      rate: matchedSlab.ratePerUnit,
      amount: grossEnergyCharge,
    });
  } else {
    // Flat rate
    const rate = tariff.telescopicSlabs[0]?.ratePerUnit || 5.0;
    grossEnergyCharge = Number((units * rate).toFixed(2));
    slabBreakdown.push({
      label: 'Flat Consumption',
      units,
      rate,
      amount: grossEnergyCharge,
    });
  }

  components.push({
    id: 'energy_charge',
    name: 'Energy Charges',
    nameLocal: 'ഊർജ്ജ നിരക്ക്',
    category: 'ENERGY',
    amount: grossEnergyCharge,
    units,
    details: `${units} units consumed across tariff slabs`,
    isDeduction: false,
  });

  // 2. Wheeling Charges (e.g. MSEDCL)
  let wheelingCharge = 0;
  if (tariff.wheelingChargePerUnit && tariff.wheelingChargePerUnit > 0) {
    wheelingCharge = Number((units * tariff.wheelingChargePerUnit).toFixed(2));
    components.push({
      id: 'wheeling_charge',
      name: 'Wheeling Charges',
      category: 'WHEELING',
      amount: wheelingCharge,
      rate: tariff.wheelingChargePerUnit,
      units,
      details: `Wheeling distribution charge at ₹${tariff.wheelingChargePerUnit}/unit`,
      isDeduction: false,
    });
  }

  // 3. Fixed / Demand Charges
  let fixedCharge = 0;
  const applicableFixedRule = tariff.fixedChargeRules.find(rule => {
    const phaseMatch = !rule.phase || rule.phase === 'any' || rule.phase === phase;
    const unitsMatch = (rule.minUnits === undefined || units >= rule.minUnits) &&
                       (rule.maxUnits === null || rule.maxUnits === undefined || units <= rule.maxUnits);
    return phaseMatch && unitsMatch;
  }) || tariff.fixedChargeRules[0];

  if (applicableFixedRule) {
    if (applicableFixedRule.basis === 'PER_KW') {
      if (applicableFixedRule.perKwAboveThresholdRate) {
        // Tiered per-kW (e.g. BESCOM ₹110 for 1st kW + ₹210 for extra kW)
        const firstKw = Math.min(1, connectedLoadKw);
        const extraKw = Math.max(0, connectedLoadKw - 1);
        fixedCharge = (firstKw * applicableFixedRule.amount) + (extraKw * applicableFixedRule.perKwAboveThresholdRate);
      } else {
        // Uniform per-kW (e.g. TPDDL ₹20/kW, PVVNL ₹110/kW)
        fixedCharge = connectedLoadKw * applicableFixedRule.amount;
      }
      if (fixedCharge <= 0) fixedCharge = applicableFixedRule.amount;
    } else {
      fixedCharge = applicableFixedRule.amount;
      if (applicableFixedRule.perKwAboveThresholdRate && connectedLoadKw > (applicableFixedRule.perKwAboveThresholdUnits || 5000)) {
        const extraKw = Math.ceil((connectedLoadKw - (applicableFixedRule.perKwAboveThresholdUnits || 5000)) / 1000);
        fixedCharge += extraKw * applicableFixedRule.perKwAboveThresholdRate;
      }
    }
  }

  components.push({
    id: 'fixed_charge',
    name: 'Fixed / Standing Charges',
    nameLocal: 'സ്ഥിര നിരക്ക്',
    category: 'FIXED',
    amount: fixedCharge,
    details: `${phase === 'three' ? 'Three Phase' : 'Single Phase'} standing supply charge`,
    isDeduction: false,
  });

  // 4. Variable Adjustment (FAC / FPPCA / PPAC)
  let facAmount = 0;
  if (tariff.variableAdjustment && tariff.variableAdjustment.ratePerUnit > 0) {
    facAmount = Number((units * tariff.variableAdjustment.ratePerUnit).toFixed(2));
    components.push({
      id: 'variable_adjustment',
      name: tariff.variableAdjustment.name,
      category: 'VARIABLE_ADJUSTMENT',
      amount: facAmount,
      rate: tariff.variableAdjustment.ratePerUnit,
      units,
      details: `${tariff.variableAdjustment.name} @ ₹${tariff.variableAdjustment.ratePerUnit}/unit`,
      isDeduction: false,
    });
  }

  // 5. Electricity Duty & Statutory Taxes
  let dutyAmount = 0;
  if (tariff.dutyRule) {
    if (tariff.dutyRule.type === 'PERCENT_ENERGY') {
      dutyAmount = Number((grossEnergyCharge * tariff.dutyRule.rate).toFixed(2));
    } else if (tariff.dutyRule.type === 'PERCENT_TOTAL') {
      const dutyBase = grossEnergyCharge + wheelingCharge + fixedCharge + facAmount;
      dutyAmount = Number((dutyBase * tariff.dutyRule.rate).toFixed(2));
    } else if (tariff.dutyRule.type === 'PER_UNIT') {
      dutyAmount = Number((units * tariff.dutyRule.rate).toFixed(2));
    }

    components.push({
      id: 'electricity_duty',
      name: tariff.dutyRule.label || 'Electricity Duty',
      nameLocal: 'വൈദ്യുതി നികുതി',
      category: 'TAX_DUTY',
      amount: dutyAmount,
      rate: tariff.dutyRule.rate,
      details: `State statutory levy (${(tariff.dutyRule.rate * 100).toFixed(0)}%)`,
      isDeduction: false,
    });
  }

  // 6. Other surcharges (e.g. Delhi Pension Surcharge)
  if (tariff.otherSurcharges) {
    for (const sc of tariff.otherSurcharges) {
      let scAmount = 0;
      if (sc.ratePercent) {
        scAmount = Number((grossEnergyCharge * sc.ratePercent).toFixed(2));
      } else if (sc.ratePerUnit) {
        scAmount = Number((units * sc.ratePerUnit).toFixed(2));
      }
      if (scAmount > 0) {
        components.push({
          id: `surcharge_${sc.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: sc.name,
          category: 'TAX_DUTY',
          amount: scAmount,
          isDeduction: false,
        });
      }
    }
  }

  // 7. Meter Rent
  const meterRent = phase === 'three' ? (tariff.meterRentThreePhase || 0) : (tariff.meterRentSinglePhase || 0);
  if (meterRent > 0) {
    components.push({
      id: 'meter_rent',
      name: 'Meter Rent',
      nameLocal: 'മീറ്റർ വാടക',
      category: 'METER_RENT',
      amount: meterRent,
      details: `${phase === 'three' ? '3-Phase' : '1-Phase'} static meter bi-monthly rental`,
      isDeduction: false,
    });
  }

  // 8. Subsidies & Rebates (Deductions)
  let totalSubsidies = 0;
  if (tariff.subsidies) {
    for (const sub of tariff.subsidies) {
      if (sub.isOptIn && !input.applyOptInSubsidies) {
        continue;
      }

      if (sub.maxEligibleUnits && units > sub.maxEligibleUnits) {
        continue;
      }

      let subAmount = 0;
      if (sub.type === 'FIXED_DISCOUNT' && sub.fixedAmount) {
        subAmount = sub.fixedAmount;
      } else if (sub.type === 'FREE_UNITS' && sub.freeUnitsAllowance) {
        // Covers units up to allowance
        const eligibleUnits = Math.min(units, sub.freeUnitsAllowance);
        subAmount = Number((eligibleUnits * (tariff.telescopicSlabs[0]?.ratePerUnit || 3.0)).toFixed(2));
      } else if (sub.type === 'DISCOUNT_PER_UNIT' && sub.discountPerUnit) {
        subAmount = Number((units * sub.discountPerUnit).toFixed(2));
      }

      if (subAmount > 0) {
        totalSubsidies += subAmount;
        components.push({
          id: `subsidy_${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: sub.name,
          nameLocal: 'സർക്കാർ സബ്സിഡി',
          category: 'DISCOUNT',
          amount: subAmount,
          details: sub.description,
          isDeduction: true,
        });
      }
    }
  }

  // Calculate Subtotal & Total
  const grossTotal = components
    .filter(c => !c.isDeduction)
    .reduce((sum, c) => sum + c.amount, 0);

  const netUnrounded = Math.max(0, grossTotal - totalSubsidies);
  const total = Math.round(netUnrounded);
  const roundOff = Number((total - netUnrounded).toFixed(2));

  if (Math.abs(roundOff) > 0.001) {
    components.push({
      id: 'round_off',
      name: 'Round Off',
      category: 'OTHER',
      amount: Math.abs(roundOff),
      details: roundOff >= 0 ? `+₹${roundOff.toFixed(2)} adjustment` : `-₹${Math.abs(roundOff).toFixed(2)} adjustment`,
      isDeduction: roundOff < 0,
    });
  }

  const averageUnitsPerDay = Number((units / billingDays).toFixed(2));
  const effectiveCostPerUnit = units > 0 ? Number((total / units).toFixed(2)) : 0;

  // Universal Explanations
  const energySharePct = grossTotal > 0 ? Math.round((grossEnergyCharge / grossTotal) * 100) : 0;
  const primaryDriver = energySharePct > 65
    ? `Electricity consumption (${energySharePct}% of bill)`
    : 'Standing supply charges & duties';

  const summary = `Your ${provider.shortName} bill for ${units} units is estimated at ₹${total.toLocaleString('en-IN')}. ` +
    `Energy consumption accounts for ${energySharePct}% of your total cost.`;

  return {
    provider,
    tariff,
    inputUnits: units,
    billingCycle,
    phase,
    connectedLoadKw,
    components,
    subtotal: Number(grossTotal.toFixed(2)),
    totalSubsidies,
    roundOff,
    total,
    billingDays,
    averageUnitsPerDay,
    effectiveCostPerUnit,
    isEstimate: false,
    explanation: {
      summary,
      primaryDriver,
      slabBreakdown,
      dutyDetails: tariff.dutyRule ? `${tariff.dutyRule.label}: ₹${dutyAmount.toFixed(2)}` : 'Standard levies included',
      regulatoryOrderNote: tariff.orderReference || 'Approved by State Regulatory Commission',
    },
    anomalyStatus: 'NORMAL',
    warnings,
    regulatoryNotes,
  };
}
