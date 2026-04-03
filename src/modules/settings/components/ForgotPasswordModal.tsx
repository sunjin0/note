'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/core/utils';
import { useTranslation } from '@/core/i18n';
import { Button } from '@/core/ui/button';
import { apiSendEmailCode, apiForgotPassword } from '@/core/api/auth';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { isValidEmail } from '@/core/storage';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin?: () => void;
}

type Step = 'email' | 'reset';

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setFieldErrors({});
    setCountdown(0);
    setSuccess(false);
  };

  const validateEmail = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!email) {
      errors.email = t('auth.emailRequired');
    } else if (!isValidEmail(email)) {
      errors.email = t('auth.invalidEmail');
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!code) {
      errors.code = t('auth.codeRequired');
    }
    
    if (!newPassword) {
      errors.newPassword = t('auth.passwordRequired');
    } else if (newPassword.length < 6) {
      errors.newPassword = t('auth.passwordTooShort');
    }
    
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = t('auth.passwordMismatch');
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) return;
    
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      const response = await apiSendEmailCode(email, 'forgot_password');
      
      if (response.success) {
        setStep('reset');
        setCountdown(60);
      } else {
        if (response.fieldErrors) {
          const translatedErrors: Record<string, string> = {};
          Object.entries(response.fieldErrors).forEach(([key, value]) => {
            translatedErrors[key] = t(value);
          });
          setFieldErrors(translatedErrors);
        }
        if (response.error) {
          setError(t(response.error));
        }
      }
    } catch (err) {
      setError(t('auth.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateResetForm()) return;
    
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      const response = await apiForgotPassword(email, code, newPassword);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onBackToLogin?.();
          onClose();
        }, 2000);
      } else {
        if (response.fieldErrors) {
          const translatedErrors: Record<string, string> = {};
          Object.entries(response.fieldErrors).forEach(([key, value]) => {
            translatedErrors[key] = t(value);
          });
          setFieldErrors(translatedErrors);
        }
        if (response.error) {
          setError(t(response.error));
        }
      }
    } catch (err) {
      setError(t('auth.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-elevated border border-border animate-scale-in">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            {step === 'reset' && (
              <button
                onClick={() => {
                  setStep('email');
                  setError(null);
                  setFieldErrors({});
                }}
                className="rounded-lg p-1.5 hover:bg-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t('auth.forgotPasswordTitle')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === 'email' 
                  ? t('auth.forgotPasswordSubtitle') 
                  : t('auth.resetPasswordSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-foreground">
                  {t('auth.passwordResetSuccess')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('auth.redirectingToLogin')}
                </p>
              </div>
            </div>
          ) : step === 'email' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className={cn(
                      'w-full pl-10 pr-3 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      fieldErrors.email
                        ? 'border-destructive focus:ring-destructive/20'
                        : 'border-input focus:ring-primary/20 focus:border-primary'
                    )}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <Button
                onClick={handleSendCode}
                disabled={isLoading || countdown > 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('auth.sendingCode')}
                  </>
                ) : countdown > 0 ? (
                  t('auth.resendCodeIn', { seconds: countdown })
                ) : (
                  t('auth.sendCode')
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.verificationCode')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('auth.codePlaceholder')}
                    maxLength={6}
                    className={cn(
                      'w-full pl-10 pr-3 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      fieldErrors.code
                        ? 'border-destructive focus:ring-destructive/20'
                        : 'border-input focus:ring-primary/20 focus:border-primary'
                    )}
                  />
                </div>
                {fieldErrors.code && (
                  <p className="text-xs text-destructive">{fieldErrors.code}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    className={cn(
                      'w-full pl-10 pr-10 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      fieldErrors.newPassword
                        ? 'border-destructive focus:ring-destructive/20'
                        : 'border-input focus:ring-primary/20 focus:border-primary'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.newPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.confirmNewPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    className={cn(
                      'w-full pl-10 pr-10 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      fieldErrors.confirmPassword
                        ? 'border-destructive focus:ring-destructive/20'
                        : 'border-input focus:ring-primary/20 focus:border-primary'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('auth.resettingPassword')}
                  </>
                ) : (
                  t('auth.resetPasswordButton')
                )}
              </Button>
            </>
          )}

          {!success && (
            <div className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-primary hover:underline"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
