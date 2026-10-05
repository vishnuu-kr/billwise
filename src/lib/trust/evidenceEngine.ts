/**
 * Evidence Model & Trust Gate Engine
 * Implements the 4 Knowledge Categories (KNOWN, CALCULATED, ESTIMATED, UNCERTAIN),
 * strict hierarchy conflict resolution, weakest-link confidence degradation,
 * and fail-safe result gating.
 */

import {
  EvidenceField,
  ConfidenceGrade,
  FailSafeResultState,
  TrustAssessment,
  UserCorrectionProvenance,
  CompleteBillEvidenceModel,
  CalculationTrace,
} from './types';
import { ExtractedBillData, BillCalculationResult, PredictionResult } from '@/types';
import { UniversalBillResult } from '../electricity/types';

interface BuildEvidenceParams {
  providerId: string;
  tariffVersionId?: string;
  extracted?: Partial<ExtractedBillData>;
  calculatedResult?: UniversalBillResult | BillCalculationResult;
  predictionResult?: PredictionResult;
  userCorrections?: UserCorrectionProvenance[];
  rawImageConfidence?: number;
}

/**
 * Builds an immutable, auditable Evidence Model for a bill or prediction.
 */
export function buildBillEvidence(params: BuildEvidenceParams): CompleteBillEvidenceModel {
  const {
    providerId,
    tariffVersionId = 'kseb-lt1a-2024',
    extracted,
    calculatedResult,
    predictionResult,
    userCorrections = [],
    rawImageConfidence = 0.95,
  } = params;

  const fields: Record<string, EvidenceField> = {};
  const now = new Date().toISOString();

  // Helper to check user correction
  const getUserCorrection = (name: string) =>
    userCorrections.find((c) => c.fieldName === name);

  // 1. Provider
  const providerCorrection = getUserCorrection('providerId');
  if (providerCorrection) {
    fields['providerId'] = {
      name: 'providerId',
      label: 'Electricity Licensee',
      value: providerCorrection.correctedValue,
      originalValue: providerCorrection.originalOcrValue ?? providerId,
      kind: 'KNOWN',
      source: 'user_manual_input',
      confidence: 1.0,
      status: 'user_confirmed',
      updatedAt: providerCorrection.appliedAt || now,
      notes: 'Manually verified by user',
    };
  } else {
    fields['providerId'] = {
      name: 'providerId',
      label: 'Electricity Licensee',
      value: providerId,
      kind: 'KNOWN',
      source: 'bill_ocr_exact',
      confidence: Math.min(rawImageConfidence, 0.98),
      status: 'verified',
      updatedAt: now,
      notes: 'Detected from official bill header/format',
    };
  }

  // 2. Tariff Version / Category
  const tariffCorrection = getUserCorrection('tariff');
  const extractedTariff = extracted?.tariff;
  if (tariffCorrection) {
    fields['tariff'] = {
      name: 'tariff',
      label: 'Tariff Schedule',
      value: tariffCorrection.correctedValue,
      originalValue: tariffCorrection.originalOcrValue ?? extractedTariff,
      kind: 'KNOWN',
      source: 'user_manual_input',
      confidence: 1.0,
      status: 'user_confirmed',
      updatedAt: tariffCorrection.appliedAt || now,
    };
  } else if (extractedTariff) {
    const tariffConf = extracted?.fieldConfidences?.tariff ?? (rawImageConfidence * 0.92);
    fields['tariff'] = {
      name: 'tariff',
      label: 'Tariff Schedule',
      value: extractedTariff,
      kind: 'KNOWN',
      source: 'bill_ocr_exact',
      confidence: Number(tariffConf.toFixed(2)),
      status: tariffConf >= 0.75 ? 'verified' : 'ambiguous',
      updatedAt: now,
    };
  } else {
    fields['tariff'] = {
      name: 'tariff',
      label: 'Tariff Schedule',
      value: tariffVersionId,
      kind: 'UNCERTAIN',
      source: 'inferred_default',
      confidence: 0.65,
      status: 'inferred',
      updatedAt: now,
      notes: 'Default domestic tariff applied; not explicitly confirmed on bill scan',
    };
  }

  // 3. Meter Readings & Consumed Units (Strict Hierarchy Resolution)
  const prevCorrection = getUserCorrection('previousReading');
  const presCorrection = getUserCorrection('presentReading');
  const unitsCorrection = getUserCorrection('consumedUnits');

  const ocrPrev = extracted?.previousReading;
  const ocrPres = extracted?.presentReading;
  const ocrUnits = extracted?.consumedUnits;

  // Previous Reading
  if (prevCorrection) {
    fields['previousReading'] = {
      name: 'previousReading',
      label: 'Previous Meter Reading',
      value: Number(prevCorrection.correctedValue),
      originalValue: prevCorrection.originalOcrValue,
      kind: 'KNOWN',
      source: 'user_manual_input',
      confidence: 1.0,
      status: 'user_confirmed',
      updatedAt: prevCorrection.appliedAt || now,
    };
  } else if (typeof ocrPrev === 'number' && !isNaN(ocrPrev)) {
    const conf = extracted?.fieldConfidences?.previousReading ?? (rawImageConfidence * 0.95);
    fields['previousReading'] = {
      name: 'previousReading',
      label: 'Previous Meter Reading',
      value: ocrPrev,
      kind: 'KNOWN',
      source: 'bill_ocr_exact',
      confidence: Number(conf.toFixed(2)),
      status: conf >= 0.7 ? 'verified' : 'ambiguous',
      updatedAt: now,
    };
  }

  // Present Reading
  if (presCorrection) {
    fields['presentReading'] = {
      name: 'presentReading',
      label: 'Present Meter Reading',
      value: Number(presCorrection.correctedValue),
      originalValue: presCorrection.originalOcrValue,
      kind: 'KNOWN',
      source: 'user_manual_input',
      confidence: 1.0,
      status: 'user_confirmed',
      updatedAt: presCorrection.appliedAt || now,
    };
  } else if (typeof ocrPres === 'number' && !isNaN(ocrPres)) {
    const conf = extracted?.fieldConfidences?.presentReading ?? (rawImageConfidence * 0.95);
    fields['presentReading'] = {
      name: 'presentReading',
      label: 'Present Meter Reading',
      value: ocrPres,
      kind: 'KNOWN',
      source: 'bill_ocr_exact',
      confidence: Number(conf.toFixed(2)),
      status: conf >= 0.7 ? 'verified' : 'ambiguous',
      updatedAt: now,
    };
  }

  // Consumed Units Resolution (Priority: User > OCR > Reading Diff)
  if (unitsCorrection) {
    fields['consumedUnits'] = {
      name: 'consumedUnits',
      label: 'Billed Consumption',
      value: Number(unitsCorrection.correctedValue),
      originalValue: unitsCorrection.originalOcrValue,
      kind: 'KNOWN',
      source: 'user_manual_input',
      confidence: 1.0,
      status: 'user_confirmed',
      updatedAt: unitsCorrection.appliedAt || now,
      notes: 'Directly edited by user',
    };
  } else if (typeof ocrUnits === 'number' && !isNaN(ocrUnits)) {
    const conf = extracted?.fieldConfidences?.consumedUnits ?? (rawImageConfidence * 0.96);
    fields['consumedUnits'] = {
      name: 'consumedUnits',
      label: 'Billed Consumption',
      value: ocrUnits,
      kind: 'KNOWN',
      source: 'bill_ocr_exact',
      confidence: Number(conf.toFixed(2)),
      status: conf >= 0.8 ? 'verified' : 'ambiguous',
      updatedAt: now,
      notes: 'Extracted directly from consumption field on bill',
    };
  } else if (
    fields['presentReading']?.value !== undefined &&
    fields['previousReading']?.value !== undefined
  ) {
    const prev = Number(fields['previousReading'].value);
    const pres = Number(fields['presentReading'].value);
    const diff = pres >= prev ? pres - prev : 0;
    const computedConfidence = Number(
      (fields['previousReading'].confidence * fields['presentReading'].confidence).toFixed(2)
    );
    fields['consumedUnits'] = {
      name: 'consumedUnits',
      label: 'Billed Consumption',
      value: diff,
      kind: 'CALCULATED',
      source: 'computed_derived',
      confidence: computedConfidence,
      status: diff > 0 ? 'verified' : 'ambiguous',
      updatedAt: now,
      notes: `Derived arithmetic difference: ${pres} − ${prev} = ${diff} kWh`,
    };
  } else if (predictionResult) {
    fields['consumedUnits'] = {
      name: 'consumedUnits',
      label: 'Projected Consumption',
      value: predictionResult.projectedUnits,
      kind: 'ESTIMATED',
      source: 'cycle_projection',
      confidence: predictionResult.confidence === 'high' ? 0.85 : predictionResult.confidence === 'medium' ? 0.70 : 0.50,
      status: 'estimated',
      updatedAt: now,
      notes: `Run-rate projection based on ${predictionResult.unitsPerDay} units/day pace`,
    };
  }

  // 4. Supply Phase & Connected Load
  const phaseCorrection = getUserCorrection('phase');
  if (phaseCorrection) {
    fields['phase'] = {
      name: 'phase',
      label: 'Supply Phase',
      value: phaseCorrection.correctedValue,
      kind: 'KNOWN',
      source: 'user_manual_input',
      confidence: 1.0,
      status: 'user_confirmed',
      updatedAt: now,
    };
  } else if (extracted?.phase) {
    fields['phase'] = {
      name: 'phase',
      label: 'Supply Phase',
      value: extracted.phase,
      kind: 'KNOWN',
      source: 'bill_ocr_exact',
      confidence: 0.90,
      status: 'verified',
      updatedAt: now,
    };
  } else {
    fields['phase'] = {
      name: 'phase',
      label: 'Supply Phase',
      value: 'single',
      kind: 'UNCERTAIN',
      source: 'inferred_default',
      confidence: 0.70,
      status: 'inferred',
      updatedAt: now,
      notes: 'Defaulted to Single Phase (most common residential connection)',
    };
  }

  // 5. Calculated Breakdown Charges
  if (calculatedResult) {
    const isUniversal = 'components' in calculatedResult;
    const grossEnergy = isUniversal
      ? calculatedResult.components.find((c) => c.category === 'ENERGY')?.amount ?? 0
      : (calculatedResult as BillCalculationResult).grossEnergyCharge;
    const fixedCharge = isUniversal
      ? calculatedResult.components.find((c) => c.category === 'FIXED')?.amount ?? 0
      : (calculatedResult as BillCalculationResult).grossFixedCharge;
    const duty = isUniversal
      ? calculatedResult.components.find((c) => c.category === 'TAX_DUTY')?.amount ?? 0
      : (calculatedResult as BillCalculationResult).electricityDuty;
    const totalPayable = calculatedResult.total;

    fields['energyCharge'] = {
      name: 'energyCharge',
      label: 'Energy Charges',
      value: grossEnergy,
      kind: 'CALCULATED',
      source: 'tariff_rule',
      confidence: 1.0,
      status: 'verified',
      updatedAt: now,
      notes: 'Deterministically computed across applicable tariff slabs',
    };

    fields['fixedCharge'] = {
      name: 'fixedCharge',
      label: 'Standing / Fixed Charges',
      value: fixedCharge,
      kind: 'CALCULATED',
      source: 'tariff_rule',
      confidence: 1.0,
      status: 'verified',
      updatedAt: now,
      notes: 'Computed per official regulatory tariff order schedule',
    };

    fields['duty'] = {
      name: 'duty',
      label: 'Statutory Electricity Duty',
      value: duty,
      kind: 'CALCULATED',
      source: 'tariff_rule',
      confidence: 1.0,
      status: 'verified',
      updatedAt: now,
      notes: 'State statutory rate applied to eligible consumption charge base',
    };

    fields['totalCalculated'] = {
      name: 'totalCalculated',
      label: 'Calculated Bill Total',
      value: totalPayable,
      kind: 'CALCULATED',
      source: 'computed_derived',
      confidence: 1.0,
      status: 'verified',
      updatedAt: now,
      notes: 'Sum of net charges with standard round-off adjustment',
    };
  }

  // 6. Prediction Outputs (ESTIMATED)
  if (predictionResult) {
    fields['predictedTotal'] = {
      name: 'predictedTotal',
      label: 'Estimated Next Bill',
      value: predictionResult.estimatedBill,
      kind: 'ESTIMATED',
      source: 'cycle_projection',
      confidence: predictionResult.confidence === 'high' ? 0.85 : predictionResult.confidence === 'medium' ? 0.70 : 0.50,
      status: 'estimated',
      updatedAt: now,
      notes: `Projection range ₹${predictionResult.likelyRangeMin}–₹${predictionResult.likelyRangeMax}`,
    };
  }

  // 7. Official Bill Total (KNOWN)
  if (extracted?.totalAmount) {
    const totalCorrection = getUserCorrection('totalAmount');
    if (totalCorrection) {
      fields['officialTotal'] = {
        name: 'officialTotal',
        label: 'Official Bill Payable',
        value: Number(totalCorrection.correctedValue),
        originalValue: totalCorrection.originalOcrValue,
        kind: 'KNOWN',
        source: 'user_manual_input',
        confidence: 1.0,
        status: 'user_confirmed',
        updatedAt: totalCorrection.appliedAt || now,
      };
    } else {
      const conf = extracted.fieldConfidences?.totalAmount ?? (rawImageConfidence * 0.98);
      fields['officialTotal'] = {
        name: 'officialTotal',
        label: 'Official Bill Payable',
        value: extracted.totalAmount,
        kind: 'KNOWN',
        source: 'bill_ocr_exact',
        confidence: Number(conf.toFixed(2)),
        status: conf >= 0.85 ? 'verified' : 'ambiguous',
        updatedAt: now,
        notes: 'Payable amount printed on physical or digital bill',
      };
    }
  }

  // Evaluate Trust Gates with the Weakest Link Invariant
  const isPrediction = Boolean(predictionResult && !extracted?.totalAmount);
  const assessment = evaluateTrustGate(fields, isPrediction, extracted);

  // Construct empty or base trace structure if not supplied
  const dummyTrace: CalculationTrace = {
    traceId: `trace-${Date.now()}`,
    timestamp: now,
    engineVersion: '2.1.0',
    tariffVersionId,
    tariffOrderReference: 'KSERC Tariff Order',
    providerId,
    inputSnapshot: {
      units: typeof fields['consumedUnits']?.value === 'number' ? fields['consumedUnits'].value : undefined,
      phase: String(fields['phase']?.value || 'single'),
      billingCycle: 'bi-monthly',
    },
    steps: [],
    subtotal: 0,
    totalSubsidies: 0,
    roundOff: 0,
    finalPayable: typeof fields['totalCalculated']?.value === 'number' ? Number(fields['totalCalculated'].value) : 0,
    isReplayable: true,
  };

  return {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    providerId,
    tariffVersionId,
    assessment,
    fields,
    corrections: userCorrections,
    trace: dummyTrace,
  };
}

/**
 * Evaluates Trust Gates using the Weakest Link Invariant.
 * Critical Rule: Overall confidence = min(critical field confidences).
 * A single 99% confident field CANNOT mask an uncertain or ambiguous critical input.
 */
export function evaluateTrustGate(
  fields: Record<string, EvidenceField>,
  isPrediction = false,
  extracted?: Partial<ExtractedBillData>
): TrustAssessment {
  const warnings: string[] = [];

  // Categorization counts
  let knownCount = 0;
  let calculatedCount = 0;
  let estimatedCount = 0;
  let uncertainCount = 0;

  for (const f of Object.values(fields)) {
    if (f.kind === 'KNOWN') knownCount++;
    else if (f.kind === 'CALCULATED') calculatedCount++;
    else if (f.kind === 'ESTIMATED') estimatedCount++;
    else if (f.kind === 'UNCERTAIN') uncertainCount++;
  }

  // Identify Critical Fields
  const criticalFieldKeys = isPrediction
    ? ['providerId', 'consumedUnits']
    : ['providerId', 'tariff', 'consumedUnits'];

  let weakestField = '';
  let weakestConfidence = 1.0;

  for (const key of criticalFieldKeys) {
    const field = fields[key];
    if (!field) {
      weakestField = key;
      weakestConfidence = 0.0;
      warnings.push(`Critical field "${key}" is missing.`);
      break;
    }

    if (field.confidence < weakestConfidence) {
      weakestConfidence = field.confidence;
      weakestField = key;
    }
  }

  // Check for contradiction between reading difference and extracted units
  if (
    extracted?.consistencyCheck &&
    !extracted.consistencyCheck.isConsistent &&
    extracted.consistencyCheck.extractedUnits !== extracted.consistencyCheck.computedUnits
  ) {
    warnings.push(
      `Discrepancy: Extracted units (${extracted.consistencyCheck.extractedUnits}) != reading difference (${extracted.consistencyCheck.computedUnits}).`
    );
    weakestConfidence = Math.min(weakestConfidence, 0.49);
    weakestField = 'consumedUnits_reading_discrepancy';
  }

  // Phase uncertainty warning
  if (fields['phase']?.kind === 'UNCERTAIN') {
    warnings.push('Supply phase not detected on bill; safely defaulted to Single Phase.');
  }

  // Determine Grade
  let grade: ConfidenceGrade;
  let resultState: FailSafeResultState;
  let explanation: string;

  if (weakestConfidence >= 0.85 && warnings.length === 0) {
    grade = 'HIGH_CONFIDENCE';
    resultState = 'FULL_RESULT';
    explanation = isPrediction
      ? 'High confidence prediction backed by established meter readings.'
      : 'All critical parameters verified directly from the bill.';
  } else if (weakestConfidence >= 0.70) {
    grade = 'GOOD_CONFIDENCE';
    resultState = 'FULL_RESULT';
    explanation = isPrediction
      ? 'Good confidence estimate with minor cycle assumptions.'
      : 'Good confidence result. Minor inferences were applied (e.g. single phase default).';
  } else if (weakestConfidence >= 0.45) {
    grade = 'LIMITED_CONFIDENCE';
    resultState = 'REVIEW_REQUIRED';
    explanation = `Limited confidence due to uncertainty in ${weakestField}. We recommend checking your inputs.`;
  } else {
    grade = 'CANNOT_VERIFY';
    resultState = fields['consumedUnits'] ? 'REVIEW_REQUIRED' : 'NO_CALCULATION_POSSIBLE';
    explanation = `Critical information (${weakestField}) could not be reliably verified. Please check or edit the reading.`;
  }

  return {
    grade,
    resultState,
    overallConfidenceScore: Number(weakestConfidence.toFixed(2)),
    weakestField,
    weakestConfidence: Number(weakestConfidence.toFixed(2)),
    knownFactsCount: knownCount,
    calculatedCount,
    estimatedCount,
    uncertainCount,
    warnings,
    explanation,
  };
}

/**
 * Sacred User Correction Recorder.
 * Preserves OCR original value, sets source to 'user_manual_input',
 * sets confidence to 1.0 (user-confirmed), and appends to provenance log.
 */
export function recordUserCorrection<T = unknown>(
  existingCorrections: UserCorrectionProvenance[],
  fieldName: string,
  correctedValue: T,
  originalOcrValue?: T,
  reason?: string
): UserCorrectionProvenance[] {
  const filtered = existingCorrections.filter((c) => c.fieldName !== fieldName);
  const newProvenance: UserCorrectionProvenance<T> = {
    fieldName,
    originalOcrValue,
    correctedValue,
    appliedAt: new Date().toISOString(),
    userConfirmed: true,
    reason: reason || 'User manual adjustment in UI',
  };
  return [...filtered, newProvenance as UserCorrectionProvenance];
}
