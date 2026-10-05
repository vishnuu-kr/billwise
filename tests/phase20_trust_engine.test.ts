import { describe, it, expect } from 'vitest';
import {
  buildBillEvidence,
  evaluateTrustGate,
  recordUserCorrection,
} from '../src/lib/trust/evidenceEngine';
import {
  generateCalculationTrace,
  replayCalculation,
  diffCalculationEngines,
  CURRENT_ENGINE_VERSION,
} from '../src/lib/trust/replayEngine';
import { reconcileBillWithCalculation } from '../src/lib/trust/reconciliationEngine';
import { calculateUniversalBill } from '../src/lib/electricity/engine/universalEngine';
import { UNIVERSAL_TARIFF_REGISTRY } from '../src/lib/electricity/tariffs/registry';
import {
  SAMPLE_KSEB_REFERENCE_BILL,
  SAMPLE_KSEB_HIGH_USAGE_BILL,
} from '../src/lib/ocr/extractor';
import { UniversalBillInput } from '../src/lib/electricity/types';
import { BillCalculationResult } from '../src/types';

describe('Phase 20: BillWise Trust Engine / Evidence / Confidence / Self-Correction', () => {
  const ksebTariff = UNIVERSAL_TARIFF_REGISTRY['kseb-lt1a-2024'];
  const bescomTariff = UNIVERSAL_TARIFF_REGISTRY['bescom-lt2a-2024'];

  describe('1. The Four Knowledge Categories (KNOWN, CALCULATED, ESTIMATED, UNCERTAIN)', () => {
    it('properly categorizes known bill facts, tariff derivations, predictions, and inferences without conflation', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
        connectedLoadKw: 1,
      };
      const result = calculateUniversalBill(input, ksebTariff);

      const evidence = buildBillEvidence({
        providerId: 'kseb',
        tariffVersionId: 'kseb-lt1a-2024',
        extracted: SAMPLE_KSEB_REFERENCE_BILL,
        calculatedResult: result,
      });

      // KNOWN: Extracted directly from official bill
      expect(evidence.fields['officialTotal'].kind).toBe('KNOWN');
      expect(evidence.fields['officialTotal'].source).toBe('bill_ocr_exact');
      expect(evidence.fields['officialTotal'].value).toBe(1148);

      expect(evidence.fields['previousReading'].kind).toBe('KNOWN');
      expect(evidence.fields['presentReading'].kind).toBe('KNOWN');

      // CALCULATED: Derived deterministically via tariff rules
      expect(evidence.fields['energyCharge'].kind).toBe('CALCULATED');
      expect(evidence.fields['energyCharge'].source).toBe('tariff_rule');
      expect(evidence.fields['fixedCharge'].kind).toBe('CALCULATED');
      expect(evidence.fields['duty'].kind).toBe('CALCULATED');
      expect(evidence.fields['totalCalculated'].kind).toBe('CALCULATED');

      // Counts check
      expect(evidence.assessment.knownFactsCount).toBeGreaterThanOrEqual(4);
      expect(evidence.assessment.calculatedCount).toBeGreaterThanOrEqual(4);
    });

    it('marks run-rate cycle projections as ESTIMATED, never as KNOWN facts', () => {
      const evidence = buildBillEvidence({
        providerId: 'kseb',
        predictionResult: {
          daysElapsed: 15,
          daysRemaining: 45,
          totalCycleDays: 60,
          currentUnits: 60,
          unitsPerDay: 4.0,
          projectedUnits: 240,
          estimatedBill: 1148,
          likelyRangeMin: 1080,
          likelyRangeMax: 1220,
          confidence: 'high',
          confidenceReason: 'Consistent pace',
          approachingSlab: null,
          predictionModelVersion: '2.0.0',
          calculatedBillResult: {} as unknown as BillCalculationResult,
        },
      });

      expect(evidence.fields['predictedTotal'].kind).toBe('ESTIMATED');
      expect(evidence.fields['predictedTotal'].source).toBe('cycle_projection');
      expect(evidence.fields['consumedUnits'].kind).toBe('ESTIMATED');
      expect(evidence.assessment.estimatedCount).toBeGreaterThanOrEqual(2);
    });

    it('marks unverified or safe default fallbacks as UNCERTAIN', () => {
      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: {
          // Missing phase and tariff
          consumedUnits: 100,
        },
      });

      expect(evidence.fields['phase'].kind).toBe('UNCERTAIN');
      expect(evidence.fields['phase'].source).toBe('inferred_default');
      expect(evidence.fields['tariff'].kind).toBe('UNCERTAIN');
      expect(evidence.assessment.uncertainCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Conflict Resolution Hierarchy (User > OCR > Reading Diff > Inferred Default)', () => {
    it('gives Priority 1 to User manual corrections and marks status as user_confirmed with 1.0 confidence', () => {
      const corrections = recordUserCorrection([], 'consumedUnits', 250, 240, 'Corrected wrong OCR digit');

      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: SAMPLE_KSEB_REFERENCE_BILL, // has consumedUnits: 240
        userCorrections: corrections,
      });

      // Must be 250 from user, NOT 240 from OCR
      expect(evidence.fields['consumedUnits'].value).toBe(250);
      expect(evidence.fields['consumedUnits'].originalValue).toBe(240);
      expect(evidence.fields['consumedUnits'].source).toBe('user_manual_input');
      expect(evidence.fields['consumedUnits'].status).toBe('user_confirmed');
      expect(evidence.fields['consumedUnits'].confidence).toBe(1.0);
    });

    it('gives Priority 2 to explicit OCR field over arithmetic reading diff', () => {
      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: {
          previousReading: 1000,
          presentReading: 1250, // diff is 250
          consumedUnits: 240,   // printed field on bill
          fieldConfidences: {
            consumedUnits: 0.95,
          },
        },
      });

      expect(evidence.fields['consumedUnits'].value).toBe(240);
      expect(evidence.fields['consumedUnits'].source).toBe('bill_ocr_exact');
    });

    it('falls back to arithmetic reading diff (Priority 3) when explicit consumption field is absent', () => {
      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: {
          previousReading: 1000,
          presentReading: 1240,
          // consumedUnits missing
        },
      });

      expect(evidence.fields['consumedUnits'].value).toBe(240);
      expect(evidence.fields['consumedUnits'].kind).toBe('CALCULATED');
      expect(evidence.fields['consumedUnits'].source).toBe('computed_derived');
      expect(evidence.fields['consumedUnits'].notes).toContain('1240 − 1000 = 240 kWh');
    });

    it('never silently reverts a user correction across recalculation passes', () => {
      let corrections = recordUserCorrection([], 'presentReading', 10300, 10295);
      corrections = recordUserCorrection(corrections, 'presentReading', 10310, 10295);

      expect(corrections.length).toBe(1);
      expect(corrections[0].correctedValue).toBe(10310);
      expect(corrections[0].originalOcrValue).toBe(10295);
    });
  });

  describe('3. Weakest Link Invariant & Confidence Degradation', () => {
    it('degrades overall confidence when a critical field has low confidence, even if other fields are 99%', () => {
      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: {
          tariff: 'LT-1A',
          previousReading: 1000,
          presentReading: 1200,
          consumedUnits: 200,
          fieldConfidences: {
            tariff: 0.99,
            previousReading: 0.99,
            presentReading: 0.99,
            consumedUnits: 0.40, // Blurry low-confidence OCR digit!
          },
        },
      });

      // Weakest Link Invariant: overall confidence CANNOT remain high
      expect(evidence.assessment.overallConfidenceScore).toBe(0.40);
      expect(evidence.assessment.weakestField).toBe('consumedUnits');
      expect(evidence.assessment.grade).toBe('CANNOT_VERIFY');
      expect(evidence.assessment.resultState).toBe('REVIEW_REQUIRED');
    });

    it('flags reading difference contradictions and drops overall confidence', () => {
      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: {
          previousReading: 1000,
          presentReading: 1200, // diff = 200
          consumedUnits: 350,   // contradiction!
          consistencyCheck: {
            isConsistent: false,
            extractedUnits: 350,
            computedUnits: 200,
            warningMessage: 'Reading difference does not match bill consumption',
          },
        },
      });

      expect(evidence.assessment.warnings.some((w) => w.includes('Discrepancy'))).toBe(true);
      expect(evidence.assessment.overallConfidenceScore).toBeLessThanOrEqual(0.49);
      expect(evidence.assessment.grade).toBe('LIMITED_CONFIDENCE');
    });

    it('awards HIGH_CONFIDENCE when all critical parameters are verified directly', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
      };
      const result = calculateUniversalBill(input, ksebTariff);

      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: SAMPLE_KSEB_REFERENCE_BILL,
        calculatedResult: result,
        rawImageConfidence: 0.98,
      });

      expect(evidence.assessment.grade).toBe('HIGH_CONFIDENCE');
      expect(evidence.assessment.resultState).toBe('FULL_RESULT');
      expect(evidence.assessment.overallConfidenceScore).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('4. Deterministic Calculation Trace & Bit-for-Bit Replay', () => {
    it('generates a machine-readable step-by-step trace covering all calculation stages', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
        connectedLoadKw: 1,
      };
      const result = calculateUniversalBill(input, ksebTariff);
      const trace = generateCalculationTrace(result, input, ksebTariff);

      expect(trace.engineVersion).toBe(CURRENT_ENGINE_VERSION);
      expect(trace.providerId).toBe('kseb');
      expect(trace.tariffVersionId).toBe('kseb-lt1a-2024');
      expect(trace.finalPayable).toBe(1148);
      expect(trace.isReplayable).toBe(true);

      const stages = trace.steps.map((s) => s.stage);
      expect(stages).toContain('INPUT');
      expect(stages).toContain('TARIFF');
      expect(stages).toContain('SLAB');
      expect(stages).toContain('FIXED');
      expect(stages).toContain('VARIABLE');
      expect(stages).toContain('DUTY');
      expect(stages).toContain('METER_RENT');
      expect(stages).toContain('SUBSIDY');
      expect(stages).toContain('FINAL');

      // The last step must match final payable exactly
      const finalStep = trace.steps[trace.steps.length - 1];
      expect(finalStep.stepAmount).toBe(1148);
      expect(finalStep.runningTotal).toBe(1148);
    });

    it('guarantees bit-for-bit replayability from snapshot metadata without drift', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 520,
        billingCycle: 'BIMONTHLY',
        phase: 'three',
        connectedLoadKw: 4.5,
      };
      const result = calculateUniversalBill(input, ksebTariff);
      const trace = generateCalculationTrace(result, input, ksebTariff);

      // Replay calculation from trace alone
      const replay = replayCalculation(trace);

      expect(replay.matches).toBe(true);
      expect(replay.discrepancies.length).toBe(0);
      expect(replay.replayedTotal).toBe(trace.finalPayable);
      expect(replay.replayedResult.subtotal).toBe(trace.subtotal);
    });

    it('correctly compares differences across different tariff versions using diffCalculationEngines', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
      };

      // Create a modified future tariff with ₹0.50 rate increase per slab
      const futureTariff = {
        ...ksebTariff,
        id: 'kseb-lt1a-2025-preview',
        telescopicSlabs: ksebTariff.telescopicSlabs.map((s) => ({
          ...s,
          ratePerUnit: s.ratePerUnit + 0.50,
        })),
      };

      const diff = diffCalculationEngines(input, ksebTariff, futureTariff);

      expect(diff.totalDifference).toBeGreaterThan(0);
      expect(diff.percentDifference).toBeGreaterThan(0);
      expect(diff.slabDifferences.every((s) => s.diff === 0.50)).toBe(true);
    });
  });

  describe('5. Component Reconciliation Engine & Difference Attributor', () => {
    it('audits calculated bill against official bill and identifies exact/near matches', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
        connectedLoadKw: 1,
      };
      const result = calculateUniversalBill(input, ksebTariff);

      const report = reconcileBillWithCalculation(SAMPLE_KSEB_REFERENCE_BILL, result);

      expect(report.calculatedTotal).toBe(1148);
      expect(report.officialTotal).toBe(1148);
      expect(report.totalDifference).toBe(0);
      expect(report.overallStatus).toBe('MATCH');
      expect(report.dominantReason).toBeNull();
      expect(report.dominantExplanation).toContain('match the official bill payable amount exactly');

      // Verify line items
      const energyItem = report.items.find((i) => i.componentId === 'energy_charge')!;
      expect(['MATCH', 'NEAR_MATCH']).toContain(energyItem.status);
      expect(energyItem.calculatedAmount).toBeCloseTo(973.8, 1);

      const fixedItem = report.items.find((i) => i.componentId === 'fixed_charge')!;
      expect(fixedItem.status).toBe('MATCH');
      expect(fixedItem.calculatedAmount).toBe(210);
    });

    it('attributes dominant root cause to FAC variance when fuel surcharge differs', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
      };
      const result = calculateUniversalBill(input, ksebTariff);

      // Simulate a bill where official fuel surcharge was ₹50 instead of standard ₹2.40
      const billWithFacDiff = {
        ...SAMPLE_KSEB_REFERENCE_BILL,
        fuelAdjustment: 52.40,
        totalAmount: 1198, // diff is ₹50
      };

      const report = reconcileBillWithCalculation(billWithFacDiff, result);

      expect(report.overallStatus).toBe('DIFFERENCE');
      expect(report.dominantReason).toBe('FAC_VARIANCE');
      expect(report.dominantExplanation).toContain('Fuel Surcharge (FAC)');
    });

    it('attributes commercial rounding when difference is <= ₹1.00', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 240,
        billingCycle: 'BIMONTHLY',
        phase: 'single',
      };
      const result = calculateUniversalBill(input, ksebTariff);

      const billWithRounding = {
        ...SAMPLE_KSEB_REFERENCE_BILL,
        totalAmount: 1147.40,
      };

      const report = reconcileBillWithCalculation(billWithRounding, result);

      expect(report.overallStatus).toBe('NEAR_MATCH');
      expect(report.dominantReason).toBe('ROUNDING_VARIANCE');
      expect(report.dominantExplanation).toContain('rounding difference');
    });

    it('flags non-telescopic threshold surpass when units exceed 500', () => {
      const input: UniversalBillInput = {
        providerId: 'kseb',
        units: 520,
        billingCycle: 'BIMONTHLY',
        phase: 'three',
        connectedLoadKw: 4.5,
      };
      const result = calculateUniversalBill(input, ksebTariff);

      const highBillWithDiff = {
        ...SAMPLE_KSEB_HIGH_USAGE_BILL,
        totalAmount: 4900, // differs from calculated
      };

      const report = reconcileBillWithCalculation(highBillWithDiff, result);

      expect(report.overallStatus).toBe('DIFFERENCE');
      expect(report.dominantReason).toBe('TELESCOPIC_THRESHOLD_SURPASS');
    });
  });

  describe('6. BESCOM Cross-Licensee Trust & Trace Verification', () => {
    it('verifies BESCOM LT-2(a) produces an auditable trace and matches expected slabs', () => {
      const input: UniversalBillInput = {
        providerId: 'bescom',
        units: 150,
        billingCycle: 'MONTHLY',
        phase: 'single',
        connectedLoadKw: 2,
      };
      const result = calculateUniversalBill(input, bescomTariff);
      const trace = generateCalculationTrace(result, input, bescomTariff);

      expect(trace.providerId).toBe('bescom');
      expect(trace.tariffVersionId).toBe('bescom-lt2a-2024');
      expect(trace.steps.length).toBeGreaterThanOrEqual(5);

      const replay = replayCalculation(trace);
      expect(replay.matches).toBe(true);
      expect(replay.replayedTotal).toBe(trace.finalPayable);
    });
  });

  describe('7. No Fake Certainty & Fail-Safe Safeguards', () => {
    it('never outputs deceptive 100% certainty claims in assessment explanation', () => {
      const evidence = buildBillEvidence({
        providerId: 'kseb',
        extracted: SAMPLE_KSEB_REFERENCE_BILL,
      });

      expect(evidence.assessment.explanation).not.toContain('100% accurate');
      expect(evidence.assessment.explanation).not.toContain('guaranteed');
      expect(evidence.assessment.explanation).not.toContain('error-free');
    });

    it('enforces NO_CALCULATION_POSSIBLE when critical consumption cannot be resolved', () => {
      const assessment = evaluateTrustGate({
        providerId: {
          name: 'providerId',
          label: 'Provider',
          value: 'kseb',
          kind: 'KNOWN',
          source: 'bill_ocr_exact',
          confidence: 0.95,
          status: 'verified',
          updatedAt: '',
        },
        tariff: {
          name: 'tariff',
          label: 'Tariff',
          value: 'LT-1A',
          kind: 'KNOWN',
          source: 'bill_ocr_exact',
          confidence: 0.95,
          status: 'verified',
          updatedAt: '',
        },
        // consumedUnits is MISSING completely!
      });

      expect(assessment.grade).toBe('CANNOT_VERIFY');
      expect(assessment.resultState).toBe('NO_CALCULATION_POSSIBLE');
      expect(assessment.warnings.some((w) => w.includes('consumedUnits'))).toBe(true);
    });
  });
});
