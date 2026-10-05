import { UniversalTariffVersion } from '../types';

export const UNIVERSAL_TARIFF_REGISTRY: Record<string, UniversalTariffVersion> = {
  // ==========================================
  // KSEB — Kerala State Electricity Board
  // ==========================================
  'kseb-lt1a-2024': {
    id: 'kseb-lt1a-2024',
    providerId: 'kseb',
    regulatorId: 'kserc',
    versionName: 'KSERC Domestic LT-1A Schedule 2024',
    categoryCode: 'LT-1A',
    categoryName: 'Domestic / Residential',
    effectiveFrom: '2024-11-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'KSERC Tariff Order OP No. 18/2023',
    orderDate: '2024-10-31',
    sourceDocumentUrl: 'https://erckerala.org/tariff-orders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.2.0',
    extractionNotes: 'Verified against Kerala Gazette extraordinary notification and physical LT-1A bills.',
    tariffSourceDocuments: [
      {
        title: 'KSERC Schedule of Tariff for Retail Supply of Electricity by KSEBL',
        orderNumber: 'OP No. 18/2023',
        orderDate: '2024-10-31',
        url: 'https://erckerala.org/tariff-orders',
        sourceType: 'SERC_ORDER',
      },
    ],
    notes: 'KSERC gazetted domestic LT-1A bimonthly telescopic schedule with 10% energy duty and low-income slab subsidies.',
    verifiedAt: '2024-11-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'BIMONTHLY',

    energySlabType: 'MIXED', // Telescopic <= 500 units bi-monthly; non-telescopic > 500 units
    telescopicThresholdUnits: 500,
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 80, ratePerUnit: 3.25, label: '0–80 units' },
      { minUnits: 81, maxUnits: 160, ratePerUnit: 4.05, label: '81–160 units' },
      { minUnits: 161, maxUnits: 200, ratePerUnit: 4.90, label: '161–200 units' },
      { minUnits: 201, maxUnits: 250, ratePerUnit: 4.845, label: '201–250 units' },
      { minUnits: 251, maxUnits: 300, ratePerUnit: 5.90, label: '251–300 units' },
      { minUnits: 301, maxUnits: 400, ratePerUnit: 6.80, label: '301–400 units' },
      { minUnits: 401, maxUnits: 500, ratePerUnit: 7.60, label: '401–500 units' },
    ],
    nonTelescopicSlabs: [
      { minUnits: 501, maxUnits: 600, ratePerUnit: 6.60, label: '501–600 units' },
      { minUnits: 601, maxUnits: 700, ratePerUnit: 7.30, label: '601–700 units' },
      { minUnits: 701, maxUnits: 800, ratePerUnit: 7.90, label: '701–800 units' },
      { minUnits: 801, maxUnits: 1000, ratePerUnit: 8.80, label: '801–1000 units' },
      { minUnits: 1001, maxUnits: null, ratePerUnit: 9.90, label: 'Above 1000 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: 80, amount: 70, basis: 'SLAB', phase: 'single' },
      { minUnits: 81, maxUnits: 160, amount: 120, basis: 'SLAB', phase: 'single' },
      { minUnits: 161, maxUnits: 200, amount: 160, basis: 'SLAB', phase: 'single' },
      { minUnits: 201, maxUnits: 240, amount: 210, basis: 'SLAB', phase: 'single' },
      { minUnits: 241, maxUnits: 300, amount: 260, basis: 'SLAB', phase: 'single' },
      { minUnits: 301, maxUnits: 400, amount: 320, basis: 'SLAB', phase: 'single' },
      { minUnits: 401, maxUnits: 500, amount: 380, basis: 'SLAB', phase: 'single' },
      { minUnits: 501, maxUnits: null, amount: 440, basis: 'SLAB', phase: 'single', perKwAboveThresholdRate: 150 },

      { minUnits: 0, maxUnits: 160, amount: 200, basis: 'SLAB', phase: 'three' },
      { minUnits: 161, maxUnits: 240, amount: 260, basis: 'SLAB', phase: 'three' },
      { minUnits: 241, maxUnits: 350, amount: 350, basis: 'SLAB', phase: 'three' },
      { minUnits: 351, maxUnits: 500, amount: 450, basis: 'SLAB', phase: 'three' },
      { minUnits: 501, maxUnits: null, amount: 550, basis: 'SLAB', phase: 'three', perKwAboveThresholdRate: 180 },
    ],

    variableAdjustment: {
      name: 'Fuel Adjustment (FAC)',
      ratePerUnit: 0.01,
      type: 'PER_UNIT',
      effectiveFrom: '2024-11-01',
      orderReference: 'KSERC Fuel Surcharge Order',
    },

    dutyRule: {
      type: 'PERCENT_ENERGY',
      rate: 0.10, // 10% on energy charge
      label: 'Kerala Electricity Duty (10%)',
    },

    meterRentSinglePhase: 12.00,
    meterRentThreePhase: 30.00,

    subsidies: [
      {
        name: 'Domestic Tariff Subsidy',
        description: 'Kerala State Government subsidy for consumers using up to 240 units bi-monthly.',
        type: 'FIXED_DISCOUNT',
        maxEligibleUnits: 240,
        fixedAmount: 148.00,
      },
    ],
  },

  // ==========================================
  // BESCOM — Bangalore Electricity Supply Company
  // ==========================================
  'bescom-lt2a-2024': {
    id: 'bescom-lt2a-2024',
    providerId: 'bescom',
    regulatorId: 'kerc',
    versionName: 'KERC BESCOM Domestic LT-2(a) Tariff FY 2024-25',
    categoryCode: 'LT-2(a)',
    categoryName: 'Domestic Lighting & Power',
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'KERC Tariff Order for BESCOM FY 2024-25',
    orderDate: '2024-03-28',
    sourceDocumentUrl: 'https://kerc.karnataka.gov.in/tarifforders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.1.0',
    extractionNotes: 'KERC approved single-tier telescopic slabs with load-linked fixed charges and 9% statutory duty.',
    tariffSourceDocuments: [
      {
        title: 'KERC Retail Supply Tariff Revision for Electricity Supply Companies',
        orderNumber: 'BESCOM Tariff Order 2024',
        orderDate: '2024-03-28',
        url: 'https://kerc.karnataka.gov.in/tarifforders',
        sourceType: 'SERC_ORDER',
      },
    ],
    notes: 'KERC approved domestic LT-2(a) monthly telescopic slabs with load-based fixed charges, 9% state duty, and FPPCA.',
    verifiedAt: '2024-06-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'MONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 100, ratePerUnit: 4.75, label: '0–100 units' },
      { minUnits: 101, maxUnits: null, ratePerUnit: 7.00, label: 'Above 100 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 110, basis: 'PER_KW', phase: 'any', perKwAboveThresholdRate: 210 },
    ],

    variableAdjustment: {
      name: 'FPPCA (Fuel & Power Purchase Adjustment)',
      ratePerUnit: 0.35,
      type: 'PER_UNIT',
      effectiveFrom: '2024-04-01',
      orderReference: 'KERC FPPCA Periodic Notification',
    },

    dutyRule: {
      type: 'PERCENT_ENERGY',
      rate: 0.09, // 9% under Karnataka Electricity Duty Act
      label: 'Karnataka Electricity Duty (9%)',
    },

    meterRentSinglePhase: 0,
    meterRentThreePhase: 0,

    subsidies: [
      {
        name: 'Gruha Jyothi Scheme',
        description: 'Government of Karnataka free power scheme up to consumer entitled quota (max 200 units).',
        type: 'FREE_UNITS',
        maxEligibleUnits: 200,
        freeUnitsAllowance: 200,
        isOptIn: true,
      },
    ],
  },

  // ==========================================
  // MSEDCL — Maharashtra State Electricity Distribution Co Ltd
  // ==========================================
  'msedcl-lt1-2024': {
    id: 'msedcl-lt1-2024',
    providerId: 'msedcl',
    regulatorId: 'merc',
    versionName: 'MERC MSEDCL Domestic LT-1 Tariff Schedule',
    categoryCode: 'LT-1 (Residential)',
    categoryName: 'Residential / Domestic Supply',
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'MERC Order in Case No. 226 of 2023',
    orderDate: '2024-03-31',
    sourceDocumentUrl: 'https://www.merc.gov.in/orders-fac-orders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.1.0',
    extractionNotes: 'Verified against MERC Multi-Year Tariff Schedule with separate wheeling charge of ₹1.17/unit and 16% Maharashtra electricity duty.',
    tariffSourceDocuments: [
      {
        title: 'MERC Mid-Term Review Order for MSEDCL',
        orderNumber: 'Case No. 226 of 2023',
        orderDate: '2024-03-31',
        url: 'https://www.merc.gov.in/orders-fac-orders',
        sourceType: 'SERC_ORDER',
      },
    ],
    notes: 'MERC approved multi-year tariff for MSEDCL LT-1 residential including separate wheeling charge of ₹1.17/unit and 16% Maharashtra electricity duty.',
    verifiedAt: '2024-04-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'MONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 100, ratePerUnit: 3.44, label: '0–100 units' },
      { minUnits: 101, maxUnits: 300, ratePerUnit: 7.34, label: '101–300 units' },
      { minUnits: 301, maxUnits: 500, ratePerUnit: 10.36, label: '301–500 units' },
      { minUnits: 501, maxUnits: null, ratePerUnit: 11.82, label: 'Above 500 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 128.00, basis: 'FLAT', phase: 'single' },
      { minUnits: 0, maxUnits: null, amount: 440.00, basis: 'FLAT', phase: 'three' },
    ],

    wheelingChargePerUnit: 1.17, // Wheeling charges in MSEDCL bill

    variableAdjustment: {
      name: 'Fuel Adjustment Charge (FAC)',
      ratePerUnit: 0.25,
      type: 'PER_UNIT',
      effectiveFrom: '2024-04-01',
      orderReference: 'MERC FAC Notification',
    },

    dutyRule: {
      type: 'PERCENT_TOTAL', // Maharashtra duty is 16% on total electricity charges (energy + wheeling + fixed + FAC)
      rate: 0.16,
      label: 'Maharashtra Electricity Duty (16%)',
    },

    meterRentSinglePhase: 0,
    meterRentThreePhase: 0,
  },

  // ==========================================
  // TPDDL — Tata Power Delhi Distribution Limited
  // ==========================================
  'tpddl-domestic-2024': {
    id: 'tpddl-domestic-2024',
    providerId: 'tpddl',
    regulatorId: 'derc',
    versionName: 'DERC Domestic Tariff Schedule FY 2024-25',
    categoryCode: 'Domestic',
    categoryName: 'Domestic Lighting & Power',
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'DERC Tariff Order FY 2024-25',
    orderDate: '2024-03-31',
    sourceDocumentUrl: 'https://www.derc.gov.in/tarifforders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.0.0',
    notes: 'DERC approved domestic tariff with 5% electricity duty and 8% pension trust surcharge.',
    verifiedAt: '2024-07-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'MONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 200, ratePerUnit: 3.00, label: '0–200 units' },
      { minUnits: 201, maxUnits: 400, ratePerUnit: 4.50, label: '201–400 units' },
      { minUnits: 401, maxUnits: 800, ratePerUnit: 6.50, label: '401–800 units' },
      { minUnits: 801, maxUnits: 1200, ratePerUnit: 7.00, label: '801–1200 units' },
      { minUnits: 1201, maxUnits: null, ratePerUnit: 8.00, label: 'Above 1200 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 20.00, basis: 'PER_KW', phase: 'any' },
    ],

    variableAdjustment: {
      name: 'Power Purchase Adjustment (PPAC)',
      ratePerUnit: 0.20,
      type: 'PER_UNIT',
      effectiveFrom: '2024-04-01',
    },

    dutyRule: {
      type: 'PERCENT_ENERGY',
      rate: 0.05, // 5% Delhi electricity tax
      label: 'Delhi Electricity Tax (5%)',
    },

    otherSurcharges: [
      { name: 'Pension Trust Surcharge (8%)', ratePercent: 0.08 },
    ],

    subsidies: [
      {
        name: 'Delhi Free Electricity Scheme',
        description: '100% subsidy for consumers using up to 200 units/month; 50% subsidy up to ₹800 for 201–400 units.',
        type: 'FREE_UNITS',
        maxEligibleUnits: 200,
        freeUnitsAllowance: 200,
        isOptIn: true,
      },
    ],
  },

  // ==========================================
  // BRPL — BSES Rajdhani Power Limited
  // ==========================================
  'brpl-domestic-2024': {
    id: 'brpl-domestic-2024',
    providerId: 'brpl',
    regulatorId: 'derc',
    versionName: 'DERC BRPL Domestic Tariff Schedule FY 2024-25',
    categoryCode: 'Domestic',
    categoryName: 'Domestic Lighting & Power',
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'DERC Tariff Order FY 2024-25',
    orderDate: '2024-03-31',
    sourceDocumentUrl: 'https://www.derc.gov.in/tarifforders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.0.0',
    notes: 'DERC unified domestic tariff for South and West Delhi with 5% electricity tax and 8% pension surcharge.',
    verifiedAt: '2024-07-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'MONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 200, ratePerUnit: 3.00, label: '0–200 units' },
      { minUnits: 201, maxUnits: 400, ratePerUnit: 4.50, label: '201–400 units' },
      { minUnits: 401, maxUnits: 800, ratePerUnit: 6.50, label: '401–800 units' },
      { minUnits: 801, maxUnits: 1200, ratePerUnit: 7.00, label: '801–1200 units' },
      { minUnits: 1201, maxUnits: null, ratePerUnit: 8.00, label: 'Above 1200 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 20.00, basis: 'PER_KW', phase: 'any' },
    ],

    variableAdjustment: {
      name: 'Power Purchase Adjustment (PPAC)',
      ratePerUnit: 0.20,
      type: 'PER_UNIT',
      effectiveFrom: '2024-04-01',
    },

    dutyRule: {
      type: 'PERCENT_ENERGY',
      rate: 0.05,
      label: 'Delhi Electricity Tax (5%)',
    },

    otherSurcharges: [
      { name: 'Pension Trust Surcharge (8%)', ratePercent: 0.08 },
    ],

    subsidies: [
      {
        name: 'Delhi Free Electricity Scheme',
        description: '100% subsidy for consumers using up to 200 units/month.',
        type: 'FREE_UNITS',
        maxEligibleUnits: 200,
        freeUnitsAllowance: 200,
        isOptIn: true,
      },
    ],
  },

  // ==========================================
  // TANGEDCO — Tamil Nadu Power Distribution Corp Ltd
  // ==========================================
  'tangedco-ia-2024': {
    id: 'tangedco-ia-2024',
    providerId: 'tangedco',
    regulatorId: 'tnerc',
    versionName: 'TNERC Domestic Tariff I-A Schedule',
    categoryCode: 'Tariff I-A',
    categoryName: 'Domestic Lighting & Power',
    effectiveFrom: '2024-07-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'TNERC Comprehensive Tariff Order No. 7 of 2022 & 2024 Escalation',
    orderDate: '2024-06-30',
    sourceDocumentUrl: 'https://www.tnerc.gov.in/orders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.0.0',
    extractionNotes: 'TNERC bi-monthly domestic tariff. 0-100 units free by Tamil Nadu Govt policy. Fixed charges abolished for LT domestic.',
    tariffSourceDocuments: [
      {
        title: 'TNERC Determination of Tariff for Retail Supply of Electricity by TANGEDCO',
        orderNumber: 'Order No. 7 of 2022',
        orderDate: '2022-09-09',
        url: 'https://www.tnerc.gov.in/orders',
        sourceType: 'SERC_ORDER',
      },
    ],
    notes: 'Tamil Nadu bi-monthly domestic tariff. 100 free units subsidy provided by State Govt, 5% electricity duty.',
    verifiedAt: '2024-07-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'BIMONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 100, ratePerUnit: 0.00, label: '0–100 units (Free)' },
      { minUnits: 101, maxUnits: 200, ratePerUnit: 4.50, label: '101–200 units' },
      { minUnits: 201, maxUnits: 400, ratePerUnit: 6.00, label: '201–400 units' },
      { minUnits: 401, maxUnits: 500, ratePerUnit: 8.00, label: '401–500 units' },
      { minUnits: 501, maxUnits: null, ratePerUnit: 9.00, label: 'Above 500 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 0, basis: 'FLAT', phase: 'any' }, // Zero fixed charge in TN
    ],

    dutyRule: {
      type: 'PERCENT_ENERGY',
      rate: 0.05, // 5% under Tamil Nadu Electricity Duty Act
      label: 'Tamil Nadu Electricity Duty (5%)',
    },

    meterRentSinglePhase: 0,
    meterRentThreePhase: 0,
  },

  // ==========================================
  // TSSPDCL — Southern Power Distribution Co of Telangana
  // ==========================================
  'tsspdcl-lt1-2024': {
    id: 'tsspdcl-lt1-2024',
    providerId: 'tsspdcl',
    regulatorId: 'tserc',
    versionName: 'TSERC Domestic LT-I Schedule FY 2024-25',
    categoryCode: 'LT-I(B)',
    categoryName: 'Domestic Supply',
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'TSERC Retail Supply Tariff Order FY 2024-25',
    orderDate: '2024-03-27',
    sourceDocumentUrl: 'https://tserc.gov.in/tarifforders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.0.0',
    notes: 'TSERC approved domestic monthly telescopic tariff with customer charges and 6 paise/unit statutory duty.',
    verifiedAt: '2024-05-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'MONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 100, ratePerUnit: 3.30, label: '0–100 units' },
      { minUnits: 101, maxUnits: 200, ratePerUnit: 4.30, label: '101–200 units' },
      { minUnits: 201, maxUnits: null, ratePerUnit: 7.00, label: 'Above 200 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 50.00, basis: 'FLAT', phase: 'any' }, // Base customer/standing charge
    ],

    dutyRule: {
      type: 'PER_UNIT',
      rate: 0.06, // 6 paise per unit in Telangana
      label: 'Telangana Electricity Duty (₹0.06/unit)',
    },

    meterRentSinglePhase: 0,
    meterRentThreePhase: 0,
  },

  // ==========================================
  // PVVNL — Pashchimanchal Vidyut Vitran Nigam Ltd (UPPCL West)
  // ==========================================
  'pvvnl-lmv1-2024': {
    id: 'pvvnl-lmv1-2024',
    providerId: 'pvvnl',
    regulatorId: 'uperc',
    versionName: 'UPERC Domestic LMV-1 Schedule FY 2024-25',
    categoryCode: 'LMV-1',
    categoryName: 'Domestic Light, Fan & Power',
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'UPERC Tariff Order for UPPCL DISCOMs FY 2024-25',
    orderDate: '2024-05-30',
    sourceDocumentUrl: 'https://www.uperc.org/tarifforders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.0.0',
    notes: 'UPERC approved domestic urban monthly tariff with load-based standing charges and 5% UP electricity duty.',
    verifiedAt: '2024-06-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'MONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 150, ratePerUnit: 5.50, label: '0–150 units' },
      { minUnits: 151, maxUnits: 300, ratePerUnit: 6.00, label: '151–300 units' },
      { minUnits: 301, maxUnits: 500, ratePerUnit: 6.50, label: '301–500 units' },
      { minUnits: 501, maxUnits: null, ratePerUnit: 7.00, label: 'Above 500 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 110.00, basis: 'PER_KW', phase: 'any' },
    ],

    dutyRule: {
      type: 'PERCENT_ENERGY',
      rate: 0.05, // 5% UP Electricity Duty
      label: 'Uttar Pradesh Electricity Duty (5%)',
    },

    meterRentSinglePhase: 0,
    meterRentThreePhase: 0,
  },

  // ==========================================
  // WBSEDCL — West Bengal State Electricity Distribution Co Ltd
  // ==========================================
  'wbsedcl-domestic-2024': {
    id: 'wbsedcl-domestic-2024',
    providerId: 'wbsedcl',
    regulatorId: 'wberc',
    versionName: 'WBERC Domestic Tariff Schedule',
    categoryCode: 'Domestic',
    categoryName: 'Domestic Supply',
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    isCurrent: true,
    orderReference: 'WBERC Tariff Order for WBSEDCL',
    orderDate: '2024-04-15',
    sourceDocumentUrl: 'https://wberc.gov.in/tarifforders',
    sourceType: 'SERC_ORDER',
    configVersion: '1.0.0',
    notes: 'WBERC approved domestic monthly slabs.',
    verifiedAt: '2024-05-01',
    voltageLevel: 'LT',
    supplyPhase: 'any',
    billingCycle: 'MONTHLY',

    energySlabType: 'TELESCOPIC',
    telescopicSlabs: [
      { minUnits: 0, maxUnits: 102, ratePerUnit: 5.30, label: '0–102 units' },
      { minUnits: 103, maxUnits: 180, ratePerUnit: 5.97, label: '103–180 units' },
      { minUnits: 181, maxUnits: 300, ratePerUnit: 6.97, label: '181–300 units' },
      { minUnits: 301, maxUnits: null, ratePerUnit: 7.31, label: 'Above 300 units' },
    ],

    fixedChargeRules: [
      { minUnits: 0, maxUnits: null, amount: 15.00, basis: 'FLAT', phase: 'any' },
    ],

    dutyRule: {
      type: 'PERCENT_ENERGY',
      rate: 0.05,
      label: 'West Bengal Electricity Duty (5%)',
    },

    meterRentSinglePhase: 0,
    meterRentThreePhase: 0,
  },
};

export function getTariffByProviderId(providerId: string): UniversalTariffVersion | undefined {
  const norm = providerId.toLowerCase();
  return Object.values(UNIVERSAL_TARIFF_REGISTRY).find(
    t => t.providerId.toLowerCase() === norm && t.isCurrent
  );
}

export interface TariffSelectionResult {
  tariff: UniversalTariffVersion | null;
  status: 'EXACT_MATCH' | 'ZERO_MATCHES' | 'MULTIPLE_MATCHES' | 'EXPIRED_TARIFF' | 'FUTURE_TARIFF';
  error?: string;
}

/**
 * Deterministic tariff version selector (Section 10).
 * Never randomly picks a tariff; detects zero matches, multiple matches, expired, or future tariffs.
 */
export function selectTariffVersion(
  providerId: string,
  options?: { asOfDate?: string; categoryCode?: string }
): TariffSelectionResult {
  const normProvider = providerId.toLowerCase();
  const dateStr = options?.asOfDate || new Date().toISOString().slice(0, 10);
  
  let candidates = Object.values(UNIVERSAL_TARIFF_REGISTRY).filter(
    t => t.providerId.toLowerCase() === normProvider
  );

  if (candidates.length === 0) {
    return {
      tariff: null,
      status: 'ZERO_MATCHES',
      error: `No registered tariffs found for provider "${providerId}".`,
    };
  }

  if (options?.categoryCode) {
    const normCategory = options.categoryCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    candidates = candidates.filter(
      t => t.categoryCode.toLowerCase().replace(/[^a-z0-9]/g, '') === normCategory
    );
    if (candidates.length === 0) {
      return {
        tariff: null,
        status: 'ZERO_MATCHES',
        error: `No tariff matches category code "${options.categoryCode}" for provider "${providerId}".`,
      };
    }
  }

  // Find tariffs matching effective date window
  const matchingDateTariffs = candidates.filter(t => {
    const afterStart = t.effectiveFrom <= dateStr;
    const beforeEnd = !t.effectiveTo || t.effectiveTo >= dateStr;
    return afterStart && beforeEnd;
  });

  if (matchingDateTariffs.length === 1) {
    return {
      tariff: matchingDateTariffs[0],
      status: 'EXACT_MATCH',
    };
  }

  if (matchingDateTariffs.length > 1) {
    return {
      tariff: null,
      status: 'MULTIPLE_MATCHES',
      error: `Ambiguous tariff selection: ${matchingDateTariffs.length} overlapping tariff schedules found for date "${dateStr}". Failing safely.`,
    };
  }

  // Check if expired or future
  const isAllExpired = candidates.every(t => t.effectiveTo && t.effectiveTo < dateStr);
  if (isAllExpired) {
    return {
      tariff: null,
      status: 'EXPIRED_TARIFF',
      error: `All available tariffs for "${providerId}" expired before "${dateStr}".`,
    };
  }

  const isAllFuture = candidates.every(t => t.effectiveFrom > dateStr);
  if (isAllFuture) {
    return {
      tariff: null,
      status: 'FUTURE_TARIFF',
      error: `All available tariffs for "${providerId}" are scheduled for future dates after "${dateStr}".`,
    };
  }

  return {
    tariff: null,
    status: 'ZERO_MATCHES',
    error: `No applicable tariff configuration found for date "${dateStr}".`,
  };
}

export function getActiveTariffForDate(providerId: string, asOfDate?: string): UniversalTariffVersion | undefined {
  const result = selectTariffVersion(providerId, { asOfDate });
  if (result.status === 'EXACT_MATCH' && result.tariff) {
    return result.tariff;
  }
  return getTariffByProviderId(providerId);
}

export function getTariffById(id: string): UniversalTariffVersion | undefined {
  return UNIVERSAL_TARIFF_REGISTRY[id];
}

export function getAllUniversalTariffs(): UniversalTariffVersion[] {
  return Object.values(UNIVERSAL_TARIFF_REGISTRY);
}
