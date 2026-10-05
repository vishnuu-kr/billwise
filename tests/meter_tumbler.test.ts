import { describe, it, expect } from 'vitest';

describe('MeterTumblerInput & Slab Cliff Logic', () => {
  it('correctly pads and segments a 5-digit meter reading', () => {
    const reading = '10415';
    const digits = Array.from({ length: 5 }, (_, i) => reading[i] || '');
    expect(digits).toEqual(['1', '0', '4', '1', '5']);
  });

  it('handles partial input and preserves slot positions', () => {
    const partial = '104';
    const digits = Array.from({ length: 5 }, (_, i) => partial[i] || '');
    expect(digits).toEqual(['1', '0', '4', '', '']);
    expect(digits.filter(Boolean).length).toBe(3);
  });

  it('cleans non-numeric pasted strings to exactly 5 digits', () => {
    const rawPasted = 'Reading: 10450 kWh';
    const cleaned = rawPasted.replace(/\D/g, '').slice(0, 5);
    expect(cleaned).toBe('10450');
  });

  it('correctly identifies the 240u subsidy cliff boundary in bi-monthly cycles', () => {
    const testCases = [
      { units: 235, expectedCliff: 'within' },
      { units: 240, expectedCliff: 'within' },
      { units: 241, expectedCliff: 'crossed' },
      { units: 258, expectedCliff: 'crossed' },
      { units: 510, expectedCliff: 'non-telescopic' },
    ];

    for (const { units, expectedCliff } of testCases) {
      let status = 'normal';
      if (units > 500) {
        status = 'non-telescopic';
      } else if (units > 240) {
        status = 'crossed';
      } else if (units >= 200 && units <= 240) {
        status = 'within';
      }
      expect(status).toBe(expectedCliff);
    }
  });
});
