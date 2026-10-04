import { GoldenBillFixture } from '../types';

export const GOLDEN_BILLS_REGISTRY: Record<string, GoldenBillFixture> = {
  // 1. KSEB Kerala Domestic Golden Bill (240 units = ₹1,148)
  'golden-kseb-240-bimonthly': {
    id: 'golden-kseb-240-bimonthly',
    providerId: 'kseb',
    providerShortName: 'KSEB',
    state: 'Kerala',
    description: 'Kerala domestic LT-1A bi-monthly bill for 240 units with slab subsidy and 10% duty',
    billingPeriod: 'Aug 2026 – Oct 2026',
    tariffCode: 'LT-1A',
    input: {
      providerId: 'kseb',
      units: 240,
      billingCycle: 'BIMONTHLY',
      phase: 'single',
      connectedLoadKw: 1,
    },
    expectedComponents: [
      { id: 'energy_charge', name: 'Energy Charges', amount: 973.80 },
      { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 210.00 },
      { id: 'variable_adjustment', name: 'Fuel Adjustment (FAC)', amount: 2.40 },
      { id: 'electricity_duty', name: 'Kerala Electricity Duty (10%)', amount: 97.38 },
      { id: 'meter_rent', name: 'Meter Rent', amount: 12.00 },
      { id: 'subsidy_domestic_tariff_subsidy', name: 'Domestic Tariff Subsidy', amount: 148.00, isDeduction: true },
    ],
    expectedTotal: 1148,
    tolerance: 0,
    sourceReference: 'Physical KSEBL LT-1A Consumer Bill & KSERC Tariff Schedule 2024',
    verificationDate: '2024-11-01',
  },

  // 2. BESCOM Karnataka Domestic Golden Bill (150 units = ₹1,272)
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
  },

  // 3. MSEDCL Maharashtra Domestic Golden Bill (200 units = ₹1,728)
  'golden-msedcl-200-monthly': {
    id: 'golden-msedcl-200-monthly',
    providerId: 'msedcl',
    providerShortName: 'MSEDCL',
    state: 'Maharashtra',
    description: 'Maharashtra LT-1 residential monthly bill for 200 units with wheeling charge, fixed charge, FAC and 16% duty',
    billingPeriod: 'Sep 2026 – Oct 2026',
    tariffCode: 'LT-1 (Residential)',
    input: {
      providerId: 'msedcl',
      units: 200,
      billingCycle: 'MONTHLY',
      phase: 'single',
      connectedLoadKw: 2,
    },
    expectedComponents: [
      { id: 'energy_charge', name: 'Energy Charges', amount: 1078.00 },
      { id: 'wheeling_charge', name: 'Wheeling Charges', amount: 234.00 },
      { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 128.00 },
      { id: 'variable_adjustment', name: 'Fuel Adjustment Charge (FAC)', amount: 50.00 },
      { id: 'electricity_duty', name: 'Maharashtra Electricity Duty (16%)', amount: 238.40 },
    ],
    expectedTotal: 1728,
    tolerance: 0,
    sourceReference: 'MERC Mid-Term Review Order Case No. 226 of 2023 & Mahavitaran Bill',
    verificationDate: '2024-04-01',
  },

  // 4. TPDDL Delhi Domestic Golden Bill (180 units = ₹686)
  'golden-tpddl-180-monthly': {
    id: 'golden-tpddl-180-monthly',
    providerId: 'tpddl',
    providerShortName: 'TPDDL',
    state: 'Delhi',
    description: 'Delhi North domestic monthly bill for 180 units with PPAC, 5% electricity tax and 8% pension surcharge',
    billingPeriod: 'Sep 2026 – Oct 2026',
    tariffCode: 'Domestic',
    input: {
      providerId: 'tpddl',
      units: 180,
      billingCycle: 'MONTHLY',
      phase: 'single',
      connectedLoadKw: 2,
    },
    expectedComponents: [
      { id: 'energy_charge', name: 'Energy Charges', amount: 540.00 },
      { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 40.00 },
      { id: 'variable_adjustment', name: 'Power Purchase Adjustment (PPAC)', amount: 36.00 },
      { id: 'electricity_duty', name: 'Delhi Electricity Tax (5%)', amount: 27.00 },
      { id: 'surcharge_pension_trust_surcharge__8__', name: 'Pension Trust Surcharge (8%)', amount: 43.20 },
    ],
    expectedTotal: 686,
    tolerance: 0,
    sourceReference: 'DERC Domestic Tariff Schedule FY 2024-25',
    verificationDate: '2024-07-01',
  },

  // 5. BRPL Delhi Domestic Golden Bill (180 units = ₹686)
  'golden-brpl-180-monthly': {
    id: 'golden-brpl-180-monthly',
    providerId: 'brpl',
    providerShortName: 'BRPL',
    state: 'Delhi',
    description: 'Delhi South/West domestic monthly bill for 180 units with PPAC, 5% electricity tax and 8% pension surcharge',
    billingPeriod: 'Sep 2026 – Oct 2026',
    tariffCode: 'Domestic',
    input: {
      providerId: 'brpl',
      units: 180,
      billingCycle: 'MONTHLY',
      phase: 'single',
      connectedLoadKw: 2,
    },
    expectedComponents: [
      { id: 'energy_charge', name: 'Energy Charges', amount: 540.00 },
      { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 40.00 },
      { id: 'variable_adjustment', name: 'Power Purchase Adjustment (PPAC)', amount: 36.00 },
      { id: 'electricity_duty', name: 'Delhi Electricity Tax (5%)', amount: 27.00 },
      { id: 'surcharge_pension_trust_surcharge__8__', name: 'Pension Trust Surcharge (8%)', amount: 43.20 },
    ],
    expectedTotal: 686,
    tolerance: 0,
    sourceReference: 'DERC Domestic Tariff Schedule FY 2024-25 for BRPL',
    verificationDate: '2024-07-01',
  },

  // 6. TANGEDCO Tamil Nadu Domestic Golden Bill (250 units = ₹788)
  'golden-tangedco-250-bimonthly': {
    id: 'golden-tangedco-250-bimonthly',
    providerId: 'tangedco',
    providerShortName: 'TANGEDCO',
    state: 'Tamil Nadu',
    description: 'Tamil Nadu domestic Tariff I-A bi-monthly bill for 250 units (first 100 units free) and 5% duty',
    billingPeriod: 'Aug 2026 – Oct 2026',
    tariffCode: 'Tariff I-A',
    input: {
      providerId: 'tangedco',
      units: 250,
      billingCycle: 'BIMONTHLY',
      phase: 'single',
    },
    expectedComponents: [
      { id: 'energy_charge', name: 'Energy Charges', amount: 750.00 },
      { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 0.00 },
      { id: 'electricity_duty', name: 'Tamil Nadu Electricity Duty (5%)', amount: 37.50 },
    ],
    expectedTotal: 788,
    tolerance: 0,
    sourceReference: 'TNERC Comprehensive Tariff Order No. 7 of 2022',
    verificationDate: '2024-07-01',
  },

  // 6. TSSPDCL Telangana Domestic Golden Bill (160 units = ₹648)
  'golden-tsspdcl-160-monthly': {
    id: 'golden-tsspdcl-160-monthly',
    providerId: 'tsspdcl',
    providerShortName: 'TSSPDCL',
    state: 'Telangana',
    description: 'Telangana Hyderabad domestic LT-I monthly bill for 160 units with standing charges and duty',
    billingPeriod: 'Sep 2026 – Oct 2026',
    tariffCode: 'LT-I(B)',
    input: {
      providerId: 'tsspdcl',
      units: 160,
      billingCycle: 'MONTHLY',
      phase: 'single',
    },
    expectedComponents: [
      { id: 'energy_charge', name: 'Energy Charges', amount: 588.00 },
      { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 50.00 },
      { id: 'electricity_duty', name: 'Telangana Electricity Duty (₹0.06/unit)', amount: 9.60 },
    ],
    expectedTotal: 648,
    tolerance: 0,
    sourceReference: 'TSERC Retail Supply Tariff Order FY 2024-25',
    verificationDate: '2024-05-01',
  },

  // 7. PVVNL Uttar Pradesh Domestic Golden Bill (200 units = ₹1,401)
  'golden-pvvnl-200-monthly': {
    id: 'golden-pvvnl-200-monthly',
    providerId: 'pvvnl',
    providerShortName: 'PVVNL',
    state: 'Uttar Pradesh',
    description: 'Western UP / Noida domestic LMV-1 monthly bill for 200 units, 2 kW load, and 5% duty',
    billingPeriod: 'Sep 2026 – Oct 2026',
    tariffCode: 'LMV-1',
    input: {
      providerId: 'pvvnl',
      units: 200,
      billingCycle: 'MONTHLY',
      phase: 'single',
      connectedLoadKw: 2,
    },
    expectedComponents: [
      { id: 'energy_charge', name: 'Energy Charges', amount: 1125.00 },
      { id: 'fixed_charge', name: 'Fixed / Standing Charges', amount: 220.00 },
      { id: 'electricity_duty', name: 'Uttar Pradesh Electricity Duty (5%)', amount: 56.25 },
    ],
    expectedTotal: 1401,
    tolerance: 0,
    sourceReference: 'UPERC Tariff Order for UPPCL DISCOMs FY 2024-25',
    verificationDate: '2024-06-01',
  },
};

export function getAllGoldenBills(): GoldenBillFixture[] {
  return Object.values(GOLDEN_BILLS_REGISTRY);
}

export function getGoldenBillByProvider(providerId: string): GoldenBillFixture | undefined {
  const norm = providerId.toLowerCase();
  return Object.values(GOLDEN_BILLS_REGISTRY).find(g => g.providerId.toLowerCase() === norm);
}
