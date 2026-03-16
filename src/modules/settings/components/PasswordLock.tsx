'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, HelpCircle, KeyRound } from 'lucide-react';
import { Button } from '@/core/ui/button';
import type { SecuritySettings } from '@/core/storage';
import { 
  verifyPassword, 
  verifySecurityAnswers, 
  resetPassword, 
  getSecuritySettings,
  getLockoutStatus,
  createSession
} from '@/core/storage';
import { useTranslation } from '@/core/i18n';

type LockStep = 'password' | 'questions' | 'reset';

interface PasswordLockProps {
  onUnlock: () => void;
}

export default function PasswordLock({ onUnlock }: PasswordLockProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<LockStep>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [verifyAnswers, setVerifyAnswers] = useState(['', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lockoutStatus, setLockoutStatus] = useState({ isLocked: false, remainingMinutes: 0 });

  useEffect(() => {
    setSecuritySettings(getSecuritySettings());
    updateLockoutStatus();
    const interval = setInterval(updateLockoutStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const updateLockoutStatus = () => {
    setLockoutStatus(getLockoutStatus());
  };

  const handleVerifyPassword = () => {
    setError('');
    
    if (lockoutStatus.isLocked) {
      setError(t('settings.security.lockoutMessage').replace('{minutes}', String(lockoutStatus.remainingMinutes)));
      return;
    }
    
    if (verifyPassword(password)) {
      createSession();
      onUnlock();
    } else {
      const newStatus = getLockoutStatus();
      setLockoutStatus(newStatus);
      if (newStatus.isLocked) {
        setError(t('settings.security.lockoutMessage').replace('{minutes}', String(newStatus.remainingMinutes)));
      } else {
        setError(t('settings.security.passwordPlaceholder'));
      }
    }
  };

  const handleForgotPassword = () => {
    setStep('questions');
    setVerifyAnswers(['', '', '']);
    setError('');
  };

  const handleVerifyAnswers = () => {
    if (verifySecurityAnswers(verifyAnswers)) {
      setStep('reset');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } else {
      setError(t('settings.security.answersIncorrect'));
    }
  };

  const handleResetPassword = () => {
    setError('');
    
    if (newPassword.length < 6) {
      setError(t('settings.security.passwordTooShort'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t('settings.security.passwordMismatch'));
      return;
    }
    
    resetPassword(newPassword);
    setPassword(newPassword);
    setStep('password');
    setError(t('settings.security.passwordResetSuccess'));
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 mx-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('app.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('app.subtitle')}</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-lg p-6">
          {step === 'password' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold mb-1">{t('settings.security.passwordProtection')}</h2>
                <p className="text-sm text-muted-foreground">{t('settings.security.passwordPlaceholder')}</p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleVerifyPassword)}
                    placeholder={t('settings.security.passwordPlaceholder')}
                    disabled={lockoutStatus.isLocked}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={lockoutStatus.isLocked}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleVerifyPassword} 
                disabled={!password || lockoutStatus.isLocked}
                className="w-full py-3"
              >
                <Lock className="h-4 w-4 mr-2" />
                {t('settings.security.verifyIdentity')}
              </Button>

              <button
                onClick={handleForgotPassword}
                disabled={lockoutStatus.isLocked}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {t('settings.security.forgotPassword')}
              </button>
            </div>
          )}

          {step === 'questions' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-1">{t('settings.security.verifyIdentity')}</h2>
                <p className="text-sm text-muted-foreground">{t('settings.security.securityQuestionsDescription')}</p>
              </div>

              <div className="space-y-4">
                {securitySettings?.securityQuestions.map((q, index) => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{q.question}</label>
                    <input
                      type="text"
                      value={verifyAnswers[index] || ''}
                      onChange={(e) => {
                        const newAnswers = [...verifyAnswers];
                        newAnswers[index] = e.target.value;
                        setVerifyAnswers(newAnswers);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, handleVerifyAnswers)}
                      placeholder={t('settings.security.answerPlaceholder')}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('password')} className="flex-1">
                  {t('settings.security.back')}
                </Button>
                <Button onClick={handleVerifyAnswers} className="flex-1">
                  {t('settings.security.verifyAnswers')}
                </Button>
              </div>
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-1">{t('settings.security.resetPassword')}</h2>
                <p className="text-sm text-muted-foreground">{t('settings.security.passwordTooShort')}</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
                    placeholder={t('settings.security.newPassword')}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
                  placeholder={t('settings.security.confirmPassword')}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('questions')} className="flex-1">
                  {t('settings.security.back')}
                </Button>
                <Button onClick={handleResetPassword} className="flex-1">
                  {t('settings.security.save')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('settings.about.storageNote')}
        </p>
      </div>
    </div>
  );
}
