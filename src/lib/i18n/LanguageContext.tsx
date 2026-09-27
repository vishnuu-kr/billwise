'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '@/types';
import { translations } from './translations';

interface LanguageContextType {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  toggleLang: () => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('billwise_lang_v1') as SupportedLanguage | null;
      if (saved === 'en' || saved === 'ml') {
        setLangState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = (newLang: SupportedLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem('billwise_lang_v1', newLang);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ml' : 'en');
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
