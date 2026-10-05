/**
 * Deterministic Calculation Trace & Replay Engine
 * Produces machine-readable execution traces and validates bit-for-bit replayability.
 * Historical bills calculate against their pinned tariff order, never today's default.
 */

import { CalculationTrace, TraceStep } from './types';
import { UniversalBillInput, UniversalBillResult, UniversalTariffVersion } from '../electricity/types';
import { calculateUniversalBill } from '../electricity/engine/universalEngine';
import { UNIVERSAL_TARIFF_REGISTRY } from '../electricity/tariffs/registry';
import { BillCalculationResult } from '@/types';

export const CURRENT_ENGINE_VERSION = '2.1.0';

/**
 * Generates an auditable, machine-readable calculation trace for a bill result.
 * Supports both UniversalBillResult and legacy BillCalculationResult.
 */
export function generateCalculationTrace(
  result: UniversalBillResult | BillCalculationResult,
  input: UniversalBillInput,
  tariff: UniversalTariffVersion,
  engineVersion = CURRENT_ENGINE_VERSION
): CalculationTrace {
  const steps: TraceStep[] = [];
  let stepIndex = 1;
  let running = 0;

  const isUniversal = 'components' in result;
  const inputUnits = isUniversal ? result.inputUnits : result.units;
  const phase = result.phase;
  const billingCycle = isUniversal ? result.billingCycle : (result.billingCycle === 'monthly' ? 'MONTHLY' : 'BIMONTHLY');
  const connectedLoadKw = isUniversal ? result.connectedLoadKw : (result.connectedLoadWatts ? result.connectedLoadWatts / 1000 : 1);
  const providerId = isUniversal ? result.provider.id : (input.providerId || 'kseb');

  // 1. INPUT Stage
  steps.push({
    step: stepIndex++,
    stage: 'INPUT',
    label: 'Billed Consumption & Parameters',
    inputDescription: `${inputUnits} units, ${phase}-phase, ${billingCycle} cycle, ${connectedLoadKw} kW connected load`,
    ruleReference: 'Consumer Meter Record',
    unitsBilled: inputUnits,
    stepAmount: 0,
    runningTotal: 0,
    isDeduction: false,
    notes: 'Base parameters accepted for tariff computation',
  });

  // 2. TARIFF Stage
  steps.push({
    step: stepIndex++,
    stage: 'TARIFF',
    label: 'Regulatory Tariff Order Reference',
    inputDescription: `${tariff.categoryName} (${tariff.categoryCode})`,
    ruleReference: tariff.orderReference || 'State Regulatory Commission Tariff Order',
    stepAmount: 0,
    runningTotal: 0,
    isDeduction: false,
    notes: `Effective from ${tariff.effectiveFrom}`,
  });

  // 3. SLAB Breakdown Stage
  const slabList = isUniversal
    ? (result.explanation?.slabBreakdown || [])
    : result.slabBreakdown.map((s) => ({
        label: s.label,
        units: s.unitsBilled,
        rate: s.ratePerUnit,
        amount: s.amount,
      }));

  if (slabList.length > 0) {
    for (const slab of slabList) {
      running += slab.amount;
      steps.push({
        step: stepIndex++,
        stage: 'SLAB',
        label: `Energy Slab (${slab.label})`,
        inputDescription: `${slab.units} units @ ₹${slab.rate.toFixed(2)}/unit`,
        ruleReference: `${tariff.categoryCode} Energy Schedule`,
        rateApplied: slab.rate,
        unitsBilled: slab.units,
        stepAmount: slab.amount,
        runningTotal: Number(running.toFixed(2)),
        isDeduction: false,
      });
    }
  } else {
    const energyAmt = isUniversal
      ? (result.components.find((c) => c.category === 'ENERGY')?.amount ?? 0)
      : result.grossEnergyCharge;
    if (energyAmt > 0) {
      running += energyAmt;
      steps.push({
        step: stepIndex++,
        stage: 'SLAB',
        label: 'Energy Charges',
        inputDescription: `${inputUnits} units @ flat/applicable rate`,
        ruleReference: `${tariff.categoryCode} Energy Schedule`,
        unitsBilled: inputUnits,
        stepAmount: energyAmt,
        runningTotal: Number(running.toFixed(2)),
        isDeduction: false,
      });
    }
  }

  // 4. FIXED Charges Stage
  const fixedAmt = isUniversal
    ? (result.components.find((c) => c.category === 'FIXED')?.amount ?? 0)
    : result.grossFixedCharge;
  if (fixedAmt > 0) {
    running += fixedAmt;
    steps.push({
      step: stepIndex++,
      stage: 'FIXED',
      label: 'Standing / Fixed Charges',
      inputDescription: `${phase === 'three' ? 'Three Phase' : 'Single Phase'} standing supply charge`,
      ruleReference: `${tariff.categoryCode} Fixed Charge Table`,
      stepAmount: fixedAmt,
      runningTotal: Number(running.toFixed(2)),
      isDeduction: false,
    });
  }

  // 5. VARIABLE Adjustment Stage (FAC / FPPCA)
  const facAmt = isUniversal
    ? (result.components.find((c) => c.category === 'VARIABLE_ADJUSTMENT')?.amount ?? 0)
    : result.fuelAdjustment;
  if (facAmt > 0) {
    running += facAmt;
    steps.push({
      step: stepIndex++,
      stage: 'VARIABLE',
      label: 'Fuel Surcharge (FAC)',
      inputDescription: `${inputUnits} units variable fuel adjustment`,
      ruleReference: tariff.variableAdjustment?.orderReference || 'State Commission Fuel Surcharge Notification',
      rateApplied: tariff.variableAdjustment?.ratePerUnit,
      unitsBilled: inputUnits,
      stepAmount: facAmt,
      runningTotal: Number(running.toFixed(2)),
      isDeduction: false,
    });
  }

  // 6. DUTY Stage
  const dutyAmt = isUniversal
    ? (result.components.find((c) => c.category === 'TAX_DUTY')?.amount ?? 0)
    : result.electricityDuty;
  if (dutyAmt > 0) {
    running += dutyAmt;
    steps.push({
      step: stepIndex++,
      stage: 'DUTY',
      label: 'Electricity Duty',
      inputDescription: 'Statutory electricity duty',
      ruleReference: 'State Electricity Duty Act',
      rateApplied: tariff.dutyRule?.rate,
      stepAmount: dutyAmt,
      runningTotal: Number(running.toFixed(2)),
      isDeduction: false,
    });
  }

  // 7. METER RENT Stage
  const meterAmt = isUniversal
    ? (result.components.find((c) => c.category === 'METER_RENT')?.amount ?? 0)
    : result.meterRent;
  if (meterAmt > 0) {
    running += meterAmt;
    steps.push({
      step: stepIndex++,
      stage: 'METER_RENT',
      label: 'Meter Rent',
      inputDescription: 'Meter rental charge',
      ruleReference: 'Discom Schedule of Service Charges',
      stepAmount: meterAmt,
      runningTotal: Number(running.toFixed(2)),
      isDeduction: false,
    });
  }

  // 8. SUBSIDY Stage (Deductions)
  const subsidyAmt = isUniversal ? result.totalSubsidies : result.totalSubsidies;
  if (subsidyAmt > 0) {
    running -= subsidyAmt;
    steps.push({
      step: stepIndex++,
      stage: 'SUBSIDY',
      label: 'Government Subsidy Benefit',
      inputDescription: 'Government welfare subsidy rebate',
      ruleReference: 'State Government Tariff Subsidy Notification',
      stepAmount: subsidyAmt,
      runningTotal: Number(running.toFixed(2)),
      isDeduction: true,
      notes: `Subtracted from bill total: −₹${subsidyAmt.toFixed(2)}`,
    });
  }

  // 9. ROUND OFF Stage
  const roundOffAmt = isUniversal ? result.roundOff : result.roundOff;
  if (Math.abs(roundOffAmt) > 0.001) {
    running += roundOffAmt;
    steps.push({
      step: stepIndex++,
      stage: 'ROUND_OFF',
      label: 'Rupee Round-Off',
      inputDescription: roundOffAmt >= 0 ? `+₹${roundOffAmt.toFixed(2)} adjustment` : `-₹${Math.abs(roundOffAmt).toFixed(2)} adjustment`,
      ruleReference: 'Standard Indian Commercial Rounding (half-up)',
      stepAmount: Math.abs(roundOffAmt),
      runningTotal: Number(running.toFixed(2)),
      isDeduction: roundOffAmt < 0,
    });
  }

  // 10. FINAL Stage
  const finalPayable = result.total;
  steps.push({
    step: stepIndex++,
    stage: 'FINAL',
    label: 'Final Net Payable',
    inputDescription: `₹${finalPayable.toLocaleString('en-IN')}`,
    ruleReference: 'Calculated Bill Total Payable',
    stepAmount: finalPayable,
    runningTotal: finalPayable,
    isDeduction: false,
    notes: 'Exact payable amount',
  });

  return {
    traceId: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    engineVersion,
    tariffVersionId: tariff.id,
    tariffOrderReference: tariff.orderReference || 'Approved Tariff Order',
    providerId,
    inputSnapshot: {
      units: input.units ?? inputUnits,
      previousReading: input.previousReading,
      presentReading: input.presentReading,
      phase,
      billingCycle: String(billingCycle),
      connectedLoadKw,
      applyOptInSubsidies: input.applyOptInSubsidies,
      isMeterReplaced: input.isMeterReplaced,
    },
    steps,
    subtotal: isUniversal ? result.subtotal : result.subtotal,
    totalSubsidies: subsidyAmt,
    roundOff: roundOffAmt,
    finalPayable,
    isReplayable: true,
  };
}

export interface ReplayVerificationResult {
  matches: boolean;
  replayedTotal: number;
  originalTotal: number;
  discrepancies: string[];
  replayedResult: UniversalBillResult;
}

/**
 * Replays a calculation using exact historical metadata.
 * Proves deterministic bit-for-bit repeatability.
 */
export function replayCalculation(trace: CalculationTrace): ReplayVerificationResult {
  const { inputSnapshot, tariffVersionId, providerId, finalPayable } = trace;

  // Retrieve exact historical tariff version
  const tariff = UNIVERSAL_TARIFF_REGISTRY[tariffVersionId];
  if (!tariff) {
    return {
      matches: false,
      replayedTotal: 0,
      originalTotal: finalPayable,
      discrepancies: [`Historical tariff version "${tariffVersionId}" is not present in registry.`],
      replayedResult: null as unknown as UniversalBillResult,
    };
  }

  const billInput: UniversalBillInput = {
    providerId,
    tariffVersionId,
    units: inputSnapshot.units,
    previousReading: inputSnapshot.previousReading,
    presentReading: inputSnapshot.presentReading,
    phase: inputSnapshot.phase as 'single' | 'three',
    billingCycle: inputSnapshot.billingCycle as 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY',
    connectedLoadKw: inputSnapshot.connectedLoadKw,
    applyOptInSubsidies: inputSnapshot.applyOptInSubsidies,
    isMeterReplaced: inputSnapshot.isMeterReplaced,
  };

  const replayedResult = calculateUniversalBill(billInput, tariff);
  const discrepancies: string[] = [];

  if (replayedResult.total !== finalPayable) {
    discrepancies.push(
      `Replayed total (₹${replayedResult.total}) does not match original trace total (₹${finalPayable}).`
    );
  }

  if (Math.abs(replayedResult.subtotal - trace.subtotal) > 0.05) {
    discrepancies.push(
      `Replayed subtotal (₹${replayedResult.subtotal}) differs from original (₹${trace.subtotal}).`
    );
  }

  return {
    matches: discrepancies.length === 0,
    replayedTotal: replayedResult.total,
    originalTotal: finalPayable,
    discrepancies,
    replayedResult,
  };
}

/**
 * Compares two tariff versions on the exact same input to evaluate impact of regulatory revisions.
 */
export function diffCalculationEngines(
  input: UniversalBillInput,
  tariffA: UniversalTariffVersion,
  tariffB: UniversalTariffVersion
): {
  resultA: UniversalBillResult;
  resultB: UniversalBillResult;
  totalDifference: number; // resultB - resultA
  percentDifference: number;
  slabDifferences: { label: string; rateA: number; rateB: number; diff: number }[];
} {
  const resultA = calculateUniversalBill(input, tariffA);
  const resultB = calculateUniversalBill(input, tariffB);

  const diffRupees = resultB.total - resultA.total;
  const percentDiff = resultA.total > 0 ? Number(((diffRupees / resultA.total) * 100).toFixed(1)) : 0;

  const slabDifferences: { label: string; rateA: number; rateB: number; diff: number }[] = [];
  const maxSlabs = Math.max(tariffA.telescopicSlabs.length, tariffB.telescopicSlabs.length);

  for (let i = 0; i < maxSlabs; i++) {
    const sA = tariffA.telescopicSlabs[i];
    const sB = tariffB.telescopicSlabs[i];
    if (sA && sB) {
      slabDifferences.push({
        label: sA.label || `${sA.minUnits}-${sA.maxUnits ?? '∞'}`,
        rateA: sA.ratePerUnit,
        rateB: sB.ratePerUnit,
        diff: Number((sB.ratePerUnit - sA.ratePerUnit).toFixed(2)),
      });
    }
  }

  return {
    resultA,
    resultB,
    totalDifference: diffRupees,
    percentDifference: percentDiff,
    slabDifferences,
  };
}
