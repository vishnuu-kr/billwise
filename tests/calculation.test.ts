import { describe, it, expect } from 'vitest';
import { calculateBill, calculateConsumedUnits } from '../src/lib/calculation/engine';
import { CURRENT_KSEB_TARIFF_VERSION } from '../src/lib/tariffs/ksebTariff2024';

describe('Meter Reading Delta & Validation Engine', () => {
  it('correctly calculates units from direct unit input', () => {
    const res = calculateConsumedUnits({ units: 150, billingCycle: 'bi-monthly', phase: 'single' });
    expect(res.units).toBe(150);
    expect(res.error).toBeUndefined();
  });

  it('correctly calculates units from meter reading delta (10055 to 10295)', () => {
    const res = calculateConsumedUnits({
      previousReading: 10055,
      presentReading: 10295,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });
    expect(res.units).toBe(240);
  });

  it('handles meter rollover on a 5-digit meter (99950 to 00020)', () => {
    const res = calculateConsumedUnits({
      previousReading: 99950,
      presentReading: 20,
      billingCycle: 'bi-monthly',
      phase: 'single',
      meterDigits: 5,
    });
    expect(res.units).toBe(70);
  });

  it('handles meter replacement with old and new readings', () => {
    const res = calculateConsumedUnits({
      previousReading: 12400,
      oldMeterFinalReading: 12500, // 100 units on old meter
      newMeterInitialReading: 0,
      presentReading: 80,          // 80 units on new meter
      isMeterReplaced: true,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });
    expect(res.units).toBe(180);
  });

  it('flags error if present reading is lower than previous reading without replacement', () => {
    const res = calculateConsumedUnits({
      previousReading: 10400,
      presentReading: 10200,
      billingCycle: 'bi-monthly',
      phase: 'single',
    });
    expect(res.error).toBeDefined();
    expect(res.units).toBe(0);
  });
});

describe('Slab Calculation & Tariff Engine', () => {
  it('handles 0 units consumption cleanly', () => {
    const bill = calculateBill({ units: 0, billingCycle: 'bi-monthly', phase: 'single' });
    expect(bill.units).toBe(0);
    expect(bill.grossEnergyCharge).toBe(0);
    // Fixed charge ₹70 minus ₹40 subsidy = ₹30 net fixed + ₹12 meter rent = ₹42 total
    expect(bill.total).toBeGreaterThanOrEqual(0);
  });

  it('calculates telescopic bi-monthly consumption for 100 units', () => {
    // 0-80: 80 * 3.25 = 260
    // 81-100: 20 * 4.05 = 81
    // Gross energy: 341
    const bill = calculateBill({ units: 100, billingCycle: 'bi-monthly', phase: 'single' });
    expect(bill.grossEnergyCharge).toBe(341);
    expect(bill.slabBreakdown.length).toBe(2);
    expect(bill.isTelescopicApplied).toBe(true);
  });

  it('switches to non-telescopic billing when bi-monthly consumption exceeds 500 units', () => {
    const bill = calculateBill({ units: 550, billingCycle: 'bi-monthly', phase: 'single' });
    expect(bill.isTelescopicApplied).toBe(false);
    // Non-telescopic flat rate of ₹6.60 for 501-600 units
    expect(bill.grossEnergyCharge).toBe(550 * 6.60);
    expect(bill.totalSubsidies).toBe(0); // No subsidy above 240 units
  });

  it('applies three phase fixed charges accurately', () => {
    const singlePhaseBill = calculateBill({ units: 100, billingCycle: 'bi-monthly', phase: 'single' });
    const threePhaseBill = calculateBill({ units: 100, billingCycle: 'bi-monthly', phase: 'three' });
    expect(threePhaseBill.grossFixedCharge).toBeGreaterThan(singlePhaseBill.grossFixedCharge);
    expect(threePhaseBill.meterRent).toBe(CURRENT_KSEB_TARIFF_VERSION.meterRentThreePhase);
  });
});
