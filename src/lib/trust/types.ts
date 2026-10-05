/**
 * Universal Trust Engine Domain Types for BillWise
 * Enforces evidence integrity, deterministic trace replay, component reconciliation,
 * confidence degradation, and fail-safe calculation states.
 */

export type EvidenceKind =
  | 'KNOWN'       // Directly extracted from the official bill or user explicit input
  | 'CALCULATED'  // Deterministically derived from known inputs via verified tariff order
  | 'ESTIMATED'   // Projected from current/historical pace or cycle model
  | 'UNCERTAIN';  // Insufficient, conflicting, or inferred evidence

export type EvidenceSource =
  | 'bill_ocr_exact'        // Extracted directly with high OCR confidence
  | 'user_manual_input'     // Explicitly confirmed/typed by the consumer
  | 'tariff_rule'           // Canonical SERC/JERC tariff order rule
  | 'computed_derived'      // Arithmetic/logical derivation (e.g. reading diff)
  | 'cycle_projection'      // Daily run-rate projection across cycle days
  | 'baseline_history'      // Historical average baseline
  | 'inferred_default';     // Safe system fallback (e.g. 1-phase default when missing)

export type EvidenceStatus =
  | 'verified'
  | 'user_confirmed'
  | 'inferred'
  | 'estimated'
  | 'ambiguous'
  | 'missing';

export interface EvidenceField<T = unknown> {
  name: string;
  label: string;
  value: T;
  originalValue?: T;
  kind: EvidenceKind;
  source: EvidenceSource;
  confidence: number; // 0.00 to 1.00
  status: EvidenceStatus;
  updatedAt: string;
  notes?: string;
}

export type ConfidenceGrade =
  | 'HIGH_CONFIDENCE'     // Verified provider, verified tariff, verified consumption
  | 'GOOD_CONFIDENCE'     // Minor inference required (e.g. phase default)
  | 'LIMITED_CONFIDENCE'  // Estimated consumption or ambiguous tariff
  | 'CANNOT_VERIFY';      // Missing critical values or conflicting readings

export type FailSafeResultState =
  | 'FULL_RESULT'             // All inputs verified, complete breakdown produced
  | 'PARTIAL_RESULT'          // Safe baseline calculated, missing components flagged
  | 'REVIEW_REQUIRED'         // Plausible but flagged for user verification
  | 'NO_CALCULATION_POSSIBLE'; // Critical inputs missing or contradictory

export interface TraceStep {
  step: number;
  stage: 'INPUT' | 'TARIFF' | 'SLAB' | 'FIXED' | 'VARIABLE' | 'DUTY' | 'SURCHARGE' | 'METER_RENT' | 'SUBSIDY' | 'ROUND_OFF' | 'FINAL';
  label: string;
  inputDescription: string;
  ruleReference: string;
  rateApplied?: number;
  unitsBilled?: number;
  stepAmount: number;
  runningTotal: number;
  isDeduction: boolean;
  notes?: string;
}

export interface CalculationTrace {
  traceId: string;
  timestamp: string;
  engineVersion: string;
  tariffVersionId: string;
  tariffOrderReference: string;
  providerId: string;
  inputSnapshot: {
    units?: number;
    previousReading?: number;
    presentReading?: number;
    phase: string;
    billingCycle: string;
    connectedLoadKw?: number;
    applyOptInSubsidies?: boolean;
    isMeterReplaced?: boolean;
  };
  steps: TraceStep[];
  subtotal: number;
  totalSubsidies: number;
  roundOff: number;
  finalPayable: number;
  isReplayable: boolean;
}

export type ReconciliationStatus =
  | 'MATCH'        // Exact rupee-to-rupee match
  | 'NEAR_MATCH'   // Discrepancy <= ₹1.00 (standard rounding)
  | 'DIFFERENCE'   // Measurable divergence (> ₹1.00)
  | 'UNAVAILABLE'; // Field absent on official bill or calculation

export type ReconciliationDifferenceReason =
  | 'ROUNDING_VARIANCE'
  | 'FAC_VARIANCE'
  | 'METER_RENT_OMITTED_ON_BILL'
  | 'DUTY_BASIS_VARIANCE'
  | 'SUBSIDY_CLIFF_OR_DISALLOWANCE'
  | 'PREVIOUS_ARREARS_ON_BILL'
  | 'PHASE_ASSUMPTION_VARIANCE'
  | 'CONNECTED_LOAD_SLAB_VARIANCE'
  | 'TELESCOPIC_THRESHOLD_SURPASS'
  | 'OTHER_UNATTRIBUTED';

export interface ComponentReconciliationItem {
  componentId: string;
  componentName: string;
  calculatedAmount: number | null;
  officialAmount: number | null;
  difference: number; // calculated - official
  status: ReconciliationStatus;
  reason?: ReconciliationDifferenceReason;
  explanation: string;
}

export interface BillReconciliationReport {
  overallStatus: ReconciliationStatus;
  calculatedTotal: number;
  officialTotal: number;
  totalDifference: number; // calculatedTotal - officialTotal
  dominantReason: ReconciliationDifferenceReason | null;
  dominantExplanation: string;
  isAudited: boolean;
  items: ComponentReconciliationItem[];
}

export interface TrustAssessment {
  grade: ConfidenceGrade;
  resultState: FailSafeResultState;
  overallConfidenceScore: number; // 0.0 to 1.0 (weakest-link derived)
  weakestField: string;
  weakestConfidence: number;
  knownFactsCount: number;
  calculatedCount: number;
  estimatedCount: number;
  uncertainCount: number;
  warnings: string[];
  explanation: string;
}

export interface UserCorrectionProvenance<T = unknown> {
  fieldName: string;
  originalOcrValue?: T;
  correctedValue: T;
  appliedAt: string;
  userConfirmed: boolean;
  reason?: string;
}

export interface CompleteBillEvidenceModel {
  id: string;
  createdAt: string;
  providerId: string;
  tariffVersionId: string;
  assessment: TrustAssessment;
  fields: Record<string, EvidenceField>;
  corrections: UserCorrectionProvenance[];
  trace: CalculationTrace;
  reconciliation?: BillReconciliationReport;
}
