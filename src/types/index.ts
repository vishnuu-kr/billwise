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
  billingCycle: BillingCycle;
  phase: Phase;
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
