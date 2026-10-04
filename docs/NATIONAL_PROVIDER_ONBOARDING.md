# BILLWISE National Provider & Tariff Onboarding Guide

This document defines the strict, authoritative protocol for onboarding new electricity distribution licensees and retail tariffs into BILLWISE.

---

## 1. Architectural Philosophy

1. **Zero UI Duplication:** Adding an electricity provider or tariff schedule **must never require creating a new UI page or modifying React components**. The frontend dynamically queries `src/lib/electricity/api.ts` and renders canonical metadata, slab breakdowns, and itemized calculations.
2. **Authoritative Sources Only:** Tariffs must be sourced directly from gazetted State Electricity Regulatory Commission (SERC) or Joint Electricity Regulatory Commission (JERC) tariff orders. Random third-party blog posts are strictly prohibited.
3. **No Fake Coverage:** A licensee may only be elevated to `coverageStatus: 'FULL'` once an official order is verified, valid tariff rules are configured, build-time mathematical checks pass, and an exact golden bill fixture passes regression testing.

---

## 2. Directory Layout & Key Modules

```text
src/lib/electricity/
├── types.ts                    # Canonical TypeScript interfaces & schemas
├── api.ts                      # Unified data access layer (DAL) for UI & engine
├── regulators/
│   └── index.ts                # SERC/JERC/CERC registry with official portals
├── providers/
│   └── index.ts                # National distribution licensee registry
├── tariffs/
│   └── registry.ts             # Authoritative gazetted tariff packages & slabs
├── engine/
│   └── universalEngine.ts      # Deterministic universal billing engine
├── golden/
│   └── goldenBills.ts          # Golden bill fixtures for regression verification
├── scoring/
│   └── index.ts                # Coverage quality scoring algorithm
├── validation/
│   └── tariffValidator.ts      # Mathematical slab continuity & rule validator
└── detection/
    └── providerDetector.ts     # OCR & regex text signature detection
```

---

## 3. The 6-Step Onboarding Protocol

### Step 1: Register the Regulatory Commission (If Not Present)
File: `src/lib/electricity/regulators/index.ts`

Ensure the state SERC or JERC is registered with official website and order archive URLs:

```typescript
export const REGULATOR_REGISTRY: Record<string, RegulatoryCommission> = {
  // Example:
  kerc: {
    id: 'kerc',
    name: 'Karnataka Electricity Regulatory Commission',
    shortName: 'KERC',
    state: 'Karnataka',
    jurisdictionType: 'STATE',
    website: 'https://kerc.karnataka.gov.in',
    tariffOrdersUrl: 'https://kerc.karnataka.gov.in/tarifforders',
  },
};
```

---

### Step 2: Register Provider Metadata
File: `src/lib/electricity/providers/index.ts`

Add the distribution licensee entry with initial status `CALCULATOR_ONLY` or `UNDER_REVIEW`:

```typescript
bescom: {
  id: 'bescom',
  legalName: 'Bangalore Electricity Supply Company Limited',
  displayName: 'BESCOM (Bangalore)',
  shortName: 'BESCOM',
  aliases: ['Bangalore Electricity', 'BESCOM Karnataka'],
  state: 'Karnataka',
  stateCode: 'KA',
  serviceAreas: ['Bangalore Urban', 'Bangalore Rural', 'Kolar', 'Tumkur'],
  providerType: 'state_discom',
  regulatorId: 'kerc',
  website: 'https://bescom.karnataka.gov.in',
  consumerPortal: 'https://bescom.karnataka.gov.in',
  billingPortal: 'https://bescom.karnataka.gov.in',
  tariffSourceUrl: 'https://kerc.karnataka.gov.in/tarifforders',
  supportLanguages: ['en', 'kn'],
  active: true,
  lastVerified: '2024-06-01',
  verificationStatus: 'verified',
  coverageStatus: 'CALCULATOR_ONLY', // Elevate to FULL only in Step 6
  supportedTariffCategories: ['LT-2(a)'],
  billingCycles: ['MONTHLY'],
  capabilities: {
    supportsMeterReading: true,
    supportsToD: false,
    supportsSolarNetMetering: true,
    supportsDemandCharges: true,
    supportsPrepaid: false,
    supportsPrediction: true,
    supportsBudgetInverse: true,
    supportsSubsidies: true,
    supportsWheelingCharges: false,
  },
  searchKeywords: ['bangalore', 'bengaluru', 'karnataka', 'bescom'],
}
```

---

### Step 3: Model Authoritative Tariff Schedule
File: `src/lib/electricity/tariffs/registry.ts`

Model the gazetted tariff order with exact rates and citation metadata:

```typescript
'bescom-lt2a-2024': {
  id: 'bescom-lt2a-2024',
  providerId: 'bescom',
  regulatorId: 'kerc',
  versionName: 'KERC BESCOM Retail Supply Tariff Order FY 2024-25',
  categoryCode: 'LT-2(a)',
  categoryName: 'Domestic / Residential',
  effectiveFrom: '2024-04-01',
  effectiveTo: null,
  isCurrent: true,
  orderReference: 'KERC Tariff Order for BESCOM FY 2024-25',
  orderDate: '2024-03-28',
  sourceDocumentUrl: 'https://kerc.karnataka.gov.in/tarifforders',
  sourceType: 'SERC_ORDER',
  configVersion: '1.1.0',
  tariffSourceDocuments: [
    {
      title: 'KERC Retail Supply Tariff for BESCOM FY 2024-25',
      orderNumber: 'Case No. 04/2024',
      orderDate: '2024-03-28',
      url: 'https://kerc.karnataka.gov.in/tarifforders',
      sourceType: 'SERC_ORDER',
    },
  ],
  voltageLevel: 'LT',
  supplyPhase: 'any',
  billingCycle: 'MONTHLY',

  // 1. Energy Slabs
  energySlabType: 'TELESCOPIC',
  telescopicSlabs: [
    { minUnits: 0, maxUnits: 100, ratePerUnit: 4.75, label: '0–100 units' },
    { minUnits: 101, maxUnits: null, ratePerUnit: 7.00, label: 'Above 100 units' },
  ],

  // 2. Fixed Charges
  fixedChargeRules: [
    { minUnits: 0, maxUnits: null, amount: 110, basis: 'PER_KW', phase: 'any', perKwAboveThresholdRate: 210 },
  ],

  // 3. Variable Adjustment
  variableAdjustment: {
    name: 'FPPCA (Fuel & Power Purchase Adjustment)',
    ratePerUnit: 0.35,
    type: 'PER_UNIT',
    effectiveFrom: '2024-04-01',
  },

  // 4. Electricity Duty
  dutyRule: {
    type: 'PERCENT_ENERGY',
    rate: 0.09, // 9% Karnataka state duty
    label: 'Karnataka Electricity Duty (9%)',
  },
}
```

---

### Step 4: Add Real Golden Bill Fixture
File: `src/lib/electricity/golden/goldenBills.ts`

Add an exact fixture from a physical electricity bill or audited sample:

```typescript
'golden-bescom-150-monthly': {
  id: 'golden-bescom-150-monthly',
  providerId: 'bescom',
  providerShortName: 'BESCOM',
  state: 'Karnataka',
  description: 'Karnataka Bangalore LT-2(a) monthly bill for 150 units, 2 kW load, FPPCA and 9% state duty',
  billingPeriod: 'Sep 2026 – Oct 2026',
  tariffCode: 'LT-2(a)',
  input: {
    providerId: 'bescom',
    units: 150,
    billingCycle: 'MONTHLY',
    phase: 'single',
    connectedLoadKw: 2,
  },
  expectedComponents: [
    { id: 'energy_charge', name: 'Energy Charges', amount: 825.00 },
    { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 320.00 },
    { id: 'variable_adjustment', name: 'FPPCA (Fuel & Power Purchase Adjustment)', amount: 52.50 },
    { id: 'electricity_duty', name: 'Karnataka Electricity Duty (9%)', amount: 74.25 },
  ],
  expectedTotal: 1272,
  tolerance: 0,
  sourceReference: 'KERC BESCOM Retail Supply Tariff Order FY 2024-25 & Consumer Billing Record',
  verificationDate: '2024-06-01',
}
```

---

### Step 5: Execute Validation and Test Suites

Run the automated test suites to ensure zero mathematical regressions:

```bash
# Run golden bills and tariff integrity tests
npx vitest run tests/golden_bills.test.ts

# Run the complete test suite
npm test

# Run TypeScript compiler verification
npx tsc --noEmit
```

---

### Step 6: Elevate Provider Status to FULL

Once all tests pass:
1. Update `coverageStatus: 'FULL'` in `src/lib/electricity/providers/index.ts`.
2. Inspect the internal dashboard at `/admin/coverage` to confirm quality score >= 80%.
3. Re-run `npm run release-check` to verify complete production readiness.

---

## 4. Modeling Tariff Rules

### Energy Slabs
- `TELESCOPIC`: Consecutive unit blocks (e.g. 0–100, 101–300).
- `NON-TELESCOPIC`: All consumption units billed at a single flat rate determined by the total tier reached.
- `MIXED`: Telescopic up to `telescopicThresholdUnits`, then non-telescopic above (e.g., KSEB 500 units bi-monthly).

### Fixed / Standing Charges
- `basis: 'FLAT'`: Flat standing charge per billing cycle regardless of load.
- `basis: 'PER_KW'`: Load-based charge. If `perKwAboveThresholdRate` is omitted, `fixedCharge = connectedLoadKw * amount`. If provided, tiered (e.g., ₹110 for 1st kW + ₹210 for extra kW).
- `basis: 'SLAB'`: Fixed charge determined by the consumption units tier (e.g., KSEB domestic).

### Statutory Duty Types
- `PERCENT_ENERGY`: State duty applied to energy charges only (e.g. KSEB 10%, BESCOM 9%, PVVNL 5%).
- `PERCENT_TOTAL`: Duty applied to the sum of energy + wheeling + fixed + FAC (e.g. Maharashtra MSEDCL 16%).
- `PER_UNIT`: Fixed paise/unit rate (e.g. Telangana ₹0.06/unit).

### Subsidies
- Automatic Domestic Tariff Subsidies: Set `isOptIn: false` (applied to all qualifying consumers, e.g. KSEB).
- Opt-In Social Welfare Schemes: Set `isOptIn: true` (e.g. Karnataka Gruha Jyothi, Delhi Free Units). These require active opt-in selection by the user.
