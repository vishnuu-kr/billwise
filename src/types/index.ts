export type Phase = 'single' | 'three';
export type BillingCycle = 'bi-monthly' | 'monthly';
export type TariffCategory = 'LT-1A' | 'LT-1B';

export interface TariffSlab {
  minUnits: number;
  maxUnits: number | null; // null represents infinity / no upper limit
  ratePerUnit: number; // in Rupees
  isTelescopic: boolean;
}

export interface FixedChargeBracket {
  minUnits: number;
  maxUnits: number | null;
  charge: number; // in Rupees per billing cycle
  perKwAbove?: number; // for loads > 500 units or commercial
}

export interface TariffSubsidies {
  eligibleMaxUnitsBiMonthly: number; // e.g. 240 units
  fixedChargeSubsidy: number; // e.g. ₹40
  energySubsidyPerUnit?: number; // e.g. ₹0.45 per unit
  energySubsidyMaxAmount: number; // e.g. ₹108
}

export interface TariffVersion {
  id: string;
  versionName: string;
  effectiveFrom: string; // ISO date 'YYYY-MM-DD'
  effectiveTo: string | null;
  isCurrent: boolean;
  notes: string;
  sourceDocument: string;
  
  // Telescopic Slabs (for consumers <= 500 units bi-monthly or <= 250 monthly)
  telescopicSlabsBiMonthly: TariffSlab[];
  telescopicSlabsMonthly: TariffSlab[];
  
  // Non-telescopic Slabs (for consumers > 500 units bi-monthly or > 250 monthly)
  nonTelescopicSlabsBiMonthly: TariffSlab[];
  nonTelescopicSlabsMonthly: TariffSlab[];
  
  // Fixed charges
  singlePhaseFixedChargesBiMonthly: FixedChargeBracket[];
  threePhaseFixedChargesBiMonthly: FixedChargeBracket[];
  singlePhaseFixedChargesMonthly: FixedChargeBracket[];
  threePhaseFixedChargesMonthly: FixedChargeBracket[];
  
  // Other standard KSEB levies
  electricityDutyRate: number; // 0.10 for 10%
  fuelAdjustmentRatePerUnit: number; // e.g. 0.01 (1 paisa/unit in sample bill)
  meterRentSinglePhase: number; // ₹12.00
  meterRentThreePhase: number; // ₹30.00
  subsidies: TariffSubsidies;
}

export interface BillInput {
  units?: number;
  previousReading?: number;
  presentReading?: number;
  billingCycle?: BillingCycle;
  phase?: Phase;
  connectedLoadWatts?: number;
  readingDate?: string;
  previousReadingDate?: string;
  tariffVersionId?: string;
  // Meter replacement support
  isMeterReplaced?: boolean;
  oldMeterFinalReading?: number;
  newMeterInitialReading?: number;
  // Rollover support
  meterDigits?: number; // e.g. 5 digits (99999 -> 00001)
}

export interface SlabCalculationDetail {
  slabIndex: number;
  label: string;
  minUnits: number;
  maxUnits: number | null;
  unitsBilled: number;
  ratePerUnit: number;
  amount: number;
}

export interface CalculationTraceStep {
  step: number;
  component: string;
  basis: string;
  rate?: number;
  units?: number;
  amount: number;
  runningTotal: number;
  formula: string;
}

export interface BillCalculationResult {
  units: number;
  billingCycle: BillingCycle;
  phase: Phase;
  connectedLoadWatts: number;
  
  // Cost breakdown
  grossEnergyCharge: number;
  energySubsidy: number;
  netEnergyCharge: number;
  
  grossFixedCharge: number;
  fixedChargeSubsidy: number;
  netFixedCharge: number;
  
  fuelAdjustment: number;
  electricityDuty: number;
  meterRent: number;
  totalSubsidies: number;
  
  subtotal: number;
  roundOff: number;
  total: number;
  
  // Explanation & metadata
  isTelescopicApplied: boolean;
  effectiveTariffVersion: string;
  calculationEngineVersion: string;
  slabBreakdown: SlabCalculationDetail[];
  explanation: {
    summary: string;
    energySharePct: number;
    subsidyBenefitText: string;
    dutyExplanation: string;
    formulaSummary: string;
  };
  isEstimate: boolean;
  discrepancyNote?: string;
  trace?: CalculationTraceStep[];
}

export type BaselineStatus = 'NO_BASELINE' | 'LIMITED_BASELINE' | 'ESTABLISHED_BASELINE';

export interface BaselineEvaluation {
  status: BaselineStatus;
  sampleCount: number;
  averageUnits: number;
  averageBill: number;
  descriptionEn: string;
  descriptionMl: string;
}

export type AnomalySeverity = 'NORMAL' | 'CHECK' | 'UNUSUAL';

export interface AnomalyReport {
  status: AnomalySeverity;
  reasonEn: string;
  reasonMl: string;
  deviationPercent: number;
  dominantDriver: string;
}

export interface PredictionInput {
  currentReading?: number;
  previousReading?: number;
  daysElapsed: number; // e.g. 17 days
  totalCycleDays?: number; // default 60 for bi-monthly
  currentCycleUnits?: number; // if entered directly
  historicalAverageUnits?: number;
  phase?: Phase;
  billingCycle?: BillingCycle;
  connectedLoadWatts?: number;
}

export interface PredictionResult {
  daysElapsed: number;
  daysRemaining: number;
  totalCycleDays: number;
  currentUnits: number;
  unitsPerDay: number;
  projectedUnits: number;
  
  estimatedBill: number;
  likelyRangeMin: number;
  likelyRangeMax: number;
  
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
  
  approachingSlab: {
    isApproaching: boolean;
    currentSlabLimit: number;
    nextSlabRate: number;
    unitsRemainingInSlab: number;
    estimatedDaysRemaining: number | null;
    warningMessage: string;
  } | null;
  
  // Real controllable impact calculations (Item 12)
  controllableImpact?: {
    reducedHalfUnitSaving: number; // if user saves 0.5 units/day
    increasedOneUnitCost: number;  // if user uses 1.0 unit/day more
    remainingDays: number;
  };

  predictionModelVersion: string;
  calculatedBillResult: BillCalculationResult;
}

export interface ExtractedBillData {
  billingPeriod: string;
  billDate: string;
  dueDate: string;
  tariff: string;
  purpose: string;
  phase: Phase;
  billingCycle: BillingCycle;
  previousReading: number;
  presentReading: number;
  consumedUnits: number;
  connectedLoadWatts: number;
  fixedCharge: number;
  energyCharge: number;
  duty: number;
  fuelAdjustment: number;
  meterRent: number;
  subsidy: number;
  totalAmount: number;
  confidence: number;
  fieldConfidences: Record<string, number>;
  sourceFile?: string;
  
  // Verification and Bill Type Detection (Items 7 & 8)
  consistencyCheck?: {
    isConsistent: boolean;
    computedUnits: number;
    extractedUnits: number;
    warningMessage?: string;
  };
  isSupportedBillType: boolean;
  unsupportedReason?: string;
  meterType?: 'electronic_static' | 'smart_tod' | 'mechanical';
}

export interface MeterScanResult {
  detectedReading: number | null;
  confidence: number;
  rawText: string;
  status: 'success' | 'low_confidence' | 'failed';
  message: string;
}

export interface BillDifferenceBreakdown {
  previousBillTotal: number;
  currentBillTotal: number;
  differenceAmount: number;
  isIncrease: boolean;
  percentageChange: number;
  previousUnits: number;
  currentUnits: number;
  unitsDifference: number;
  
  // Categorized rupee drivers
  usageImpactAmount: number;
  fixedChargeImpactAmount: number;
  dutyImpactAmount: number;
  subsidyImpactAmount: number;
  adjustmentsImpactAmount: number;
  
  primaryDriver: string;
  primaryDriverMl: string;
  explanationText: string;
  explanationTextMl: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  dateLabel: string;
  meterReading?: number;
  consumedUnits: number;
  projectedUnits?: number;
  predictedBill: number;
  actualBill?: number;
  billingCycle: BillingCycle;
  source: 'scan' | 'manual' | 'prediction' | 'reading';
  tariffVersionId?: string;
  calculationEngineVersion?: string;
  predictionModelVersion?: string;
  notes?: string;
}

export interface ApplianceItem {
  id: string;
  name: string;
  nameMl: string;
  category: 'cooling' | 'heating' | 'kitchen' | 'entertainment' | 'work' | 'other';
  typicalWatts: number;
  userWatts: number;
  hoursPerDay: number;
  daysPerMonth: number;
  quantity: number;
  iconName: string;
}

export interface BudgetConfig {
  monthlyTargetRupees: number;
  billingCycleTargetRupees: number;
  createdDate: string;
}

export type SupportedLanguage = 'en' | 'ml';

// ==========================================
// Phase 4: Production Reconciliation & Hardening Types
// ==========================================

export interface ActualBillBreakdown {
  grossEnergyCharge?: number;
  grossFixedCharge?: number;
  electricityDuty?: number;
  fuelAdjustment?: number;
  meterRent?: number;
  totalSubsidies?: number;
  roundOff?: number;
  total: number;
}

export interface ComponentReconciliationItem {
  componentKey: 'energy' | 'fixed' | 'duty' | 'fac' | 'rent' | 'subsidy' | 'roundoff' | 'total';
  nameEn: string;
  nameMl: string;
  calculatedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  isMatch: boolean;
  explanationEn: string;
  explanationMl: string;
}

export interface BillReconciliationResult {
  calculatedTotal: number;
  actualTotal: number;
  totalDifference: number;
  isExactMatch: boolean;
  components: ComponentReconciliationItem[];
  primaryVarianceInsight: string;
  primaryVarianceInsightMl: string;
}

export interface InputSanityReport {
  isPlausible: boolean;
  warningLevel: 'none' | 'info' | 'warning' | 'error';
  warningMessage?: string;
  warningMessageMl?: string;
}

export interface SavedHomeProfile {
  id: string;
  name?: string;
  providerId?: string;
  providerName?: string;
  providerShortName?: string;
  state?: string;
  billingCycle: BillingCycle;
  tariff: string;
  phase: Phase;
  connectedLoadWatts?: number;
  lastBillAmount?: number;
  lastBillUnits?: number;
  lastBillDate?: string;
  lastReading: number;
  lastReadingDate: string;
  currentReading?: number;
  currentReadingDate?: string;
  latestPrediction?: {
    estimatedBill: number;
    likelyRangeMin: number;
    likelyRangeMax: number;
    projectedUnits: number;
    unitsPerDay: number;
    daysElapsed: number;
    daysRemaining: number;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CycleComparisonDetail {
  prevUnits: number;
  currUnits: number;
  unitsDiff: number;
  prevBill: number;
  currBill: number;
  billDiff: number;
  energyImpact: number;
  fixedImpact: number;
  dutyImpact: number;
  subsidyImpact: number;
  fuelAndRentImpact: number;
  isIncrease: boolean;
  percentageChange: number;
}

export interface TariffVersionValidationResult {
  isValid: boolean;
  errors: string[];
}

export type AnalyticsEventName =
  | 'scan_started'
  | 'scan_completed'
  | 'scan_failed'
  | 'ocr_corrected'
  | 'meter_scan_started'
  | 'meter_scan_completed'
  | 'prediction_generated'
  | 'first_prediction'
  | 'home_saved'
  | 'reading_updated'
  | 'actual_bill_recorded'
  | 'prediction_compared'
  | 'repeat_visit'
  | 'manual_calculation'
  | 'manual_entry'
  | 'what_if_used'
  | 'budget_used'
  | 'history_recorded'
  | 'history_viewed'
  | 'language_changed'
  | 'page_visit'
  | 'app_opened'
  | 'flow_started'
  | 'result_viewed'
  | 'share_clicked'
  | 'prediction_feedback'
  | 'feedback_submitted'
  | 'onboarding_started'
  | 'onboarding_dismissed'
  | 'onboarding_completed';

// ==========================================
// Phase 5: Public Beta, Feedback & Funnel Types
// ==========================================

export type UserFeedbackCategory =
  | 'too_high'
  | 'too_low'
  | 'explanation_unclear'
  | 'scanner_error'
  | 'tariff_query'
  | 'other';

export interface UserFeedbackRecord {
  id: string;
  timestamp: string;
  context: 'prediction_result' | 'history_actual_bill' | 'scanner' | 'general';
  sentiment: 'positive' | 'negative' | 'neutral';
  category?: UserFeedbackCategory;
  comment?: string;
  accuracyRating?: 'accurate' | 'too_high' | 'too_low';
  units?: number;
  predictedBill?: number;
  actualBill?: number;
}

export interface FeedbackSummaryStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  helpfulRatioPct: number;
  categoryBreakdown: Record<string, number>;
  accuracyRatings: {
    accurate: number;
    too_high: number;
    too_low: number;
  };
}

export interface FunnelStageMetric {
  stage: string;
  label: string;
  count: number;
  conversionFromPrevious: number; // 0 - 100%
  overallConversion: number; // 0 - 100%
}

export interface FunnelAnalysis {
  totalVisitors: number;
  stages: FunnelStageMetric[];
  highestDropOffStage: string;
}

export interface TariffDiffItem {
  category: 'telescopic_energy' | 'non_telescopic_energy' | 'fixed_charge' | 'levy_subsidy';
  label: string;
  unitRange?: string;
  baseValue: number;
  comparedValue: number;
  delta: number;
  percentageDelta: number;
  formattedDelta: string;
}

