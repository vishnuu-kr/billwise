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
 * Natural language parser for common Kerala Manglish phrases and keywords
 */
export function parseManglishQuery(query: string, lang: 'en' | 'ml' = 'ml'): ManglishParseResult | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  // Case 1: "240 units aayal ethra?" / "240 unit bill ethra?" / "150 units" / "240 യൂണിറ്റ്" / "240"
  const unitsMatch =
    clean.match(/^([0-9]{2,4})\s*(?:units?|unit|യൂണിറ്റ്|u)?$/i) ||
    clean.match(/([0-9]{1,5})\s*(?:units?|unit|യൂണിറ്റ്|u\b)\s*(?:aayal|aano|varum|ethra|bill|ബിൽ)?/i);

  if (unitsMatch) {
    const units = parseInt(unitsMatch[1], 10);
    try {
      const calc = calculateBill({ units, billingCycle: 'bi-monthly', phase: 'single' });
      return {
        intent: 'calculate_units',
        extractedUnits: units,
        directAnswer:
          lang === 'ml'
            ? `${units} യൂണിറ്റിന് രണ്ട് മാസത്തെ പ്രതീക്ഷിക്കുന്ന ബിൽ തുക ഏകദേശം ₹${calc.total.toLocaleString('en-IN')} ആണ്.`
            : `Estimated bi-monthly bill for ${units} units is approximately ₹${calc.total.toLocaleString('en-IN')}.`,
        suggestedAction: {
          label: lang === 'ml' ? 'വിശദമായി കാണുക (View Details)' : 'View Bill Details',
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
      directAnswer:
        lang === 'ml'
          ? `ഇന്നത്തെ മീറ്റർ റീഡിംഗ് ${reading} ആയി രേഖപ്പെടുത്തി.`
          : `Meter reading ${reading} recorded.`,
      suggestedAction: {
        label: lang === 'ml' ? 'ബിൽ കണക്കാക്കുക (Predict Bill)' : 'Predict Bill from Reading',
        href: `/predict?reading=${reading}`,
      },
    };
  }

  // Case 3: "slab cliff limit" / "slab" / "subsidy limit" / "സ്ലാബ് പരിധി"
  if (/slab|cliff|subsidy|സ്ലാബ്|പരിധി/i.test(clean)) {
    return {
      intent: 'general_query',
      directAnswer:
        lang === 'ml'
          ? 'കേരളത്തിൽ 240 യൂണിറ്റ് വരെയാണ് സാധാരണ ഗാർഹിക സബ്‌സിഡി ലഭിക്കുക. 240 യൂണിറ്റ് കഴിഞ്ഞാൽ സബ്‌സിഡി അവസാനിക്കും; 500 യൂണിറ്റ് കഴിഞ്ഞാൽ ഉയർന്ന നോൺ-ടെലിസ്കോപ്പിക് നിരക്ക് ബാധകമാകും.'
          : 'In Kerala, domestic energy subsidies apply up to 240 units bi-monthly. Above 240 units subsidy ends, and above 500 units high non-telescopic rates apply.',
      suggestedAction: {
        label: lang === 'ml' ? 'താരിഫ് സ്ലാബുകൾ അറിയുക (Tariff Rules)' : 'View Tariff Rules',
        href: '/tariff',
      },
    };
  }

  // Case 4: "solar net meter" / "solar" / "സോളാർ"
  if (/solar|സോളാർ|net\s*meter|നെറ്റ്\s*മീറ്റർ/i.test(clean)) {
    return {
      intent: 'general_query',
      directAnswer:
        lang === 'ml'
          ? 'സോളാർ നെറ്റ് മീറ്ററിംഗിൽ നിങ്ങൾ KSEB ഗ്രിഡിലേക്ക് നൽകുന്ന യൂണിറ്റുകൾ കുറച്ച ശേഷമുള്ള നെറ്റ് യൂണിറ്റിനാണ് ബിൽ ഈടാക്കുന്നത്.'
          : 'Under KSEB solar net metering, exported units are netted against consumed units so you only pay for net consumption.',
      suggestedAction: {
        label: lang === 'ml' ? 'സിമുലേറ്റർ പരിശോധിക്കാം (Simulator)' : 'Open Simulator',
        href: '/what-if',
      },
    };
  }

  // Case 5: "bill kurakkan engane?" / "kseb bill kurakkan tips" / "ac upayogam"
  if (/kurakk|reduce|save|tips|engane|കുറയ്|ac\s*upayogam/i.test(clean)) {
    return {
      intent: 'ask_reduction',
      directAnswer:
        lang === 'ml'
          ? 'വൈദ്യുതി ബിൽ കുറയ്ക്കാൻ എസിയുടെ താപനില 24-26°C ആക്കുക, ആവശ്യമില്ലാത്ത ലൈറ്റുകൾ അണയ്ക്കുക, 240 യൂണിറ്റ് സബ്‌സിഡി പരിധിക്കുള്ളിൽ ഉപയോഗം നിർത്തുക.'
          : 'Keep AC temperature at 24–26°C, turn off phantom standby devices, and stay within 240 units to retain government subsidies.',
      suggestedAction: {
        label: lang === 'ml' ? 'ഉപകരണങ്ങളുടെ കണക്കെടുക്കാം (Appliance Estimator)' : 'Explore Appliance Usage',
        href: '/appliances',
      },
    };
  }

  // Case 6: "ente bill ethra varum?" / "next bill"
  if (/ethra\s*varum|bill\s*ethra|how\s*much|എത്ര/i.test(clean)) {
    return {
      intent: 'general_query',
      directAnswer:
        lang === 'ml'
          ? 'നിങ്ങളുടെ മീറ്റർ റീഡിംഗോ കഴിഞ്ഞ ബില്ലോ നൽകിയാൽ അടുത്ത ബിൽ തുക കൃത്യമായി കണക്കാക്കാം.'
          : 'Enter your latest meter reading or last bill to project your next bi-monthly KSEB bill.',
      suggestedAction: {
        label: lang === 'ml' ? 'ഇപ്പോൾ പരിശോധിക്കാം (Predict Now)' : 'Calculate Now',
        href: '/predict',
      },
    };
  }

  return null;
}
