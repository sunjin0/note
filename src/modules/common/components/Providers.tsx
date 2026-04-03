'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { I18nProvider } from '@/core/i18n';
import PasswordLock from '@/modules/settings/components/PasswordLock';
import { isPasswordEnabled, isSessionValid, initAuth } from '@/core/storage';
import { GlobalProvider } from '@/core/context';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'mood-journal-theme';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  const resolveTheme = useCallback((currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }, [theme, mounted, resolveTheme]);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(resolved);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await initAuth();

      const passwordEnabled = isPasswordEnabled();
      const sessionValid = isSessionValid();

      if (!passwordEnabled || sessionValid) {
        setIsUnlocked(true);
      }
      setIsLoading(false);
    };

    initialize();
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <GlobalProvider>
      <ThemeProvider>
        <I18nProvider>
          {!isUnlocked && <PasswordLock onUnlock={handleUnlock} />}
          {isUnlocked && children}
        </I18nProvider>
      </ThemeProvider>
    </GlobalProvider>
  );
}
