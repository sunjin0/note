'use client';

import { useState, useEffect } from 'react';
import { I18nProvider } from '@/lib/i18n';
import PasswordLock from './PasswordLock';
import { isPasswordEnabled, isSessionValid } from '@/lib/storage';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const passwordEnabled = isPasswordEnabled();
    const sessionValid = isSessionValid();
    
    if (!passwordEnabled || sessionValid) {
      setIsUnlocked(true);
    }
    setIsLoading(false);
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
    <I18nProvider>
      {!isUnlocked && <PasswordLock onUnlock={handleUnlock} />}
      {isUnlocked && children}
    </I18nProvider>
  );
}
