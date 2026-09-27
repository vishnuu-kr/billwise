import { calculateBill } from '@/lib/calculation/engine';

export interface ManglishParseResult {
  intent: 'calculate_units' | 'input_reading' | 'ask_reduction' | 'general_query';
  extractedUnits?: number;
  extractedReading?: number;
  readingType?: 'current' | 'previous';
  directAnswer?: string;
  suggestedAction?: {
    label: string;
    href: string;
  };
}

/**
 * Natural language parser for common Kerala Manglish phrases
 */
export function parseManglishQuery(query: string): ManglishParseResult | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  // Case 1: "240 units aayal ethra?" / "240 unit bill ethra?" / "150 units"
  const unitsMatch = clean.match(/([0-9]{1,5})\s*(?:units?|unit)\s*(?:aayal|aano|varum|ethra)?/i);
  if (unitsMatch) {
    const units = parseInt(unitsMatch[1], 10);
    try {
      const calc = calculateBill({ units, billingCycle: 'bi-monthly', phase: 'single' });
      return {
        intent: 'calculate_units',
        extractedUnits: units,
        directAnswer: `${units} യൂണിറ്റിന് രണ്ട് മാസത്തെ പ്രതീക്ഷിക്കുന്ന ബിൽ തുക ഏകദേശം ₹${calc.total.toLocaleString('en-IN')} ആണ്.`,
        suggestedAction: {
          label: 'വിശദമായി കാണുക (View Details)',
          href: `/result?units=${units}`,
        },
      };
    } catch {
      // Fall through
    }
  }

  // Case 2: "current reading 10412" / "innathe reading 10412" / "meter 10412"
  const readingMatch = clean.match(/(?:current|innathe|meter|reading)\s*(?:reading)?\s*[:=\s]*([0-9]{4,7})/i);
  if (readingMatch) {
    const reading = parseInt(readingMatch[1], 10);
    return {
      intent: 'input_reading',
      extractedReading: reading,
      readingType: 'current',
      directAnswer: `ഇന്നത്തെ മീറ്റർ റീഡിംഗ് ${reading} ആയി രേഖപ്പെടുത്തി.`,
      suggestedAction: {
        label: 'ബിൽ കണക്കാക്കുക (Predict Bill)',
        href: `/predict?reading=${reading}`,
      },
    };
  }

  // Case 3: "bill kurakkan engane?" / "kseb bill kurakkan tips" / "ac upayogam"
  if (/kurakk|reduce|save|tips|engane|ac\s*upayogam/i.test(clean)) {
    return {
      intent: 'ask_reduction',
      directAnswer: 'വൈദ്യുതി ബിൽ കുറയ്ക്കാൻ എസിയുടെ താപനില 24-26°C ആക്കുക, ആവശ്യമില്ലാത്ത ലൈറ്റുകൾ അണയ്ക്കുക, 240 യൂണിറ്റ് സബ്സിഡി പരിധിക്കുള്ളിൽ ഉപയോഗം നിർത്തുക.',
      suggestedAction: {
        label: 'ഉപകരണങ്ങളുടെ കണക്കെടുക്കാം (Appliance Estimator)',
        href: '/appliances',
      },
    };
  }

  // Case 4: "ente bill ethra varum?" / "next bill"
  if (/ethra\s*varum|bill\s*ethra|how\s*much/i.test(clean)) {
    return {
      intent: 'general_query',
      directAnswer: 'നിങ്ങളുടെ മീറ്റർ റീഡിംഗോ കഴിഞ്ഞ ബില്ലോ നൽകിയാൽ അടുത്ത ബിൽ തുക കൃത്യമായി കണക്കാക്കാം.',
      suggestedAction: {
        label: 'ഇപ്പോൾ പരിശോധിക്കാം (Predict Now)',
        href: '/predict',
      },
    };
  }

  return null;
}
