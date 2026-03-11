'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getSettings, saveSettings, exportData, clearAllData, getEntries, AppSettings,
  getSecuritySettings, setPassword, disablePassword, verifyPassword, resetPassword, verifySecurityAnswers,
  reEncryptAllEntries,
  DEFAULT_SECURITY_QUESTIONS, MIN_SECURITY_QUESTIONS, MAX_SECURITY_QUESTIONS, SecuritySettings
} from '@/lib/storage';
import { useTranslation, Locale } from '@/lib/i18n';
import { Shield, Download, Trash2, Info, Languages, Lock, Eye, EyeOff, KeyRound, HelpCircle, Plus, Trash2 as TrashIcon, Loader2 } from 'lucide-react';

interface SettingsProps {
  onDataChange: () => void;
}

const defaultSettings: AppSettings = { encrypted: false, createdAt: '' };

type SecurityStep = 'main' | 'setPassword' | 'changePasswordWithQuestions' | 'verifyQuestions' | 'resetPassword';

export default function SettingsView({ onDataChange }: SettingsProps) {
  const { t, locale, setLocale } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showExportDone, setShowExportDone] = useState(false);
  
  const [securityStep, setSecurityStep] = useState<SecurityStep>('main');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<{question: string; answer: string}[]>([
    { question: '', answer: '' },
  ]);
  const [verifyAnswers, setVerifyAnswers] = useState(['', '', '']);
  const [answerError, setAnswerError] = useState('');
  
  const [isReEncrypting, setIsReEncrypting] = useState(false);
  const [reEncryptProgress, setReEncryptProgress] = useState({ current: 0, total: 0 });
  const [reEncryptStatus, setReEncryptStatus] = useState<'idle' | 'encrypting' | 'decrypting' | 'success'>('idle');

  useEffect(() => {
    setMounted(true);
    setSettings(getSettings());
    setSecuritySettings(getSecuritySettings());
  }, []);

  const resetSecurityForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setPasswordError('');
    setShowPassword(false);
    setSelectedQuestions([{ question: '', answer: '' }]);
    setVerifyAnswers([]);
    setAnswerError('');
    setSecurityStep('main');
  };

  const addQuestion = () => {
    if (selectedQuestions.length < MAX_SECURITY_QUESTIONS) {
      setSelectedQuestions([...selectedQuestions, { question: '', answer: '' }]);
    }
  };

  const removeQuestion = (index: number) => {
    if (selectedQuestions.length > MIN_SECURITY_QUESTIONS) {
      const newQuestions = selectedQuestions.filter((_, i) => i !== index);
      setSelectedQuestions(newQuestions);
    }
  };

  const updateQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const newQuestions = [...selectedQuestions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setSelectedQuestions(newQuestions);
  };

  const handleTogglePassword = () => {
    if (securitySettings?.passwordEnabled) {
      disablePassword();
      setSecuritySettings(getSecuritySettings());
    } else {
      setSecurityStep('setPassword');
    }
  };

  const handleSetPassword = () => {
    setPasswordError('');
    
    if (newPassword.length < 6) {
      setPasswordError(t('settings.security.passwordTooShort'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.security.passwordMismatch'));
      return;
    }
    
    const validQuestions = selectedQuestions.filter(q => q.question && q.answer.trim());
    if (validQuestions.length < MIN_SECURITY_QUESTIONS) {
      setPasswordError(t('settings.security.minQuestionsError').replace('{min}', String(MIN_SECURITY_QUESTIONS)));
      return;
    }
    
    if (validQuestions.length !== selectedQuestions.length) {
      setPasswordError(t('settings.security.completeAllQuestions'));
      return;
    }
    
    setPassword(newPassword, selectedQuestions);
    setSecuritySettings(getSecuritySettings());
    resetSecurityForm();
    onDataChange();
  };

  const handleVerifyCurrentPassword = () => {
    if (verifyPassword(currentPassword)) {
      const security = getSecuritySettings();
      if (security.securityQuestions.length > 0) {
        setSelectedQuestions(security.securityQuestions.map(q => ({ question: q.question, answer: '' })));
      } else {
        setSelectedQuestions([{ question: '', answer: '' }]);
      }
      setSecurityStep('changePasswordWithQuestions');
      setCurrentPassword('');
      setPasswordError('');
    } else {
      setPasswordError(t('settings.security.passwordPlaceholder'));
    }
  };

  const handleForgotPassword = () => {
    const security = getSecuritySettings();
    setSecurityStep('verifyQuestions');
    setVerifyAnswers(new Array(security.securityQuestions.length).fill(''));
    setAnswerError('');
  };

  const handleVerifyAnswers = () => {
    if (verifySecurityAnswers(verifyAnswers)) {
      setSecurityStep('resetPassword');
      setAnswerError('');
    } else {
      setAnswerError(t('settings.security.answersIncorrect'));
    }
  };

  const handleResetPassword = () => {
    setPasswordError('');
    
    if (newPassword.length < 6) {
      setPasswordError(t('settings.security.passwordTooShort'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.security.passwordMismatch'));
      return;
    }
    
    resetPassword(newPassword);
    setSecuritySettings(getSecuritySettings());
    resetSecurityForm();
  };

  const toggleEncryption = async () => {
    const newEncryptedState = !settings.encrypted;
    const entryCount = getEntries().length;
    
    if (entryCount > 0) {
      setIsReEncrypting(true);
      setReEncryptStatus(newEncryptedState ? 'encrypting' : 'decrypting');
      setReEncryptProgress({ current: 0, total: entryCount });
      
      // Use setTimeout to allow UI to update before starting heavy operation
      setTimeout(() => {
        try {
          reEncryptAllEntries(newEncryptedState, (current, total) => {
            setReEncryptProgress({ current, total });
          });
          
          const updated = { ...settings, encrypted: newEncryptedState };
          saveSettings(updated);
          setSettings(updated);
          setReEncryptStatus('success');
          
          // Reset status after 2 seconds
          setTimeout(() => {
            setReEncryptStatus('idle');
            setIsReEncrypting(false);
          }, 2000);
        } catch (error) {
          console.error('Re-encryption failed:', error);
          setIsReEncrypting(false);
          setReEncryptStatus('idle');
        }
      }, 100);
    } else {
      const updated = { ...settings, encrypted: newEncryptedState };
      saveSettings(updated);
      setSettings(updated);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-journal-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDone(true);
    setTimeout(() => setShowExportDone(false), 3000);
  };

  const handleClear = () => {
    clearAllData();
    setConfirmClear(false);
    onDataChange();
  };

  return (
    <div className="space-y-4 max-w-2xl animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('settings.title')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.security.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.security.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {securityStep === 'main' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('settings.security.passwordProtection')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {!mounted ? t('settings.privacy.loading') : (securitySettings?.passwordEnabled ? t('settings.security.enabled') : t('settings.security.disabled'))}
                  </p>
                </div>
                <button
                  onClick={handleTogglePassword}
                  disabled={!mounted}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${securitySettings?.passwordEnabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-soft transition-transform duration-200 ${securitySettings?.passwordEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              
              {securitySettings?.passwordEnabled && (
                <div className="pt-2 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSecurityStep('setPassword')}
                    className="w-full"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    {t('settings.security.changePassword')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {securityStep === 'setPassword' && !securitySettings?.passwordEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('settings.security.passwordPlaceholder')}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.confirmPassword')}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.security.passwordPlaceholder')}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('settings.security.securityQuestions')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t('settings.security.questionCount').replace('{current}', String(selectedQuestions.length)).replace('{max}', String(MAX_SECURITY_QUESTIONS))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t('settings.security.securityQuestionsDescription')}</p>
                
                {selectedQuestions.map((q, index) => (
                  <div key={index} className="space-y-2 p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{t('settings.security.question')} {index + 1}</span>
                      {selectedQuestions.length > MIN_SECURITY_QUESTIONS && (
                        <button
                          onClick={() => removeQuestion(index)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title={t('settings.security.removeQuestion')}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <select
                      value={q.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">{t('settings.security.selectQuestion')}</option>
                      {DEFAULT_SECURITY_QUESTIONS.map((sq) => (
                        <option key={sq.id} value={t(`settings.security.questions.${sq.questionKey.split('.').pop()}`)}>
                          {t(`settings.security.questions.${sq.questionKey.split('.').pop()}`)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={q.answer}
                      onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                      placeholder={t('settings.security.answerPlaceholder')}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                  </div>
                ))}
                
                {selectedQuestions.length < MAX_SECURITY_QUESTIONS && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('settings.security.addQuestion')}
                  </Button>
                )}
              </div>

              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetSecurityForm} className="flex-1">
                  {t('settings.security.cancel')}
                </Button>
                <Button onClick={handleSetPassword} className="flex-1">
                  {t('settings.security.save')}
                </Button>
              </div>
            </div>
          )}

          {securityStep === 'setPassword' && securitySettings?.passwordEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.currentPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('settings.security.passwordPlaceholder')}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetSecurityForm} className="flex-1">
                  {t('settings.security.cancel')}
                </Button>
                <Button variant="outline" onClick={handleForgotPassword} className="flex-1">
                  {t('settings.security.forgotPassword')}
                </Button>
                <Button onClick={handleVerifyCurrentPassword} className="flex-1">
                  {t('settings.security.next')}
                </Button>
              </div>
            </div>
          )}

          {securityStep === 'changePasswordWithQuestions' && securitySettings?.passwordEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('settings.security.passwordPlaceholder')}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.confirmPassword')}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.security.passwordPlaceholder')}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('settings.security.securityQuestions')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t('settings.security.questionCount').replace('{current}', String(selectedQuestions.length)).replace('{max}', String(MAX_SECURITY_QUESTIONS))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t('settings.security.updateQuestionsDescription') || t('settings.security.securityQuestionsDescription')}</p>
                
                {selectedQuestions.map((q, index) => (
                  <div key={index} className="space-y-2 p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{t('settings.security.question')} {index + 1}</span>
                      {selectedQuestions.length > MIN_SECURITY_QUESTIONS && (
                        <button
                          onClick={() => removeQuestion(index)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title={t('settings.security.removeQuestion')}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <select
                      value={q.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">{t('settings.security.selectQuestion')}</option>
                      {DEFAULT_SECURITY_QUESTIONS.map((sq) => (
                        <option key={sq.id} value={t(`settings.security.questions.${sq.questionKey.split('.').pop()}`)}>
                          {t(`settings.security.questions.${sq.questionKey.split('.').pop()}`)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={q.answer}
                      onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                      placeholder={t('settings.security.answerPlaceholder')}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                  </div>
                ))}
                
                {selectedQuestions.length < MAX_SECURITY_QUESTIONS && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('settings.security.addQuestion')}
                  </Button>
                )}
              </div>

              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetSecurityForm} className="flex-1">
                  {t('settings.security.cancel')}
                </Button>
                <Button onClick={handleSetPassword} className="flex-1">
                  {t('settings.security.save')}
                </Button>
              </div>
            </div>
          )}

          {securityStep === 'verifyQuestions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('settings.security.verifyIdentity')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('settings.security.securityQuestionsDescription')}</p>
              
              {securitySettings?.securityQuestions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm font-medium">{q.question}</label>
                  <input
                    type="text"
                    value={verifyAnswers[index] || ''}
                    onChange={(e) => {
                      const newAnswers = [...verifyAnswers];
                      newAnswers[index] = e.target.value;
                      setVerifyAnswers(newAnswers);
                    }}
                    placeholder={t('settings.security.answerPlaceholder')}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  />
                </div>
              ))}
              
              {answerError && <p className="text-sm text-destructive">{answerError}</p>}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetSecurityForm} className="flex-1">
                  {t('settings.security.cancel')}
                </Button>
                <Button onClick={handleVerifyAnswers} className="flex-1">
                  {t('settings.security.verifyAnswers')}
                </Button>
              </div>
            </div>
          )}

          {securityStep === 'resetPassword' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('settings.security.resetPassword')}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('settings.security.passwordPlaceholder')}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.confirmPassword')}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.security.passwordPlaceholder')}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetSecurityForm} className="flex-1">
                  {t('settings.security.cancel')}
                </Button>
                <Button onClick={handleResetPassword} className="flex-1">
                  {t('settings.security.save')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.language.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['zh-CN', 'en-US'] as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  locale === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {t(`settings.language.${lang.replace('-', '')}`)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.privacy.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.privacy.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.privacy.encryption')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {!mounted ? t('settings.privacy.loading') : (settings.encrypted ? t('settings.privacy.encrypted') : t('settings.privacy.notEncrypted'))}
                </p>
              </div>
              <button
                onClick={toggleEncryption}
                disabled={!mounted || isReEncrypting}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.encrypted ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-soft transition-transform duration-200 ${settings.encrypted ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            
            {/* Progress Display */}
            {isReEncrypting && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    {reEncryptStatus === 'encrypting' 
                      ? t('settings.privacy.encryptingProgress').replace('{current}', String(reEncryptProgress.current)).replace('{total}', String(reEncryptProgress.total))
                      : reEncryptStatus === 'decrypting'
                      ? t('settings.privacy.decryptingProgress').replace('{current}', String(reEncryptProgress.current)).replace('{total}', String(reEncryptProgress.total))
                      : t('settings.privacy.processingSuccess')
                    }
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${reEncryptProgress.total > 0 ? (reEncryptProgress.current / reEncryptProgress.total) * 100 : 0}%` }}
                  />
                </div>
                
                {/* Percentage */}
                <p className="text-xs text-muted-foreground text-right">
                  {reEncryptProgress.total > 0 ? Math.round((reEncryptProgress.current / reEncryptProgress.total) * 100) : 0}%
                </p>
              </div>
            )}
            
            {/* Success Message */}
            {reEncryptStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t border-border">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{settings.encrypted ? t('settings.privacy.encryptSuccess') : t('settings.privacy.decryptSuccess')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.export.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.export.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {showExportDone ? t('settings.export.success') : t('settings.export.button')}
          </Button>
        </CardContent>
      </Card>

      {/* Clear */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm">{t('settings.clear.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.clear.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmClear ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">{t('settings.clear.confirm')}</p>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleClear} className="flex-1">
                  {t('settings.clear.confirmButton')}
                </Button>
                <Button variant="outline" onClick={() => setConfirmClear(false)} className="flex-1">
                  {t('settings.clear.cancelButton')}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirmClear(true)} className="w-full text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('settings.clear.button')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.about.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t('settings.about.appName')}</p>
            <p>{t('settings.about.description')}</p>
            <p className="text-xs">{t('settings.about.storageNote')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
