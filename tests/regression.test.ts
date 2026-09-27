import { describe, it, expect } from 'vitest';
import { calculateBill } from '../src/lib/calculation/engine';
import { CURRENT_KSEB_TARIFF_VERSION } from '../src/lib/tariffs/ksebTariff2024';

describe('Regression Test: Real Kerala Household Reference Bill Fixture', () => {
  /**
   * Reference test fixture specified in master brief:
   * Tariff: LT-I
   * Phase: Single
   * Billing cycle: Bi-monthly
   * Connected load: 982 W
   * Previous reading: 10,055
   * Present reading: 10,295
   * Consumed: 240 units
   * 
   * Sample bill contains:
   * Fixed charge: ₹210
   * Energy charge: ₹974 approximately
   * Fuel adjustment: ₹2.40
   * Electricity duty: ₹97.40
   * Meter rent: ₹12
   * Subsidies: ₹40 fixed-charge subsidy, ₹108 energy-charge subsidy
   * Actual bill: ₹1,148 (or ₹1,150 on some third-party calculators)
   */
  const referenceInput = {
    previousReading: 10055,
    presentReading: 10295,
    billingCycle: 'bi-monthly' as const,
    phase: 'single' as const,
    connectedLoadWatts: 982,
  };

  it('accurately derives 240 consumed units from meter readings', () => {
    const bill = calculateBill(referenceInput);
    expect(bill.units).toBe(240);
  });

  it('matches all component charges of the reference KSEB bill', () => {
    const bill = calculateBill(referenceInput);

    // Fixed charge: ₹210
    expect(bill.grossFixedCharge).toBe(210);

    // Subsidies: ₹40 fixed + ₹108 energy = ₹148
    expect(bill.fixedChargeSubsidy).toBe(40);
    expect(bill.energySubsidy).toBe(108);
    expect(bill.totalSubsidies).toBe(148);

    // Fuel adjustment: ₹2.40 (₹0.01 * 240 units)
    expect(bill.fuelAdjustment).toBe(2.40);

    // Electricity duty: ₹97.40
    expect(bill.electricityDuty).toBe(97.40);

    // Meter rent: ₹12.00
    expect(bill.meterRent).toBe(12.00);

    // Net bill: ₹1,148
    expect(bill.total).toBe(1148);

    // Discrepancy note explains the ₹2 difference between ₹1,148 and ₹1,150
    expect(bill.discrepancyNote).toBeDefined();
    expect(bill.discrepancyNote).toContain('1,148');
    expect(bill.discrepancyNote).toContain('1,150');
  });

  it('mathematically reconciles the ₹2 difference between ₹1,148 and ₹1,150 via fuel surcharge rate', () => {
    const bill1p = calculateBill(referenceInput); // default 1p / unit FAC
    
    // Test with 2p / unit FAC (as used in some third-party web calculators)
    const customTariff2p = {
      ...bill1p,
      fuelAdjustmentRatePerUnit: 0.02,
    };
    const bill2p = calculateBill(referenceInput, {
      ...CURRENT_KSEB_TARIFF_VERSION,
      fuelAdjustmentRatePerUnit: 0.02,
    });

    expect(bill1p.fuelAdjustment).toBe(2.40);
    expect(bill2p.fuelAdjustment).toBe(4.80);
    expect(bill1p.total).toBe(1148);
    expect(bill2p.total).toBe(1150);
    expect(bill2p.total - bill1p.total).toBe(2);
  });
});
