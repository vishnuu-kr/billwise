/**
 * Component Reconciliation Engine & Difference Attributor
 * Audits Calculated Bill vs Official Bill component-by-component.
 * Labels each line-item MATCH, NEAR_MATCH, DIFFERENCE, or UNAVAILABLE.
 * Pinpoints the single dominant root cause for any total variance.
 */

import {
  BillReconciliationReport,
  ComponentReconciliationItem,
  ReconciliationDifferenceReason,
  ReconciliationStatus,
} from './types';
import { ExtractedBillData, BillCalculationResult } from '@/types';
import { UniversalBillResult } from '../electricity/types';

export function reconcileBillWithCalculation(
  extracted: ExtractedBillData,
  calculated: UniversalBillResult | BillCalculationResult
): BillReconciliationReport {
  const isUniversal = 'components' in calculated;

  // Extract calculated line items
  const calcEnergy = isUniversal
    ? calculated.components.find((c) => c.category === 'ENERGY')?.amount ?? 0
    : (calculated as BillCalculationResult).grossEnergyCharge;

  const calcFixed = isUniversal
    ? calculated.components.find((c) => c.category === 'FIXED')?.amount ?? 0
    : (calculated as BillCalculationResult).grossFixedCharge;

  const calcDuty = isUniversal
    ? calculated.components.find((c) => c.category === 'TAX_DUTY')?.amount ?? 0
    : (calculated as BillCalculationResult).electricityDuty;

  const calcFac = isUniversal
    ? calculated.components.find((c) => c.category === 'VARIABLE_ADJUSTMENT')?.amount ?? 0
    : (calculated as BillCalculationResult).fuelAdjustment;

  const calcMeterRent = isUniversal
    ? calculated.components.find((c) => c.category === 'METER_RENT')?.amount ?? 0
    : (calculated as BillCalculationResult).meterRent;

  const calcSubsidies = isUniversal
    ? calculated.totalSubsidies
    : (calculated as BillCalculationResult).totalSubsidies;

  const calcRoundOff = isUniversal
    ? calculated.roundOff
    : (calculated as BillCalculationResult).roundOff;

  const calculatedTotal = calculated.total;
  const officialTotal = extracted.totalAmount;

  const items: ComponentReconciliationItem[] = [];

  // Helper to build line item
  const buildItem = (
    id: string,
    name: string,
    calcAmt: number | null,
    offAmt: number | null,
    defaultReason?: ReconciliationDifferenceReason
  ): ComponentReconciliationItem => {
    if (offAmt === null || offAmt === undefined || isNaN(offAmt)) {
      return {
        componentId: id,
        componentName: name,
        calculatedAmount: calcAmt,
        officialAmount: null,
        difference: 0,
        status: 'UNAVAILABLE',
        explanation: 'Item not separately itemized on physical bill text',
      };
    }

    const calcVal = calcAmt ?? 0;
    const diff = Number((calcVal - offAmt).toFixed(2));
    const absDiff = Math.abs(diff);

    let status: ReconciliationStatus;
    let explanation: string;
    let reason = defaultReason;

    if (absDiff === 0) {
      status = 'MATCH';
      explanation = 'Exact rupee match with official bill item.';
    } else if (absDiff <= 1.0) {
      status = 'NEAR_MATCH';
      reason = 'ROUNDING_VARIANCE';
      explanation = `Minor rounding difference of ₹${absDiff.toFixed(2)}.`;
    } else {
      status = 'DIFFERENCE';
      explanation = `Variance of ₹${absDiff.toFixed(2)} between calculated and billed amount.`;
    }

    return {
      componentId: id,
      componentName: name,
      calculatedAmount: calcAmt,
      officialAmount: offAmt,
      difference: diff,
      status,
      reason,
      explanation,
    };
  };

  // 1. Energy Charges
  const energyReason: ReconciliationDifferenceReason =
    extracted.consumedUnits && extracted.consumedUnits > 500
      ? 'TELESCOPIC_THRESHOLD_SURPASS'
      : 'OTHER_UNATTRIBUTED';

  items.push(
    buildItem('energy_charge', 'Energy Charge', calcEnergy, extracted.energyCharge ?? null, energyReason)
  );

  // 2. Fixed Charges
  items.push(
    buildItem('fixed_charge', 'Fixed / Standing Charge', calcFixed, extracted.fixedCharge ?? null, 'PHASE_ASSUMPTION_VARIANCE')
  );

  // 3. Electricity Duty
  items.push(
    buildItem('electricity_duty', 'Statutory Electricity Duty', calcDuty, extracted.duty ?? null, 'DUTY_BASIS_VARIANCE')
  );

  // 4. Fuel Adjustment / FAC
  items.push(
    buildItem('fuel_adjustment', 'Fuel Surcharge (FAC)', calcFac, extracted.fuelAdjustment ?? null, 'FAC_VARIANCE')
  );

  // 5. Meter Rent
  items.push(
    buildItem('meter_rent', 'Meter Rent', calcMeterRent, extracted.meterRent ?? null, 'METER_RENT_OMITTED_ON_BILL')
  );

  // 6. Subsidies
  items.push(
    buildItem('subsidies', 'Government Subsidies', calcSubsidies, extracted.subsidy ?? null, 'SUBSIDY_CLIFF_OR_DISALLOWANCE')
  );

  // 7. Round Off
  if (Math.abs(calcRoundOff) > 0.001) {
    items.push(
      buildItem('round_off', 'Rupee Round-Off', calcRoundOff, null, 'ROUNDING_VARIANCE')
    );
  }

  // Total Difference Evaluation
  const totalDiff = Number((calculatedTotal - officialTotal).toFixed(2));
  const absTotalDiff = Math.abs(totalDiff);

  let overallStatus: ReconciliationStatus;
  if (absTotalDiff === 0) {
    overallStatus = 'MATCH';
  } else if (absTotalDiff <= 1.0) {
    overallStatus = 'NEAR_MATCH';
  } else {
    overallStatus = 'DIFFERENCE';
  }

  // Determine Dominant Reason
  let dominantReason: ReconciliationDifferenceReason | null = null;
  let dominantExplanation = '';

  if (overallStatus === 'MATCH') {
    dominantReason = null;
    dominantExplanation = 'All verified line items match the official bill payable amount exactly.';
  } else if (overallStatus === 'NEAR_MATCH') {
    dominantReason = 'ROUNDING_VARIANCE';
    dominantExplanation = `Commercial half-up rounding difference of ₹${absTotalDiff.toFixed(2)}.`;
  } else {
    // Audit component-level differences to find dominant contributor
    const diffContributors = items
      .filter((i) => i.status === 'DIFFERENCE' && i.reason)
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    if (diffContributors.length > 0) {
      const top = diffContributors[0];
      dominantReason = top.reason || 'OTHER_UNATTRIBUTED';
      dominantExplanation = `Dominant factor is ${top.componentName} (₹${Math.abs(top.difference).toFixed(2)} variance).`;
    } else if (extracted.consumedUnits && extracted.consumedUnits > 500) {
      dominantReason = 'TELESCOPIC_THRESHOLD_SURPASS';
      dominantExplanation = 'Consumption exceeded 500 units bi-monthly, triggering non-telescopic higher slab rates.';
    } else {
      dominantReason = 'OTHER_UNATTRIBUTED';
      dominantExplanation = `Total payable differs by ₹${absTotalDiff.toFixed(2)}, likely due to unbilled arrears, late fee interest, or regional surcharges on the physical bill.`;
    }
  }

  return {
    overallStatus,
    calculatedTotal,
    officialTotal,
    totalDifference: totalDiff,
    dominantReason,
    dominantExplanation,
    isAudited: true,
    items,
  };
}
