import { HistoryRecord, BaselineEvaluation, AnomalyReport, BillingCycle } from '@/types';

/**
 * Evaluates the consumer's baseline state (Section 25: Personal Baseline).
 * Distinguishes between:
 * - NO_BASELINE: 0 historical records.
 * - LIMITED_BASELINE: 1 historical record. Never makes strong anomaly claims.
 * - ESTABLISHED_BASELINE: 2+ historical records across billing cycles.
 */
export function evaluatePersonalBaseline(history: HistoryRecord[]): BaselineEvaluation {
  const count = history.length;

  if (count === 0) {
    return {
      status: 'NO_BASELINE',
      sampleCount: 0,
      averageUnits: 0,
      averageBill: 0,
      descriptionEn: 'No baseline established yet. Enter your meter readings to start tracking your consumption pace.',
      descriptionMl: 'ബേസ്‌ലൈൻ വിവരങ്ങൾ ലഭ്യമല്ല. റീഡിംഗ് നൽകി ഉപയോഗം ട്രാക്ക് ചെയ്യാൻ ആരംഭിക്കുക.',
    };
  }

  const totalUnits = history.reduce((sum, h) => sum + h.consumedUnits, 0);
  const averageUnits = Math.round(totalUnits / count);
  const totalBill = history.reduce((sum, h) => sum + (h.actualBill ?? h.predictedBill), 0);
  const averageBill = Math.round(totalBill / count);

  if (count === 1) {
    return {
      status: 'LIMITED_BASELINE',
      sampleCount: 1,
      averageUnits,
      averageBill,
      descriptionEn: 'Initial baseline recorded (1 billing cycle). Anomaly sensitivity will calibrate over 2+ cycles.',
      descriptionMl: 'പ്രാഥമിക ബേസ്‌ലൈൻ രേഖപ്പെടുത്തി (1 ബില്ലിംഗ് സൈക്കിൾ). 2 സൈക്കിളുകൾക്ക് ശേഷം കൃത്യത വർദ്ധിക്കും.',
    };
  }

  return {
    status: 'ESTABLISHED_BASELINE',
    sampleCount: count,
    averageUnits,
    averageBill,
    descriptionEn: `Established baseline across ${count} billing cycles (averaging ~${averageUnits} units / cycle).`,
    descriptionMl: `${count} ബില്ലിംഗ് സൈക്കിളുകളിൽ നിന്നുള്ള ശരാശരി ഉപയോഗം (~${averageUnits} യൂണിറ്റ് / സൈക്കിൾ).`,
  };
}

/**
 * Evidence-based Anomaly Detection Engine (Section 24: Anomaly Detection).
 * Classifies current consumption into NORMAL, CHECK, or UNUSUAL.
 * Invariant: Never flags UNUSUAL on a single noisy data point without an established baseline,
 * unless there is physical reading inconsistency or extreme implausible usage (> 5,000 units).
 */
export function evaluateConsumptionAnomaly(
  currentUnits: number,
  baseline: BaselineEvaluation,
  options?: {
    isReadingInconsistent?: boolean;
    isTariffChanged?: boolean;
    hasCrossedSubsidyCliff?: boolean;
  }
): AnomalyReport {
  // Case 1: Physical reading error or inverted readings
  if (options?.isReadingInconsistent) {
    return {
      status: 'UNUSUAL',
      reasonEn: "Meter readings don't match the stated usage. Verify meter numbers for typos or meter replacement.",
      reasonMl: 'മീറ്റർ റീഡിംഗുകളിൽ പൊരുത്തക്കേട് കണ്ടെത്തി. അക്കങ്ങൾ പരിശോധിക്കുക.',
      deviationPercent: 0,
      dominantDriver: 'Meter Reading Inconsistency',
    };
  }

  // Case 2: Extreme implausible consumption for domestic connection
  if (currentUnits > 5000) {
    return {
      status: 'UNUSUAL',
      reasonEn: `${currentUnits.toLocaleString()} units is extremely high for residential LT-1A. Please confirm meter digits.`,
      reasonMl: `${currentUnits.toLocaleString()} യൂണിറ്റ് ഗാർഹിക കണക്ഷന് അസാധാരണമാംവിധം കൂടുതലാണ്. റീഡിംഗ് പരിശോധിക്കുക.`,
      deviationPercent: 100,
      dominantDriver: 'Extreme Consumption Outlier',
    };
  }

  // Case 3: No baseline established
  if (baseline.status === 'NO_BASELINE') {
    return {
      status: 'NORMAL',
      reasonEn: 'Initial reading recorded. Normal baseline will establish over upcoming cycles.',
      reasonMl: 'ആദ്യ റീഡിംഗ് രേഖപ്പെടുത്തി. തുടർ ഉപയോഗങ്ങളിലൂടെ ബേസ്‌ലൈൻ സജ്ജമാകും.',
      deviationPercent: 0,
      dominantDriver: 'First Cycle Tracking',
    };
  }

  // Case 4: Limited baseline (1 reading) -> Be cautious, do not trigger UNUSUAL
  if (baseline.status === 'LIMITED_BASELINE') {
    const dev = baseline.averageUnits > 0
      ? Math.round(((currentUnits - baseline.averageUnits) / baseline.averageUnits) * 100)
      : 0;

    if (Math.abs(dev) > 40 || options?.hasCrossedSubsidyCliff) {
      return {
        status: 'CHECK',
        reasonEn: `Usage is ${Math.abs(dev)}% ${dev > 0 ? 'higher' : 'lower'} than your first recorded bill. Monitoring ongoing pace.`,
        reasonMl: `ആദ്യ ബില്ലിനേക്കാൾ ${Math.abs(dev)}% ${dev > 0 ? 'കൂടുതൽ' : 'കുറവ്'}. തുടർന്ന് നിരീക്ഷിക്കുന്നു.`,
        deviationPercent: dev,
        dominantDriver: dev > 0 ? 'Higher Pace vs Single Cycle' : 'Lower Pace vs Single Cycle',
      };
    }

    return {
      status: 'NORMAL',
      reasonEn: 'Usage appears consistent with your initial recorded reading.',
      reasonMl: 'ഉപയോഗം സാധാരണ നിലയിലാണ്.',
      deviationPercent: dev,
      dominantDriver: 'Consistent Usage',
    };
  }

  // Case 5: Established baseline (>= 2 cycles)
  const deviationPercent = baseline.averageUnits > 0
    ? Math.round(((currentUnits - baseline.averageUnits) / baseline.averageUnits) * 100)
    : 0;

  if (options?.hasCrossedSubsidyCliff) {
    return {
      status: 'CHECK',
      reasonEn: 'Usage crossed the 240-unit threshold. ₹148 state subsidy is discontinued this cycle.',
      reasonMl: 'ഉപയോഗം 240 യൂണിറ്റ് കഴിഞ്ഞതിനാൽ സബ്സിഡി ഇളവ് നഷ്ടപ്പെട്ടു.',
      deviationPercent,
      dominantDriver: '240-Unit Subsidy Ceiling Exceeded',
    };
  }

  if (options?.isTariffChanged) {
    return {
      status: 'CHECK',
      reasonEn: 'Statutory tariff or fuel surcharge rate updated by electricity regulatory commission.',
      reasonMl: 'റെഗുലേറ്ററി കമ്മീഷന്റെ പുതിയ നിരക്ക് പ്രാബല്യത്തിൽ വന്നു.',
      deviationPercent,
      dominantDriver: 'Tariff Schedule Revision',
    };
  }

  if (Math.abs(deviationPercent) > 50) {
    return {
      status: 'UNUSUAL',
      reasonEn: `Consumption is ${Math.abs(deviationPercent)}% ${deviationPercent > 0 ? 'above' : 'below'} your established average (~${baseline.averageUnits} units).`,
      reasonMl: `സാധാരണ ശരാശരിയേക്കാൾ (~${baseline.averageUnits} യൂണിറ്റ്) ${Math.abs(deviationPercent)}% ${deviationPercent > 0 ? 'കൂടുതൽ' : 'കുറവ്'}.`,
      deviationPercent,
      dominantDriver: deviationPercent > 0 ? 'Surge in Consumption' : 'Drop in Consumption',
    };
  }

  if (Math.abs(deviationPercent) > 20) {
    return {
      status: 'CHECK',
      reasonEn: `Usage is ${Math.abs(deviationPercent)}% ${deviationPercent > 0 ? 'above' : 'below'} normal average (~${baseline.averageUnits} units).`,
      reasonMl: `ശരാശരിയേക്കാൾ ${Math.abs(deviationPercent)}% ${deviationPercent > 0 ? 'കൂടുതൽ' : 'കുറവ്'}.`,
      deviationPercent,
      dominantDriver: 'Moderate Usage Variance',
    };
  }

  return {
    status: 'NORMAL',
    reasonEn: `Usage is consistent with your typical pattern (~${baseline.averageUnits} units / cycle).`,
    reasonMl: 'ഉപയോഗം സാധാരണ നിലയിൽ തുടരുന്നു.',
    deviationPercent,
    dominantDriver: 'Steady Consumption',
  };
}

/**
 * Normalizes consumption across different billing cycles (Section 20: Normalize Usage).
 * Prevents comparing 120 units monthly directly against 240 units bi-monthly.
 */
export function normalizeUsageMetrics(
  units: number,
  billingCycle: BillingCycle = 'bi-monthly'
): {
  dailyAverageUnits: number;
  monthlyEquivalentUnits: number;
  cycleUnits: number;
  cycleDays: number;
  labelEn: string;
} {
  const cycleDays = billingCycle === 'monthly' ? 30 : 60;
  const dailyAverageUnits = Number((units / cycleDays).toFixed(2));
  const monthlyEquivalentUnits = Math.round(dailyAverageUnits * 30);

  return {
    dailyAverageUnits,
    monthlyEquivalentUnits,
    cycleUnits: units,
    cycleDays,
    labelEn: `${units} units (${dailyAverageUnits} u/day, ~${monthlyEquivalentUnits} u/month equivalent)`,
  };
}

/**
 * Canonical Indian Rupee Money Formatter (Section 45: Currency / Number Formatting).
 * Correctly formats Lakhs (1,00,000), Crores (1,00,00,000), negative adjustments, and zero.
 */
export function formatInr(amount: number, options?: { showPaise?: boolean }): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (options?.showPaise) {
    const formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNegative ? `−₹${formatted}` : `₹${formatted}`;
  }

  const rounded = Math.round(absAmount);
  const formatted = rounded.toLocaleString('en-IN');
  return isNegative ? `−₹${formatted}` : `₹${formatted}`;
}
