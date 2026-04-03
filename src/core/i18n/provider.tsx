'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import { Locale, I18nContextType, I18nProviderProps } from '@/core';

const resources = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'mood_journal_locale';

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let value: unknown = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

export function I18nProvider({ children }: I18nProviderProps) {
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
    <T = string,>(key: string, params?: Record<string, string | number>): T => {
      const resource = resources[locale];
      const value = getNestedValue(resource, key);

      // Return arrays as-is
      if (Array.isArray(value)) {
        return value as T;
      }

      let text = typeof value === 'string' ? value : key;

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = (text as string).replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }

      return text as T;
    },
    [locale]
  );

  // Always provide context, even during SSR
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
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
  return t(`mood.${mood}`) as string;
}

export function useFactorLabel(factorId: string, customLabel?: string): string {
  const { t } = useTranslation();
  // If customLabel is provided (for custom factors), use it directly
  if (customLabel) {
    return customLabel;
  }
  return t(`factors.${factorId}`) as string;
}
