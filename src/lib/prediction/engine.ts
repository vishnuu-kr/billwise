import { PredictionInput, PredictionResult } from '@/types';
import { calculateBill, calculateConsumedUnits } from '@/lib/calculation/engine';
import { SITE_CONFIG } from '@/lib/config/site';

/**
 * Predicts cycle consumption, bill range, and slab threshold warnings.
 * Uses deterministic mathematical projections (moving rate + historical weighting),
 * never AI guessing or fake precision.
 */
export function predictUsage(input: PredictionInput): PredictionResult {
  const isBiMonthly = (input.billingCycle ?? 'bi-monthly') === 'bi-monthly';
  const totalCycleDays = input.totalCycleDays || (isBiMonthly ? 60 : 30);
  const daysElapsed = Math.max(1, Math.min(input.daysElapsed, totalCycleDays));
  const daysRemaining = Math.max(0, totalCycleDays - daysElapsed);

  // Determine current consumption
  let currentUnits = 0;
  if (typeof input.currentCycleUnits === 'number') {
    currentUnits = Math.max(0, input.currentCycleUnits);
  } else if (input.previousReading !== undefined && input.currentReading !== undefined) {
    const delta = calculateConsumedUnits({
      previousReading: input.previousReading,
      presentReading: input.currentReading,
      billingCycle: input.billingCycle ?? 'bi-monthly',
      phase: input.phase ?? 'single',
    });
    currentUnits = delta.units;
  }

  // Calculate daily run rate
  const unitsPerDay = Number((currentUnits / daysElapsed).toFixed(2));

  // Projected units for the full cycle
  // If historical average is available, apply Bayesian-like blend
  let projectedUnits: number;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let confidenceReason = '';

  const rawProjected = unitsPerDay * totalCycleDays;

  if (input.historicalAverageUnits && daysElapsed < 15) {
    // Early in cycle with history: blend 40% current pace + 60% historical average
    projectedUnits = Math.round(rawProjected * 0.4 + input.historicalAverageUnits * 0.6);
    confidence = 'medium';
    confidenceReason = 'Blended with your historical average usage as you are early in the billing cycle.';
  } else if (daysElapsed >= 40) {
    projectedUnits = Math.round(rawProjected);
    confidence = 'high';
    confidenceReason = `High confidence (${daysElapsed} days of real meter data in this cycle).`;
  } else if (daysElapsed >= 15) {
    projectedUnits = Math.round(rawProjected);
    confidence = 'medium';
    confidenceReason = `Moderate confidence based on ${daysElapsed} days of usage.`;
  } else {
    projectedUnits = Math.round(rawProjected);
    confidence = 'low';
    confidenceReason = 'Early estimate — accuracy will improve after a few more days of meter readings.';
  }

  // Calculate deterministic bill for the projected consumption
  const calculatedBillResult = calculateBill({
    units: projectedUnits,
    billingCycle: input.billingCycle ?? 'bi-monthly',
    phase: input.phase ?? 'single',
    connectedLoadWatts: input.connectedLoadWatts ?? 982,
  });

  const estimatedBill = calculatedBillResult.total;

  // Calculate realistic range based on variance & days elapsed
  // Early in cycle -> ±10-15%, late in cycle -> ±3-5%
  const varianceFactor = daysElapsed < 15 ? 0.08 : (daysElapsed < 40 ? 0.05 : 0.03);
  const rangeMarginUnits = Math.max(8, Math.round(projectedUnits * varianceFactor));
  
  const minUnits = Math.max(0, projectedUnits - rangeMarginUnits);
  const maxUnits = projectedUnits + rangeMarginUnits;

  const minBillResult = calculateBill({
    units: minUnits,
    billingCycle: input.billingCycle ?? 'bi-monthly',
    phase: input.phase ?? 'single',
    connectedLoadWatts: input.connectedLoadWatts ?? 982,
  });

  const maxBillResult = calculateBill({
    units: maxUnits,
    billingCycle: input.billingCycle ?? 'bi-monthly',
    phase: input.phase ?? 'single',
    connectedLoadWatts: input.connectedLoadWatts ?? 982,
  });

  // Calculate approaching higher band / slab warning
  // Key KSEB thresholds: 80, 160, 200, 240 (subsidy cliff!), 250, 300, 500 (non-telescopic cliff!)
  const thresholds = isBiMonthly
    ? [80, 160, 200, 240, 250, 300, 400, 500]
    : [40, 80, 100, 120, 125, 150, 200, 250];

  let approachingSlab: PredictionResult['approachingSlab'] = null;

  // Find the next upcoming threshold that currentUnits or projectedUnits has not yet fully passed
  for (const threshold of thresholds) {
    if (currentUnits < threshold && projectedUnits >= threshold - 35) {
      const unitsRemaining = threshold - currentUnits;
      const daysToThreshold = unitsPerDay > 0 ? Math.max(1, Math.round(unitsRemaining / unitsPerDay)) : null;
      
      let warningMessage = '';
      if (threshold === 240 || threshold === 120) {
        warningMessage = `Approaching the 240-unit government subsidy ceiling (${unitsRemaining} units left). Exceeding this removes the ₹148 subsidy.`;
      } else if (threshold === 500 || threshold === 250) {
        warningMessage = `Approaching the 500-unit telescopic cliff (${unitsRemaining} units left). Crossing 500 units shifts your entire bill to non-telescopic rates.`;
      } else {
        warningMessage = `Approaching a higher usage band at ${threshold} units (${unitsRemaining} units remaining at current pace).`;
      }

      approachingSlab = {
        isApproaching: true,
        currentSlabLimit: threshold,
        nextSlabRate: threshold === 240 ? 5.90 : 6.80,
        unitsRemainingInSlab: unitsRemaining,
        estimatedDaysRemaining: daysToThreshold,
        warningMessage,
      };
      break;
    } else if (currentUnits >= 240 && currentUnits <= 260 && threshold === 240) {
      // Just crossed subsidy ceiling
      approachingSlab = {
        isApproaching: true,
        currentSlabLimit: 240,
        nextSlabRate: 5.90,
        unitsRemainingInSlab: 0,
        estimatedDaysRemaining: 0,
        warningMessage: 'You have reached or crossed the 240-unit limit. State subsidies (₹148) are discontinued above 240 units.',
      };
      break;
    }
  }

  // Controllable impact over remaining cycle days (Item 12)
  let reducedHalfUnitSaving = 0;
  let increasedOneUnitCost = 0;

  if (daysRemaining > 0) {
    const reducedUnits = Math.max(currentUnits, Math.round(projectedUnits - (0.5 * daysRemaining)));
    const reducedBill = calculateBill({
      units: reducedUnits,
      billingCycle: input.billingCycle ?? 'bi-monthly',
      phase: input.phase ?? 'single',
      connectedLoadWatts: input.connectedLoadWatts ?? 982,
    });
    reducedHalfUnitSaving = Math.max(0, estimatedBill - reducedBill.total);

    const increasedUnits = Math.round(projectedUnits + (1.0 * daysRemaining));
    const increasedBill = calculateBill({
      units: increasedUnits,
      billingCycle: input.billingCycle ?? 'bi-monthly',
      phase: input.phase ?? 'single',
      connectedLoadWatts: input.connectedLoadWatts ?? 982,
    });
    increasedOneUnitCost = Math.max(0, increasedBill.total - estimatedBill);
  }

  return {
    daysElapsed,
    daysRemaining,
    totalCycleDays,
    currentUnits,
    unitsPerDay,
    projectedUnits,
    estimatedBill,
    likelyRangeMin: minBillResult.total,
    likelyRangeMax: maxBillResult.total,
    confidence,
    confidenceReason,
    approachingSlab,
    controllableImpact: {
      reducedHalfUnitSaving,
      increasedOneUnitCost,
      remainingDays: daysRemaining,
    },
    predictionModelVersion: SITE_CONFIG.predictionModelVersion,
    calculatedBillResult,
  };
}
