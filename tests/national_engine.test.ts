import { describe, it, expect } from 'vitest';
import { calculateUniversalBill } from '../src/lib/electricity/engine/universalEngine';
import { NATIONAL_PROVIDER_REGISTRY, getProviderById, searchProviders } from '../src/lib/electricity/providers';
import { detectProviderFromBillText } from '../src/lib/electricity/detection/providerDetector';
import { REGULATOR_REGISTRY } from '../src/lib/electricity/regulators';

describe('Universal Electricity Billing Engine — National Platform', () => {
  it('calculates the KSEB golden reference bill (240 units bi-monthly = ₹1,148)', () => {
    const result = calculateUniversalBill({
      providerId: 'kseb',
      units: 240,
      billingCycle: 'BIMONTHLY',
      phase: 'single',
      connectedLoadKw: 1,
    });

    expect(result.inputUnits).toBe(240);
    expect(result.provider.shortName).toBe('KSEB');
    expect(result.total).toBe(1148);

    // Verify itemized components
    const energyComp = result.components.find(c => c.id === 'energy_charge');
    const fixedComp = result.components.find(c => c.id === 'fixed_charge');
    const dutyComp = result.components.find(c => c.id === 'electricity_duty');
    const subsidyComp = result.components.find(c => c.category === 'DISCOUNT');

    expect(energyComp).toBeDefined();
    expect(energyComp?.amount).toBe(973.8); // 80*3.25 + 80*4.05 + 40*4.90 + 40*4.845
    expect(fixedComp?.amount).toBe(210); // Bi-monthly slab fixed charge for 240 units
    expect(dutyComp?.amount).toBe(97.38); // 10% duty on energy
    expect(subsidyComp?.amount).toBe(148); // ₹148 government domestic subsidy
    expect(result.totalSubsidies).toBe(148);
  });

  it('calculates high consumption KSEB non-telescopic bill (>500 units)', () => {
    const result = calculateUniversalBill({
      providerId: 'kseb',
      units: 520,
      billingCycle: 'BIMONTHLY',
      phase: 'three',
      connectedLoadKw: 5,
    });

    expect(result.inputUnits).toBe(520);
    expect(result.total).toBeGreaterThan(4000);
    expect(result.explanation.slabBreakdown[0].label).toContain('Non-telescopic');
  });

  it('calculates BESCOM (Bangalore / Karnataka) LT-2(a) monthly bill with load and duty', () => {
    // 150 units, 2 kW connected load
    // Slabs: 0-100 @ 4.75 = ₹475, 50 @ 7.00 = ₹350 => Gross Energy = ₹825
    // Fixed: 1 kW @ 110 + 1 kW @ 210 = ₹320
    // FPPCA: 150 * 0.35 = ₹52.50
    // Duty: 9% on energy = 0.09 * 825 = ₹74.25
    // Total = 825 + 320 + 52.50 + 74.25 = ₹1,271.75 -> ₹1,272
    const result = calculateUniversalBill({
      providerId: 'bescom',
      units: 150,
      billingCycle: 'MONTHLY',
      phase: 'single',
      connectedLoadKw: 2,
    });

    expect(result.provider.shortName).toBe('BESCOM');
    expect(result.inputUnits).toBe(150);
    expect(result.billingCycle).toBe('MONTHLY');

    const energyComp = result.components.find(c => c.id === 'energy_charge');
    const fixedComp = result.components.find(c => c.id === 'fixed_charge');
    const dutyComp = result.components.find(c => c.id === 'electricity_duty');
    const facComp = result.components.find(c => c.id === 'variable_adjustment');

    expect(energyComp?.amount).toBe(825);
    expect(fixedComp?.amount).toBe(320);
    expect(dutyComp?.amount).toBe(74.25);
    expect(facComp?.amount).toBe(52.5);
    expect(result.total).toBe(1272);
  });

  it('calculates MSEDCL (Maharashtra) LT-1 residential monthly bill with wheeling and 16% duty', () => {
    // 200 units, 1 phase
    // Slabs: 100 @ 3.44 = ₹344, 100 @ 7.34 = ₹734 => Gross Energy = ₹1,078
    // Wheeling: 200 * 1.17 = ₹234
    // Fixed: ₹128
    // FAC: 200 * 0.25 = ₹50
    // Duty: 16% on (Energy + Wheeling + Fixed + FAC) = 16% of (1078 + 234 + 128 + 50 = 1490) = ₹238.40
    // Total = 1490 + 238.40 = ₹1,728.40 -> ₹1,728
    const result = calculateUniversalBill({
      providerId: 'msedcl',
      units: 200,
      billingCycle: 'MONTHLY',
      phase: 'single',
    });

    expect(result.provider.shortName).toBe('MSEDCL');
    expect(result.inputUnits).toBe(200);

    const wheelingComp = result.components.find(c => c.id === 'wheeling_charge');
    expect(wheelingComp).toBeDefined();
    expect(wheelingComp?.amount).toBe(234);

    const dutyComp = result.components.find(c => c.id === 'electricity_duty');
    expect(dutyComp?.amount).toBe(238.4);
    expect(result.total).toBe(1728);
  });

  it('calculates TPDDL (Delhi) domestic bill with pension surcharge and 5% tax', () => {
    const result = calculateUniversalBill({
      providerId: 'tpddl',
      units: 180,
      billingCycle: 'MONTHLY',
      phase: 'single',
      connectedLoadKw: 2,
    });

    expect(result.provider.shortName).toBe('TPDDL');
    expect(result.inputUnits).toBe(180);
    expect(result.total).toBeGreaterThan(0);
    expect(result.components.some(c => c.name.includes('Pension Trust'))).toBe(true);
  });
});

describe('National Provider Registry & Search', () => {
  it('contains verified providers across all Indian states and key UTs', () => {
    expect(Object.keys(NATIONAL_PROVIDER_REGISTRY).length).toBeGreaterThanOrEqual(20);
    expect(getProviderById('kseb')).toBeDefined();
    expect(getProviderById('bescom')).toBeDefined();
    expect(getProviderById('msedcl')).toBeDefined();
    expect(getProviderById('tpddl')).toBeDefined();
    expect(getProviderById('tangedco')).toBeDefined();
    expect(getProviderById('pvvnl')).toBeDefined();
  });

  it('supports fuzzy search by state, acronym, and city', () => {
    const bangaloreSearch = searchProviders('bangalore');
    expect(bangaloreSearch.some(p => p.id === 'bescom')).toBe(true);

    const keralaSearch = searchProviders('kerala');
    expect(keralaSearch.some(p => p.id === 'kseb')).toBe(true);

    const mumbaiSearch = searchProviders('mumbai');
    expect(mumbaiSearch.some(p => p.id === 'msedcl' || p.id === 'adani-mumbai')).toBe(true);
  });

  it('contains official regulatory commissions and authorities', () => {
    expect(REGULATOR_REGISTRY['kserc']).toBeDefined();
    expect(REGULATOR_REGISTRY['kerc']).toBeDefined();
    expect(REGULATOR_REGISTRY['merc']).toBeDefined();
    expect(REGULATOR_REGISTRY['derc']).toBeDefined();
    expect(REGULATOR_REGISTRY['cea']).toBeDefined();
  });
});

describe('Universal Bill Detection & OCR Normalization', () => {
  it('detects KSEB bill text correctly', () => {
    const rawBill = `
      KERALA STATE ELECTRICITY BOARD LIMITED
      Consumer No: 1155443322112
      Tariff: LT-1A Domestic
      Previous Reading: 10055
      Present Reading: 10295
      Consumed Units: 240
      Total Payable: Rs 1148
    `;

    const detection = detectProviderFromBillText(rawBill);
    expect(detection.detectedProvider?.id).toBe('kseb');
    expect(detection.confidence).toBe('high');
    expect(detection.normalizedBillInput?.units).toBe(240);
    expect(detection.isSupported).toBe(true);
  });

  it('detects BESCOM Karnataka bill text correctly', () => {
    const rawBill = `
      BANGALORE ELECTRICITY SUPPLY COMPANY LIMITED (BESCOM)
      Account ID: 9876543210
      Tariff: LT-2(a)
      Sanctioned Load: 2.0 KW
      Billed Units: 150
      Amount: Rs 1272
      Visit: www.bescom.co.in
    `;

    const detection = detectProviderFromBillText(rawBill);
    expect(detection.detectedProvider?.id).toBe('bescom');
    expect(detection.confidence).toBe('high');
    expect(detection.normalizedBillInput?.units).toBe(150);
    expect(detection.normalizedBillInput?.connectedLoadKw).toBe(2);
  });

  it('detects MSEDCL Maharashtra bill text correctly', () => {
    const rawBill = `
      MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.
      MAHAVITARAN
      Consumer No: 123456789012
      Tariff: LT-1 Residential
      Units Billed: 200
      Total: 1728.00
    `;

    const detection = detectProviderFromBillText(rawBill);
    expect(detection.detectedProvider?.id).toBe('msedcl');
    expect(detection.confidence).toBe('high');
    expect(detection.normalizedBillInput?.units).toBe(200);
  });
});
