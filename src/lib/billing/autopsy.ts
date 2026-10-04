import { Phase, BillingCycle, BillCalculationResult } from '@/types';
import { calculateBill } from '@/lib/calculation/engine';

export interface BillAutopsyReport {
  inputAmount: number;
  estimatedUnits: number;
  isExactUnitsInput: boolean;
  calculatedBill: BillCalculationResult;
  isCliffCrossed: boolean; // units > 240
  isNonTelescopicCrossed: boolean; // units > 500
  goldenBill240: BillCalculationResult;
  lostSubsidyAmount: number; // Subsidy lost (up to ₹148)
  excessFixedChargePenalty: number; // Extra fixed charge compared to <= 240u slab
  totalAvoidablePenalty: number; // Total extra paid compared to 240u golden reference
  effectiveMarginalRate: number; // ₹ per unit for the units above 240
  safeBufferUnits: number; // If <= 240, how many units remaining before cliff
  headlineMal: string;
  headlineEng: string;
  verdictMal: string;
  verdictEng: string;
  actionAdviceMal: string;
  actionAdviceEng: string;
}

/**
 * Reverse-engineers consumed units from a total bill amount in Rupees.
 * Uses binary search over the monotonic range [0, 3000] units.
 */
export function reverseEstimateUnitsFromBill(
  targetBillAmount: number,
  phase: Phase = 'single',
  cycle: BillingCycle = 'bi-monthly'
): number {
  if (targetBillAmount <= 0) return 0;

  let low = 0;
  let high = 3000;
  let bestUnits = 0;
  let minDiff = Infinity;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = calculateBill({ units: mid, phase, billingCycle: cycle });
    const diff = result.total - targetBillAmount;

    if (Math.abs(diff) < minDiff) {
      minDiff = Math.abs(diff);
      bestUnits = mid;
    }

    if (Math.abs(diff) <= 2) {
      return mid;
    }

    if (result.total < targetBillAmount) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestUnits;
}

/**
 * Performs a forensic autopsy on a KSEB LT-1A bill.
 * Identifies if the user crossed the 240u subsidy cliff, how much subsidy was lost,
 * and calculates the exact avoidable financial penalty.
 */
export function performBillAutopsy(params: {
  billAmount?: number;
  units?: number;
  phase?: Phase;
  billingCycle?: BillingCycle;
}): BillAutopsyReport {
  const phase = params.phase || 'single';
  const cycle = params.billingCycle || 'bi-monthly';
  const isExactUnits = typeof params.units === 'number' && params.units >= 0;

  let units: number;
  let inputAmount: number;

  if (isExactUnits) {
    units = Math.round(params.units!);
    const calculated = calculateBill({ units, phase, billingCycle: cycle });
    inputAmount = calculated.total;
  } else {
    inputAmount = Math.max(0, params.billAmount || 1850);
    units = reverseEstimateUnitsFromBill(inputAmount, phase, cycle);
  }

  const calculatedBill = calculateBill({ units, phase, billingCycle: cycle });
  const goldenBill240 = calculateBill({ units: 240, phase, billingCycle: cycle }); // ₹1,148 reference

  const isCliffCrossed = units > 240;
  const isNonTelescopicCrossed = units > 500;

  let lostSubsidyAmount = 0;
  let excessFixedChargePenalty = 0;
  let totalAvoidablePenalty = 0;
  let effectiveMarginalRate = 0;
  let safeBufferUnits = 0;

  if (isCliffCrossed) {
    const excessUnits = units - 240;
    // Golden reference has ₹148 subsidies (₹108 energy + ₹40 fixed)
    lostSubsidyAmount = Math.max(0, goldenBill240.totalSubsidies - calculatedBill.totalSubsidies);
    excessFixedChargePenalty = Math.max(0, calculatedBill.grossFixedCharge - goldenBill240.grossFixedCharge);
    
    // Total avoidable penalty vs staying at 240 units
    totalAvoidablePenalty = Math.max(0, calculatedBill.total - goldenBill240.total);
    effectiveMarginalRate = excessUnits > 0 ? Number((totalAvoidablePenalty / excessUnits).toFixed(2)) : 0;
  } else {
    safeBufferUnits = 240 - units;
  }

  // Malayalam & English messaging
  let headlineMal = '';
  let headlineEng = '';
  let verdictMal = '';
  let verdictEng = '';
  let actionAdviceMal = '';
  let actionAdviceEng = '';

  if (isCliffCrossed) {
    const excess = units - 240;
    headlineEng = `You paid a ₹${totalAvoidablePenalty} cliff penalty on this bill!`;
    headlineMal = `നിങ്ങൾ ഈ ബില്ലിൽ ₹${totalAvoidablePenalty} അധിക താരിഫ് പിഴ നൽകി!`;

    verdictEng = `You exceeded the 240-unit subsidy threshold by ${excess} units. Because you crossed 240, you lost ₹${lostSubsidyAmount} in government subsidies and fixed charges increased. Those ${excess} extra units cost you ₹${effectiveMarginalRate}/unit instead of the normal ₹4.85!`;
    verdictMal = `നിങ്ങൾ 240 യൂണിറ്റ് സബ്സിഡി പരിധി ${excess} യൂണിറ്റ് കവിഞ്ഞു. ഇതുവഴി സർക്കാരിന്റെ ₹${lostSubsidyAmount} സബ്സിഡി നഷ്ടപ്പെടുകയും ഫിക്സഡ് ചാർജ് കൂടുകയും ചെയ്തു. ഈ ${excess} അധിക യൂണിറ്റുകൾക്ക് യൂണിറ്റിന് ₹${effectiveMarginalRate} വീതം നൽകേണ്ടി വന്നു!`;

    actionAdviceEng = `Setting a Day 42 Cliff Alert will warn you before you cross 240 units next cycle, saving you over ₹${totalAvoidablePenalty}.`;
    actionAdviceMal = `അടുത്ത തവണ 42-ാം ദിവസം ഒരു ക്ലിഫ് അലർട്ട് വെച്ചാൽ 240 യൂണിറ്റ് കടക്കാതെ ₹${totalAvoidablePenalty} ലാഭിക്കാം.`;
  } else {
    headlineEng = `Safe! You captured the full ₹${goldenBill240.totalSubsidies} KSEB subsidy.`;
    headlineMal = `സുരക്ഷിതം! നിങ്ങൾക്ക് ₹${goldenBill240.totalSubsidies} സബ്സിഡി പൂർണ്ണമായും ലഭിച്ചു.`;

    verdictEng = `Your consumption stayed within the telescopic subsidy tier (${units} units). You saved ₹${goldenBill240.totalSubsidies} compared to non-subsidized rates.`;
    verdictMal = `നിങ്ങളുടെ ഉപയോഗം സബ്സിഡി പരിധിയിലാണ് (${units} യൂണിറ്റ്). സബ്സിഡി ഇല്ലാത്ത താരിഫുമായി താരതമ്യം ചെയ്യുമ്പോൾ നിങ്ങൾ ₹${goldenBill240.totalSubsidies} ലാഭിച്ചു.`;

    actionAdviceEng = `You only had a ${safeBufferUnits}-unit safety buffer. Running 1 AC for just 1 extra hour per day would push you over the cliff. Lock in Day 42 protection.`;
    actionAdviceMal = `നിങ്ങൾക്ക് ഇനി ${safeBufferUnits} യൂണിറ്റ് മാത്രമേ ബാക്കിയുണ്ടായിരുന്നുള്ളൂ. ദിവസവും ഒരു മണിക്കൂർ എസി കൂടുതൽ പ്രവർത്തിച്ചാൽ സബ്സിഡി നഷ്ടപ്പെടും. 42-ാം ദിവസത്തെ അലർട്ട് ഓൺ ചെയ്യുക.`;
  }

  return {
    inputAmount,
    estimatedUnits: units,
    isExactUnitsInput: isExactUnits,
    calculatedBill,
    isCliffCrossed,
    isNonTelescopicCrossed,
    goldenBill240,
    lostSubsidyAmount,
    excessFixedChargePenalty,
    totalAvoidablePenalty,
    effectiveMarginalRate,
    safeBufferUnits,
    headlineMal,
    headlineEng,
    verdictMal,
    verdictEng,
    actionAdviceMal,
    actionAdviceEng,
  };
}
