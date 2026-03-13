'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import zhCN from './zh-CN.json';
import enUS from './en-US.json';

export type Locale = 'zh-CN' | 'en-US';

const resources = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'mood_journal_locale';

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return undefined;
    value = value[key];
  }
  return value;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh-CN');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(STORAGE_KEY) as Locale;
    if (saved && resources[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string | any => {
      const resource = resources[locale];
      const value = getNestedValue(resource, key);
      
      // Return arrays directly without string conversion
      if (Array.isArray(value)) {
        return value;
      }
      
      let text = typeof value === 'string' ? value : key;

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }

      return text;
    },
    [locale]
  );

  // Always provide context, even during SSR
  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within an I18nProvider');
  }
  return { locale: context.locale, setLocale: context.setLocale };
}

// Helper functions for mood and factor labels
export function useMoodLabel(mood: string): string {
  const { t } = useTranslation();
  return t(`mood.${mood}`);
}

export function useFactorLabel(factorId: string, customLabel?: string): string {
  const { t } = useTranslation();
  // If customLabel is provided (for custom factors), use it directly
  if (customLabel) {
    return customLabel;
  }
  return t(`factors.${factorId}`);
}
