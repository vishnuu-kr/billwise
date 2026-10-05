import {
  HistoryRecord,
  BaselineEvaluation,
  BillHealthAssessment,
  PredictionLearningStats,
  BillingCycle,
} from '@/types';
import { calculateBill } from '@/lib/calculation/engine';

/**
 * Evaluates the consumer's personal baseline across historical cycles.
 * Invariant: Never declares a statistical "normal" on a single bill.
 * States:
 * - NO_HISTORY: 0 records.
 * - LIMITED_HISTORY: 1-2 records.
 * - ESTABLISHED_BASELINE: 3+ records with authentic normal range.
 */
export function evaluatePersonalBaseline(
  history: HistoryRecord[],
  billingCycle: BillingCycle = 'bi-monthly'
): BaselineEvaluation {
  const count = history.length;
  const cycleDays = billingCycle === 'monthly' ? 30 : 60;

  if (count === 0) {
    return {
      status: 'NO_BASELINE',
      sampleCount: 0,
      averageUnits: 0,
      averageBill: 0,
      usualDailyUnits: 0,
      descriptionEn: 'No baseline established yet. Enter your meter readings to start tracking your consumption pace.',
      descriptionMl: 'ബേസ്‌ലൈൻ വിവരങ്ങൾ ലഭ്യമല്ല. റീഡിംഗ് നൽകി ഉപയോഗം ട്രാക്ക് ചെയ്യാൻ ആരംഭിക്കുക.',
    };
  }

  const totalUnits = history.reduce((sum, h) => sum + h.consumedUnits, 0);
  const averageUnits = Math.round(totalUnits / count);
  const totalBill = history.reduce((sum, h) => sum + (h.actualBill ?? h.predictedBill), 0);
  const averageBill = Math.round(totalBill / count);
  const usualDailyUnits = Number((averageUnits / cycleDays).toFixed(1));

  if (count < 2) {
    return {
      status: 'LIMITED_BASELINE',
      sampleCount: count,
      averageUnits,
      averageBill,
      usualDailyUnits,
      descriptionEn: 'Initial baseline recorded (1 billing cycle). Anomaly sensitivity will calibrate over 2+ cycles.',
      descriptionMl: 'പ്രാഥമിക ബേസ്‌ലൈൻ രേഖപ്പെടുത്തി (1 ബില്ലിംഗ് സൈക്കിൾ). 2 സൈക്കിളുകൾക്ക് ശേഷം കൃത്യത വർദ്ധിക്കും.',
    };
  }

  // Provide typical range (+/- 10% around household average)
  const normalRangeMin = Math.round(averageUnits * 0.9);
  const normalRangeMax = Math.round(averageUnits * 1.1);

  return {
    status: 'ESTABLISHED_BASELINE',
    sampleCount: count,
    averageUnits,
    averageBill,
    usualDailyUnits,
    normalRangeMin,
    normalRangeMax,
    rangeContextEn: `Your usual range is ${normalRangeMin}–${normalRangeMax} kWh.`,
    rangeContextMl: `നിങ്ങളുടെ സാധാരണ ഉപയോഗ പരിധി ${normalRangeMin}–${normalRangeMax} യൂണിറ്റാണ്.`,
    descriptionEn: `Established baseline across ${count} billing cycles (averaging ~${averageUnits} units / cycle).`,
    descriptionMl: `${count} ബില്ലിംഗ് സൈക്കിളുകളിൽ നിന്നുള്ള ശരാശരി ഉപയോഗം (~${averageUnits} യൂണിറ്റ് / സൈക്കിൾ).`,
  };
}

/**
 * Evaluates Bill Health as an evidence-based trust signal.
 * Evaluates:
 * 1. Physical meter reading consistency (monotonic progression, valid roll).
 * 2. Usage variance vs established baseline.
 * 3. Regulatory tariff conformance.
 * 4. Charge component consistency.
 */
export function evaluateBillHealth(
  bill: {
    units: number;
    previousReading?: number;
    presentReading?: number;
    totalAmount?: number;
  },
  history: HistoryRecord[]
): BillHealthAssessment {
  const hasReadingPair = bill.previousReading !== undefined && bill.presentReading !== undefined;
  const isReadingConsistent = !hasReadingPair || (bill.presentReading! >= bill.previousReading!);
  const isPlausibleUnits = bill.units >= 0 && bill.units <= 5000;

  // Reading physical failure
  if (!isReadingConsistent) {
    return {
      status: 'UNUSUAL',
      headlineEn: "Bill readings don't match stated usage.",
      headlineMl: 'മീറ്റർ റീഡിംഗുകളിൽ പൊരുത്തക്കേട് കണ്ടെത്തി.',
      explanationEn: 'Present meter reading is lower than previous reading without documented replacement.',
      explanationMl: 'പുതിയ മീറ്റർ റീഡിംഗ് പഴയ റീഡിംഗിനേക്കാൾ കുറവാണ്.',
      factorsChecked: {
        readingConsistency: false,
        tariffConsistency: true,
        usagePlausibility: isPlausibleUnits,
        chargesConsistency: true,
      },
    };
  }

  // Not enough historical evidence
  if (history.length < 2) {
    return {
      status: 'INSUFFICIENT_HISTORY',
      headlineEn: 'Not enough history to judge yet.',
      headlineMl: 'വിലയിരുത്താൻ ആവശ്യമായ ചരിത്രമില്ല.',
      explanationEn: 'Readings appear consistent, but full household health analysis requires 2+ recorded cycles.',
      explanationMl: 'റീഡിംഗ് സാധാരണമാണെങ്കിലും പൂർണ്ണ വിശകലനത്തിന് 2+ ബില്ലുകൾ ആവശ്യമാണ്.',
      factorsChecked: {
        readingConsistency: true,
        tariffConsistency: true,
        usagePlausibility: isPlausibleUnits,
        chargesConsistency: true,
      },
    };
  }

  // Evaluate against baseline
  const baseline = evaluatePersonalBaseline(history);
  const diffPercent = baseline.averageUnits > 0
    ? Math.round(((bill.units - baseline.averageUnits) / baseline.averageUnits) * 100)
    : 0;

  if (diffPercent > 40) {
    return {
      status: 'NEEDS_ATTENTION',
      headlineEn: `Usage is ${diffPercent}% above your normal average.`,
      headlineMl: `സാധാരണ ശരാശരിയേക്കാൾ ${diffPercent}% കൂടുതലാണ്.`,
      explanationEn: `Current consumption of ${bill.units} units is notably above your usual ~${baseline.averageUnits} units.`,
      explanationMl: `${bill.units} യൂണിറ്റ് സാധാരണ ഉപയോഗമായ ~${baseline.averageUnits} യൂണിറ്റിൽ നിന്നും വളരെ കൂടുതലാണ്.`,
      factorsChecked: {
        readingConsistency: true,
        tariffConsistency: true,
        usagePlausibility: isPlausibleUnits,
        chargesConsistency: true,
      },
    };
  }

  return {
    status: 'HEALTHY',
    headlineEn: 'Looks normal.',
    headlineMl: 'സാധാരണ നിലയിലാണ്.',
    explanationEn: `Usage is consistent with your household's historical pattern (~${baseline.averageUnits} units / cycle).`,
    explanationMl: 'ഉപയോഗം നിങ്ങളുടെ വീടിന്റെ ശരാശരി ഉപയോഗത്തിന് അനുസൃതമാണ്.',
    factorsChecked: {
      readingConsistency: true,
      tariffConsistency: true,
      usagePlausibility: isPlausibleUnits,
      chargesConsistency: true,
    },
  };
}

/**
 * Connects units change to financial impact in Rupees.
 * Core BILLWISE language pattern:
 * +37 kWh ≈ +₹150
 */
export function explainRupeeImpact(
  prevUnits: number,
  currUnits: number,
  billingCycle: BillingCycle = 'bi-monthly'
): {
  unitsDiff: number;
  rupeeDiff: number;
  primaryReasonEn: string;
  primaryReasonMl: string;
  secondaryFactorsEn: string[];
  secondaryFactorsMl: string[];
} {
  const unitsDiff = currUnits - prevUnits;
  const prevCalc = calculateBill({ units: prevUnits, billingCycle, phase: 'single' });
  const currCalc = calculateBill({ units: currUnits, billingCycle, phase: 'single' });
  const rupeeDiff = currCalc.total - prevCalc.total;

  const absUnits = Math.abs(unitsDiff);
  const absRupees = Math.abs(rupeeDiff);

  const sign = unitsDiff > 0 ? '+' : '−';
  const rupeeSign = rupeeDiff > 0 ? '+' : '−';

  const primaryReasonEn = unitsDiff === 0
    ? 'Usage remained identical to previous cycle.'
    : `Usage ${unitsDiff > 0 ? 'increased' : 'decreased'} (${currUnits} kWh vs ${prevUnits} kWh, ${sign}${absUnits} kWh) explaining ≈ ${rupeeSign}₹${absRupees} of change.`;

  const primaryReasonMl = unitsDiff === 0
    ? 'ഉപയോഗത്തിൽ മാറ്റമില്ല.'
    : `ഉപയോഗത്തിലെ മാറ്റം (${currUnits} kWh vs ${prevUnits} kWh, ${sign}${absUnits} യൂണിറ്റ്) ഏകദേശം ${rupeeSign}₹${absRupees} വ്യത്യാസത്തിന് കാരണമായി.`;

  const secondaryFactorsEn: string[] = [];
  const secondaryFactorsMl: string[] = [];

  // Duty impact
  const dutyDiff = currCalc.electricityDuty - prevCalc.electricityDuty;
  if (dutyDiff !== 0) {
    secondaryFactorsEn.push(`Electricity duty: ${dutyDiff > 0 ? '+' : '−'}₹${Math.abs(dutyDiff)}`);
    secondaryFactorsMl.push(`ഡ്യൂട്ടി: ${dutyDiff > 0 ? '+' : '−'}₹${Math.abs(dutyDiff)}`);
  }

  // Subsidy cliff check (240 units for bi-monthly)
  if (billingCycle === 'bi-monthly') {
    if (prevUnits <= 240 && currUnits > 240) {
      secondaryFactorsEn.push('Crossed 240-unit threshold: ₹148 subsidy discontinued');
      secondaryFactorsMl.push('240 യൂണിറ്റ് കഴിഞ്ഞതിനാൽ ₹148 സബ്സിഡി നഷ്ടപ്പെട്ടു');
    } else if (prevUnits > 240 && currUnits <= 240) {
      secondaryFactorsEn.push('Remained under 240 units: ₹148 subsidy retained');
      secondaryFactorsMl.push('240 യൂണിറ്റിനുള്ളിലായതിനാൽ ₹148 സബ്സിഡി ലഭിച്ചു');
    }
  }

  return {
    unitsDiff,
    rupeeDiff,
    primaryReasonEn,
    primaryReasonMl,
    secondaryFactorsEn,
    secondaryFactorsMl,
  };
}

/**
 * Human-understandable prediction confidence without AI theater percentages.
 * - Early cycle: "Too early to know precisely."
 * - Mid cycle: "Good estimate."
 * - Near billing date: "High confidence."
 */
export function getPredictionConfidence(
  daysElapsed: number,
  totalCycleDays: number = 60
): {
  level: 'early' | 'mid' | 'high';
  labelEn: string;
  labelMl: string;
  explanationEn: string;
  explanationMl: string;
} {
  const progressRatio = Math.max(0, Math.min(1, daysElapsed / totalCycleDays));

  if (progressRatio <= 0.25) {
    return {
      level: 'early',
      labelEn: 'Early cycle',
      labelMl: 'ആദ്യ ഘട്ടം',
      explanationEn: 'Too early to know precisely. Estimate will sharpen with mid-cycle readings.',
      explanationMl: 'സൈക്കിളിന്റെ ആദ്യ ഘട്ടമായതിനാൽ കൃത്യത കുറവായിരിക്കാം.',
    };
  }

  if (progressRatio <= 0.75) {
    return {
      level: 'mid',
      labelEn: 'Good estimate',
      labelMl: 'നല്ല കണക്കുകൂട്ടൽ',
      explanationEn: 'Solid mid-cycle projection based on your actual consumption pace.',
      explanationMl: 'ഇതുവരെയുള്ള ഉപയോഗ നിരക്ക് വെച്ചുള്ള വിശ്വസനീയമായ കണക്കുകൂട്ടൽ.',
    };
  }

  return {
    level: 'high',
    labelEn: 'High confidence',
    labelMl: 'ഉയർന്ന കൃത്യത',
    explanationEn: 'Near billing date with established daily pace.',
    explanationMl: 'ബില്ലിംഗ് തീയതിയോട് അടുത്തതിനാൽ ഉയർന്ന കൃത്യത.',
  };
}

/**
 * Prediction Learning calibrated across historical cycles.
 * Invariant: Only declares a statistical claim when sampleCount >= 3.
 */
export function getPredictionLearning(history: HistoryRecord[]): PredictionLearningStats {
  const evaluated = history.filter(
    (h) => h.predictedBill > 0 && typeof h.actualBill === 'number' && !isNaN(h.actualBill)
  );

  if (evaluated.length === 0) {
    return {
      sampleCount: 0,
      hasSufficientData: false,
      averageVarianceRupees: 0,
      tendency: 'insufficient_data',
      learningStatementEn: 'Enter your actual bill when it arrives to see prediction accuracy calibration.',
      learningStatementMl: 'കൃത്യത പരിശോധിക്കാൻ യഥാർത്ഥ ബിൽ നൽകുക.',
    };
  }

  let totalDiff = 0;
  let overCount = 0;
  let underCount = 0;

  for (const item of evaluated) {
    const diff = (item.actualBill as number) - item.predictedBill;
    totalDiff += Math.abs(diff);
    if (diff < -15) overCount++; // predicted higher than actual
    else if (diff > 15) underCount++; // predicted lower than actual
  }

  const averageVarianceRupees = Math.round(totalDiff / evaluated.length);

  if (evaluated.length < 3) {
    return {
      sampleCount: evaluated.length,
      hasSufficientData: false,
      averageVarianceRupees,
      tendency: 'insufficient_data',
      learningStatementEn: `Based on ${evaluated.length} evaluated billing cycle${evaluated.length > 1 ? 's' : ''}, estimates have been within approx ₹${averageVarianceRupees} of actual KSEB bills. Calibration requires 3+ cycles to establish statistical trends.`,
      learningStatementMl: `${evaluated.length} ബില്ലിംഗ് സൈക്കിളുകളിൽ ഏകദേശം ₹${averageVarianceRupees} വ്യത്യാസം. കൃത്യമായ ട്രെൻഡ് അറിയാൻ 3+ സൈക്കിളുകൾ ആവശ്യമാണ്.`,
    };
  }

  let tendency: 'overestimate' | 'underestimate' | 'balanced' = 'balanced';

  if (overCount / evaluated.length >= 0.6) {
    tendency = 'overestimate';
  } else if (underCount / evaluated.length >= 0.6) {
    tendency = 'underestimate';
  }

  let learningStatementEn = `BILLWISE usually predicts within about ₹${averageVarianceRupees} for your home.`;
  let learningStatementMl = `നിങ്ങളുടെ വീട്ടിൽ BILLWISE കണക്കുകൂട്ടലുകൾ സാധാരണ ₹${averageVarianceRupees} വ്യത്യാസത്തിനുള്ളിലാണ്.`;

  if (tendency === 'overestimate') {
    learningStatementEn += ' Estimates tend to be slightly conservative (higher than final bill).';
    learningStatementMl += ' മുൻകരുതൽ എന്ന നിലയിൽ എസ്റ്റിമേറ്റ് അല്പം കൂടുതലായിരിക്കാം.';
  } else if (tendency === 'underestimate') {
    learningStatementEn += ' Estimates tend to track slightly lower than final official bills.';
    learningStatementMl += ' ഔദ്യോഗിക ബില്ലിനേക്കാൾ അല്പം കുറവായിരിക്കാൻ സാധ്യതയുണ്ട്.';
  }

  return {
    sampleCount: evaluated.length,
    hasSufficientData: true,
    averageVarianceRupees,
    tendency,
    learningStatementEn,
    learningStatementMl,
  };
}

/**
 * Analyzes why an actual bill differed from an estimate.
 * Identifies the dominant cause:
 * - Consumption changed in final days
 * - Billing cycle length adjustment
 * - Duty / fuel adjustment revision
 */
export function explainEstimateVsActual(
  predictedBill: number,
  actualBill: number,
  predictedUnits?: number,
  actualUnits?: number
): {
  diff: number;
  diffPercent: number;
  isHigh: boolean;
  dominantReasonEn: string;
  dominantReasonMl: string;
} {
  const diff = actualBill - predictedBill;
  const diffPercent = predictedBill > 0 ? Math.round((Math.abs(diff) / predictedBill) * 100) : 0;
  const isHigh = diff < 0; // predicted was higher than actual

  if (Math.abs(diff) <= 25) {
    return {
      diff,
      diffPercent,
      isHigh,
      dominantReasonEn: 'Prediction closely matched official bill within rounding margin.',
      dominantReasonMl: 'പ്രവചനവും ഔദ്യോഗിക ബില്ലും കൃത്യമായി പൊരുത്തപ്പെട്ടു.',
    };
  }

  if (predictedUnits && actualUnits) {
    const unitsDiff = actualUnits - predictedUnits;
    if (unitsDiff <= -10) {
      return {
        diff,
        diffPercent,
        isHigh: true,
        dominantReasonEn: `Usage slowed down by ${Math.abs(unitsDiff)} units in the final days of the cycle.`,
        dominantReasonMl: `സൈക്കിളിന്റെ അവസാന ദിവസങ്ങളിൽ ഉപയോഗം ${Math.abs(unitsDiff)} യൂണിറ്റ് കുറവായിരുന്നു.`,
      };
    }
    if (unitsDiff >= 10) {
      return {
        diff,
        diffPercent,
        isHigh: false,
        dominantReasonEn: `Usage accelerated by ${unitsDiff} units in the final days of the cycle.`,
        dominantReasonMl: `സൈക്കിളിന്റെ അവസാന ദിവസങ്ങളിൽ ഉപയോഗം ${unitsDiff} യൂണിറ്റ് കൂടുതലായിരുന്നു.`,
      };
    }
  }

  return {
    diff,
    diffPercent,
    isHigh,
    dominantReasonEn: isHigh
      ? `BILLWISE was ₹${Math.abs(diff)} high. Daily pace slowed near billing date.`
      : `BILLWISE was ₹${Math.abs(diff)} low. Daily pace increased near billing date.`,
    dominantReasonMl: isHigh
      ? `BILLWISE ₹${Math.abs(diff)} കൂടുതലായിരുന്നു. അവസാന ദിവസങ്ങളിൽ ഉപയോഗം കുറഞ്ഞു.`
      : `BILLWISE ₹${Math.abs(diff)} കുറവായിരുന്നു. അവസാന ദിവസങ്ങളിൽ ഉപയോഗം കൂടി.`,
  };
}

/**
 * Duplicate Bill Detector (Section 20: Duplicate Protection).
 * Prevents redundant history insertion when scanning an identical bill.
 */
export function isDuplicateBill(
  bill: {
    presentReading?: number;
    previousReading?: number;
    consumedUnits?: number;
    totalAmount?: number;
    billingPeriod?: string;
  },
  history: HistoryRecord[]
): { isDuplicate: boolean; matchedRecord?: HistoryRecord; message?: string } {
  for (const record of history) {
    // Check 1: Match on exact readings
    if (
      bill.presentReading !== undefined &&
      record.meterReading !== undefined &&
      bill.presentReading === record.meterReading &&
      bill.consumedUnits === record.consumedUnits
    ) {
      return {
        isDuplicate: true,
        matchedRecord: record,
        message: 'This bill is already in your history with matching meter reading.',
      };
    }

    // Check 2: Match on identical billing period, units, and amount without reading conflict
    const readingConflict =
      bill.presentReading !== undefined &&
      record.meterReading !== undefined &&
      bill.presentReading !== record.meterReading;

    if (!readingConflict) {
      const samePeriod =
        bill.billingPeriod !== undefined &&
        (record.dateLabel.toLowerCase().includes(bill.billingPeriod.toLowerCase()) ||
          bill.billingPeriod.toLowerCase().includes(record.dateLabel.toLowerCase()));

      if (
        samePeriod &&
        bill.consumedUnits !== undefined &&
        record.consumedUnits === bill.consumedUnits &&
        bill.totalAmount !== undefined &&
        (record.actualBill === bill.totalAmount || record.predictedBill === bill.totalAmount)
      ) {
        return {
          isDuplicate: true,
          matchedRecord: record,
          message: 'This bill is already in your history.',
        };
      }
    }
  }

  return { isDuplicate: false };
}
