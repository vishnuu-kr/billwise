/**
 * Universal Electricity Domain Types for BillWise National Platform
 * Covers retail distribution licensees, regulators, tariffs, and billing across India.
 */

export type CoverageStatus =
  | 'FULL'             // Fully verified with official tariff order, calculations, tests & OCR
  | 'PARTIAL'          // Calculations supported, OCR or advanced tariffs under verification
  | 'CALCULATOR_ONLY'  // Domestic tariff calculator active; bill scan parsing not yet active
  | 'PARSER_ONLY'      // Bill parser active; advanced tariff rules in review
  | 'DETECTION_ONLY'   // Provider recognized by scanner; guided to manual calculator
  | 'UNSUPPORTED'      // Known licensee not yet supported
  | 'UNDER_REVIEW';    // In queue for regulatory verification

export type ProviderType =
  | 'state_discom'
  | 'private_licensee'
  | 'ut_utility'
  | 'municipal_utility'
  | 'other_retail_licensee';

export type UniversalBillingCycle = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY';

export type SupplyPhase = 'single' | 'three' | 'any';

export type VoltageLevel = 'LT' | 'HT' | 'EHT';

export interface ProviderCapabilityFlags {
  supportsMeterReading: boolean;
  supportsToD: boolean;
  supportsSolarNetMetering: boolean;
  supportsDemandCharges: boolean;
  supportsPrepaid: boolean;
  supportsPrediction: boolean;
  supportsBudgetInverse: boolean;
  supportsSubsidies: boolean;
  supportsWheelingCharges: boolean;
}

export interface ElectricityRegulator {
  id: string; // e.g. 'kserc', 'kerc', 'merc', 'derc'
  name: string; // e.g. 'Kerala State Electricity Regulatory Commission'
  shortName: string; // e.g. 'KSERC'
  jurisdiction: string; // e.g. 'Kerala'
  type: 'SERC' | 'JERC' | 'CERC' | 'AUTHORITY';
  website: string;
  tariffPageUrl?: string;
  lastVerified: string; // ISO date 'YYYY-MM-DD'
}

export interface ElectricityProvider {
  id: string; // e.g. 'kseb', 'bescom', 'msedcl'
  legalName: string; // e.g. 'Kerala State Electricity Board Limited'
  displayName: string; // e.g. 'KSEB'
  shortName: string;
  aliases: string[]; // e.g. ['KSEBL', 'Kerala Electricity']
  state: string; // e.g. 'Kerala'
  stateCode: string; // e.g. 'KL'
  unionTerritory?: boolean;
  serviceAreas: string[]; // e.g. ['Kerala statewide']
  providerType: ProviderType;
  regulatorId: string;
  website: string;
  consumerPortal?: string;
  billingPortal?: string;
  tariffSourceUrl: string;
  supportLanguages: string[]; // e.g. ['en', 'ml']
  active: boolean;
  lastVerified: string;
  verificationStatus: 'verified' | 'provisional' | 'unverified';
  coverageStatus: CoverageStatus;
  supportedTariffCategories: string[];
  billingCycles: UniversalBillingCycle[];
  capabilities: ProviderCapabilityFlags;
  searchKeywords: string[];
  sampleBillIdentifierPattern?: string; // Regex pattern string for OCR detection
  tariffSourceDocuments?: TariffSourceDocument[];
}

export interface TariffSourceDocument {
  title: string;
  orderNumber?: string;
  orderDate: string;
  url: string;
  gazetteNotification?: string;
  sourceType: 'SERC_ORDER' | 'JERC_ORDER' | 'DISCOM_SCHEDULE' | 'GOVT_GAZETTE';
}

// ==========================================
// Universal Tariff Specification
// ==========================================

export type EnergySlabType = 'TELESCOPIC' | 'NON_TELESCOPIC' | 'MIXED' | 'FLAT';

export interface EnergySlabRule {
  minUnits: number;
  maxUnits: number | null; // null for open-ended top slab
  ratePerUnit: number; // in INR
  label?: string;
}

export interface FixedChargeRule {
  minUnits?: number;
  maxUnits?: number | null;
  amount: number; // INR per cycle or per basis
  basis: 'FLAT' | 'PER_KW' | 'PER_KVA' | 'SLAB';
  phase?: SupplyPhase;
  perKwAboveThresholdRate?: number;
  perKwAboveThresholdUnits?: number;
}

export interface DemandChargeRule {
  basis: 'CONTRACT_DEMAND_KVA' | 'SANCTIONED_LOAD_KW' | 'RECORDED_DEMAND_KVA' | 'BILLING_DEMAND';
  ratePerUnit: number;
  minimumDemandCharge?: number;
}

export interface DutyRule {
  type: 'PERCENT_ENERGY' | 'PERCENT_TOTAL' | 'PER_UNIT' | 'TIERED';
  rate: number; // e.g. 0.05 for 5%, 0.16 for 16%, or 0.15 for 15 paise/unit
  label: string;
  exemptThresholdUnits?: number;
}

export interface VariableAdjustmentRule {
  name: string; // e.g. 'FAC', 'FPPAS', 'FPPCA', 'PPAC'
  ratePerUnit: number; // e.g. 0.10 for 10 paise/unit
  type: 'PER_UNIT' | 'PERCENT_ENERGY';
  effectiveFrom: string;
  effectiveTo?: string;
  orderReference?: string;
}

export interface SubsidyRule {
  name: string; // e.g. 'Gruha Jyothi', 'Delhi Zero Bill', 'Domestic Tariff Subsidy'
  description: string;
  type: 'FREE_UNITS' | 'DISCOUNT_PER_UNIT' | 'FIXED_DISCOUNT' | 'PERCENT_DISCOUNT';
  maxEligibleUnits?: number;
  freeUnitsAllowance?: number;
  discountPerUnit?: number;
  fixedAmount?: number;
  percentRate?: number;
  isOptIn?: boolean; // If true, only applied when consumer explicitly opts in (e.g. Gruha Jyothi)
}

export interface UniversalTariffVersion {
  id: string; // e.g. 'kseb-lt1a-2024', 'bescom-lt2a-2024'
  providerId: string;
  regulatorId: string;
  versionName: string;
  categoryCode: string; // e.g. 'LT-1A', 'LT-2(a)', 'LT-1'
  categoryName: string; // e.g. 'Domestic / Residential'
  effectiveFrom: string;
  effectiveTo: string | null;
  isCurrent: boolean;
  orderReference: string; // e.g. 'KSERC Order No. OP 18/2023'
  orderDate: string;
  sourceDocumentUrl: string;
  tariffSourceDocuments?: TariffSourceDocument[];
  sourceType?: 'SERC_ORDER' | 'JERC_ORDER' | 'DISCOM_SCHEDULE' | 'GOVT_GAZETTE';
  extractionNotes?: string;
  configVersion?: string;
  notes: string;
  verifiedAt: string;

  voltageLevel: VoltageLevel;
  supplyPhase: SupplyPhase;
  billingCycle: UniversalBillingCycle;

  // Energy charge model
  energySlabType: EnergySlabType;
  telescopicThresholdUnits?: number; // e.g. 250 for KSEB bimonthly
  telescopicSlabs: EnergySlabRule[];
  nonTelescopicSlabs?: EnergySlabRule[];

  // Fixed / Demand charge model
  fixedChargeRules: FixedChargeRule[];
  demandChargeRules?: DemandChargeRule[];

  // Wheeling charges (e.g. MSEDCL has wheeling charges per unit)
  wheelingChargePerUnit?: number;

  // Adjustments & Levies
  variableAdjustment?: VariableAdjustmentRule;
  dutyRule: DutyRule;
  meterRentSinglePhase?: number;
  meterRentThreePhase?: number;
  otherSurcharges?: { name: string; ratePercent?: number; ratePerUnit?: number }[];

  // Subsidies & Rebates
  subsidies?: SubsidyRule[];
  promptPaymentRebatePercent?: number;

  // Minimum monthly / bimonthly charges
  minimumChargePerCycle?: number;
}

// ==========================================
// Universal Calculation & Components
// ==========================================

export type BillComponentCategory =
  | 'ENERGY'
  | 'FIXED'
  | 'DEMAND'
  | 'WHEELING'
  | 'VARIABLE_ADJUSTMENT'
  | 'TAX_DUTY'
  | 'METER_RENT'
  | 'DISCOUNT'
  | 'OTHER';

export interface BillComponent {
  id: string;
  name: string;
  nameLocal?: string;
  category: BillComponentCategory;
  amount: number; // positive for charges, positive magnitude
  rate?: number;
  units?: number;
  basis?: string;
  details?: string;
  isDeduction: boolean; // true for subsidies/rebates subtracted from total
}

export interface UniversalBillInput {
  providerId: string;
  tariffVersionId?: string;
  categoryCode?: string;
  units?: number;
  previousReading?: number;
  presentReading?: number;
  billingCycle: UniversalBillingCycle;
  phase: SupplyPhase;
  connectedLoadKw?: number;
  contractDemandKva?: number;
  readingDate?: string;
  previousReadingDate?: string;
  isMeterReplaced?: boolean;
  oldMeterFinalReading?: number;
  newMeterInitialReading?: number;
  meterDigits?: number;
  solarExportUnits?: number;
  applyOptInSubsidies?: boolean; // For state welfare schemes like Gruha Jyothi or Delhi subsidy
}

export interface UniversalBillResult {
  provider: ElectricityProvider;
  tariff: UniversalTariffVersion;
  inputUnits: number;
  billingCycle: UniversalBillingCycle;
  phase: SupplyPhase;
  connectedLoadKw: number;

  // Itemized dynamic component tree
  components: BillComponent[];

  subtotal: number;
  totalSubsidies: number;
  roundOff: number;
  total: number; // Final payable amount

  // Analytical metrics
  billingDays: number;
  averageUnitsPerDay: number;
  effectiveCostPerUnit: number; // total / inputUnits
  isEstimate: boolean;

  // Explanatory breakdown
  explanation: {
    summary: string;
    summaryLocal?: string;
    primaryDriver: string;
    slabBreakdown: { label: string; units: number; rate: number; amount: number }[];
    dutyDetails: string;
    regulatoryOrderNote: string;
  };

  anomalyStatus?: 'NORMAL' | 'HIGHER_THAN_USUAL' | 'LOWER_THAN_USUAL' | 'TARIFF_CHANGE' | 'NEW_CHARGE';
  warnings: string[];
  regulatoryNotes: string[];
}

// ==========================================
// Phase 11: National Onboarding & Quality Types
// ==========================================

export interface CoverageQualityScore {
  providerId: string;
  dataCoverageScore: number;       // 0 - 100% (sources, documents, metadata)
  calculationCoverageScore: number;// 0 - 100% (slabs, fixed, duty, fac, subsidies)
  scanCoverageScore: number;       // 0 - 100% (regex patterns, parser confidence)
  overallQualityScore: number;     // 0 - 100% weighted composite
  breakdown: {
    hasAuthoritativeSource: boolean;
    hasActiveTariff: boolean;
    hasGoldenBill: boolean;
    hasValidationPassed: boolean;
    hasOcrSignature: boolean;
    supportsPrediction: boolean;
  };
}

export interface GoldenBillFixture {
  id: string;
  providerId: string;
  providerShortName: string;
  state: string;
  description: string;
  billingPeriod: string;
  tariffCode: string;
  input: UniversalBillInput;
  expectedComponents: {
    id: string;
    name: string;
    amount: number;
    isDeduction?: boolean;
  }[];
  expectedTotal: number;
  tolerance: number; // typically 0 or 1 for rupee roundoff
  sourceReference: string;
  verificationDate: string;
}

export interface ProviderSearchOptions {
  state?: string;
  coverageStatus?: CoverageStatus;
  providerType?: ProviderType;
}

export interface ProviderSearchResult {
  provider: ElectricityProvider;
  matchScore: number;
  matchedField: string;
}

export interface NationalCoverageSummary {
  totalProviders: number;
  coveredStates: number;
  coverageCounts: Record<CoverageStatus, number>;
  averageQualityScore: number;
  fullCoverageProviders: string[];
  lastUpdated: string;
}

export interface TariffValidationReport {
  tariffId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
}
