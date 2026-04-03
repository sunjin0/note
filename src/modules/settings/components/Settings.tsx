'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/ui/card';
import { Button } from '@/core/ui/button';
import type { AppSettings, DraftDataInfo, SecuritySettings } from '@/core/storage';
import {
  getSettings,
  saveSettings,
  exportData,
  clearAllData,
  getEntries,
  getSecuritySettings,
  setPassword,
  disablePassword,
  verifyPassword,
  resetPassword,
  verifySecurityAnswers,
  reEncryptAllEntries,
  getCustomFactors,
  saveCustomFactors,
  deleteCustomFactor,
  getDraftDataInfo,
  clearAllDraftData,
  changePasswordWithDataPreservation,
  DEFAULT_SECURITY_QUESTIONS,
  MIN_SECURITY_QUESTIONS,
  MAX_SECURITY_QUESTIONS,
} from '@/core/storage';
import { FactorOption } from '@/types';
import { useTranslation, Locale } from '@/core/i18n';
import {
  Shield,
  Download,
  Trash2,
  Info,
  Languages,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  HelpCircle,
  Plus,
  Trash2 as TrashIcon,
  Loader2,
  GripVertical,
  Tag,
  X,
  Edit2,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  FileX,
  Cloud,
} from 'lucide-react';
import { ConfirmDialog, EmojiPicker } from '@/modules/common/components';
import { useTheme } from '@/modules/common/components/Providers';
import SyncSettings from './SyncSettings';

interface SettingsProps {
  onDataChange: () => void;
}

const defaultSettings: AppSettings = { encrypted: false, createdAt: '' };

type SecurityStep =
  | 'main'
  | 'setPassword'
  | 'changePasswordWithQuestions'
  | 'verifyQuestions'
  | 'resetPassword';

export default function SettingsView({ onDataChange }: SettingsProps) {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showExportDone, setShowExportDone] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const [securityStep, setSecurityStep] = useState<SecurityStep>('main');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<
    { question: string; answer: string }[]
  >([{ question: '', answer: '' }]);
  const [verifyAnswers, setVerifyAnswers] = useState(['', '', '']);
  const [answerError, setAnswerError] = useState('');

  const [isReEncrypting, setIsReEncrypting] = useState(false);
  const [reEncryptProgress, setReEncryptProgress] = useState({ current: 0, total: 0 });
  const [reEncryptStatus, setReEncryptStatus] = useState<
    'idle' | 'encrypting' | 'decrypting' | 'success'
  >('idle');

  // Custom Factors State
  const [customFactors, setCustomFactors] = useState<FactorOption[]>([]);
  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [editingFactor, setEditingFactor] = useState<FactorOption | null>(null);
  const [newFactorName, setNewFactorName] = useState('');
  const [newFactorEmoji, setNewFactorEmoji] = useState('🏷️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [factorError, setFactorError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [factorDeleteDialogOpen, setFactorDeleteDialogOpen] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<string | null>(null);

  // Draft data state
  const [draftInfo, setDraftInfo] = useState<DraftDataInfo>({
    size: 0,
    formattedSize: '0 KB',
    count: 0,
  });
  const [clearDraftDialogOpen, setClearDraftDialogOpen] = useState(false);
  const [showDraftClearSuccess, setShowDraftClearSuccess] = useState(false);

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<{
    security: boolean;
    appearance: boolean;
    data: boolean;
    customization: boolean;
    sync: boolean;
    about: boolean;
  }>({
    security: false,
    appearance: false,
    data: false,
    customization: false,
    sync: false,
    about: false,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    setMounted(true);
    setSettings(getSettings());
    setSecuritySettings(getSecuritySettings());
    setCustomFactors(getCustomFactors());
    setDraftInfo(getDraftDataInfo());
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

    const validQuestions = selectedQuestions.filter((q) => q.question && q.answer.trim());
    if (validQuestions.length < MIN_SECURITY_QUESTIONS) {
      setPasswordError(
        t('settings.security.minQuestionsError').replace('{min}', String(MIN_SECURITY_QUESTIONS))
      );
      return;
    }

    if (validQuestions.length !== selectedQuestions.length) {
      setPasswordError(t('settings.security.completeAllQuestions'));
      return;
    }

    // Check if this is a password change (password already enabled)
    if (securitySettings?.passwordEnabled) {
      // Use data preservation flow for password change
      // Current password was already verified in previous step
      const result = changePasswordWithDataPreservation(
        currentPassword,
        newPassword,
        selectedQuestions
      );

      if (!result.success) {
        setPasswordError(result.error || t('settings.security.passwordChangeFailed'));
        return;
      }
    } else {
      // First time setting password - no existing data to decrypt
      setPassword(newPassword, selectedQuestions);
    }

    setSecuritySettings(getSecuritySettings());
    resetSecurityForm();
    onDataChange();
  };

  const handleVerifyCurrentPassword = () => {
    if (verifyPassword(currentPassword)) {
      const security = getSecuritySettings();
      if (security.securityQuestions.length > 0) {
        setSelectedQuestions(
          security.securityQuestions.map((q) => ({ question: q.question, answer: '' }))
        );
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

    const result = resetPassword(newPassword);
    if (!result.success) {
      setPasswordError(result.error || t('settings.security.passwordResetFailed'));
      return;
    }

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
    setClearDialogOpen(false);
    onDataChange();
  };

  const handleClearDraftData = () => {
    clearAllDraftData();
    setDraftInfo(getDraftDataInfo());
    setClearDraftDialogOpen(false);
    setShowDraftClearSuccess(true);
    setTimeout(() => setShowDraftClearSuccess(false), 3000);
  };

  // Custom Factors Handlers
  const resetFactorForm = () => {
    setNewFactorName('');
    setNewFactorEmoji('🏷️');
    setFactorError('');
    setIsAddingFactor(false);
    setEditingFactor(null);
    setShowEmojiPicker(false);
  };

  const validateFactorName = (name: string, excludeId?: string): boolean => {
    if (!name.trim()) {
      setFactorError(t('settings.customFactors.nameRequired'));
      return false;
    }
    const trimmedName = name.trim();
    // Check for duplicates in custom factors
    const duplicateInCustom = customFactors.some(
      (f) => f.label.toLowerCase() === trimmedName.toLowerCase() && f.id !== excludeId
    );
    if (duplicateInCustom) {
      setFactorError(t('settings.customFactors.duplicateName'));
      return false;
    }
    setFactorError('');
    return true;
  };

  const handleSaveFactor = () => {
    const isEditing = editingFactor !== null;
    const excludeId = isEditing ? editingFactor.id : undefined;

    if (!validateFactorName(newFactorName, excludeId)) return;

    const factorData: FactorOption = {
      id: isEditing ? editingFactor.id : `custom_${Date.now()}`,
      label: newFactorName.trim(),
      emoji: newFactorEmoji,
      isCustom: true,
    };

    let updatedFactors: FactorOption[];
    if (isEditing) {
      updatedFactors = customFactors.map((f) => (f.id === editingFactor.id ? factorData : f));
    } else {
      updatedFactors = [...customFactors, factorData];
    }

    saveCustomFactors(updatedFactors);
    setCustomFactors(updatedFactors);
    resetFactorForm();
    onDataChange();
  };

  const handleDeleteFactor = (id: string) => {
    setFactorToDelete(id);
    setFactorDeleteDialogOpen(true);
  };

  const confirmDeleteFactor = () => {
    if (factorToDelete) {
      deleteCustomFactor(factorToDelete);
      setCustomFactors(getCustomFactors());
      onDataChange();
    }
    setFactorDeleteDialogOpen(false);
    setFactorToDelete(null);
  };

  const cancelDeleteFactor = () => {
    setFactorDeleteDialogOpen(false);
    setFactorToDelete(null);
  };

  const handleEditFactor = (factor: FactorOption) => {
    setEditingFactor(factor);
    setNewFactorName(factor.label);
    setNewFactorEmoji(factor.emoji);
    setIsAddingFactor(true);
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFactors = [...customFactors];
    const draggedItem = newFactors[draggedIndex];
    newFactors.splice(draggedIndex, 1);
    newFactors.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setCustomFactors(newFactors);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      saveCustomFactors(customFactors);
    }
    setDraggedIndex(null);
  };

  // ==================== 渲染辅助函数 ====================

  // 安全与隐私区
  const renderSecuritySection = () => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection('security')}
        className="flex items-center justify-between w-full px-1 py-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('settings.sections.security')}
          </h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsedSections.security ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsedSections.security && (
        <>
          {/* 密码保护 */}
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
                      <p className="text-sm font-medium text-foreground">
                        {t('settings.security.passwordProtection')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {!mounted
                          ? t('settings.privacy.loading')
                          : securitySettings?.passwordEnabled
                            ? t('settings.security.enabled')
                            : t('settings.security.disabled')}
                      </p>
                    </div>
                    <button
                      onClick={handleTogglePassword}
                      disabled={!mounted}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${securitySettings?.passwordEnabled ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-soft transition-transform duration-200 ${securitySettings?.passwordEnabled ? 'translate-x-6' : ''}`}
                      />
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
                    <label className="text-sm font-medium">
                      {t('settings.security.newPassword')}
                    </label>
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t('settings.security.confirmPassword')}
                    </label>
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
                        <span className="text-sm font-medium">
                          {t('settings.security.securityQuestions')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t('settings.security.questionCount')
                          .replace('{current}', String(selectedQuestions.length))
                          .replace('{max}', String(MAX_SECURITY_QUESTIONS))}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.security.securityQuestionsDescription')}
                    </p>

                    {selectedQuestions.map((q, index) => (
                      <div key={index} className="space-y-2 p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t('settings.security.question')} {index + 1}
                          </span>
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
                            <option
                              key={sq.id}
                              value={t(
                                `settings.security.questions.${sq.questionKey.split('.').pop()}`
                              )}
                            >
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
                      <Button variant="outline" size="sm" onClick={addQuestion} className="w-full">
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
                    <label className="text-sm font-medium">
                      {t('settings.security.currentPassword')}
                    </label>
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
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

              {securityStep === 'changePasswordWithQuestions' &&
                securitySettings?.passwordEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('settings.security.newPassword')}
                      </label>
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
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('settings.security.confirmPassword')}
                      </label>
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
                          <span className="text-sm font-medium">
                            {t('settings.security.securityQuestions')}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t('settings.security.questionCount')
                            .replace('{current}', String(selectedQuestions.length))
                            .replace('{max}', String(MAX_SECURITY_QUESTIONS))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.security.updateQuestionsDescription') ||
                          t('settings.security.securityQuestionsDescription')}
                      </p>

                      {selectedQuestions.map((q, index) => (
                        <div key={index} className="space-y-2 p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {t('settings.security.question')} {index + 1}
                            </span>
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
                              <option
                                key={sq.id}
                                value={t(
                                  `settings.security.questions.${sq.questionKey.split('.').pop()}`
                                )}
                              >
                                {t(
                                  `settings.security.questions.${sq.questionKey.split('.').pop()}`
                                )}
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
                    <span className="text-sm font-medium">
                      {t('settings.security.verifyIdentity')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.security.securityQuestionsDescription')}
                  </p>

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
                    <span className="text-sm font-medium">
                      {t('settings.security.resetPassword')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t('settings.security.newPassword')}
                    </label>
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t('settings.security.confirmPassword')}
                    </label>
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

          {/* 数据加密 */}
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
                    <p className="text-sm font-medium text-foreground">
                      {t('settings.privacy.encryption')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {!mounted
                        ? t('settings.privacy.loading')
                        : settings.encrypted
                          ? t('settings.privacy.encrypted')
                          : t('settings.privacy.notEncrypted')}
                    </p>
                  </div>
                  <button
                    onClick={toggleEncryption}
                    disabled={!mounted || isReEncrypting}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.encrypted ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-soft transition-transform duration-200 ${settings.encrypted ? 'translate-x-6' : ''}`}
                    />
                  </button>
                </div>

                {/* Progress Display */}
                {isReEncrypting && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-muted-foreground">
                        {reEncryptStatus === 'encrypting'
                          ? t('settings.privacy.encryptingProgress')
                              .replace('{current}', String(reEncryptProgress.current))
                              .replace('{total}', String(reEncryptProgress.total))
                          : reEncryptStatus === 'decrypting'
                            ? t('settings.privacy.decryptingProgress')
                                .replace('{current}', String(reEncryptProgress.current))
                                .replace('{total}', String(reEncryptProgress.total))
                            : t('settings.privacy.processingSuccess')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{
                          width: `${reEncryptProgress.total > 0 ? (reEncryptProgress.current / reEncryptProgress.total) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    {/* Percentage */}
                    <p className="text-xs text-muted-foreground text-right">
                      {reEncryptProgress.total > 0
                        ? Math.round((reEncryptProgress.current / reEncryptProgress.total) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {reEncryptStatus === 'success' && (
                  <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t border-border">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>
                      {settings.encrypted
                        ? t('settings.privacy.encryptSuccess')
                        : t('settings.privacy.decryptSuccess')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  // 外观与体验区
  const renderAppearanceSection = () => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection('appearance')}
        className="flex items-center justify-between w-full px-1 py-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('settings.sections.appearance')}
          </h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsedSections.appearance ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsedSections.appearance && (
        <div className="space-y-3">
          {/* 主题 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-primary" />
                )}
                <CardTitle className="text-sm">{t('settings.theme.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.theme.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      theme === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    {t === 'light' && <Sun className="h-4 w-4" />}
                    {t === 'dark' && <Moon className="h-4 w-4" />}
                    {t === 'system' && <Monitor className="h-4 w-4" />}
                    {t === 'light' ? '亮色' : t === 'dark' ? '暗色' : '跟随系统'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 语言 */}
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
        </div>
      )}
    </div>
  );

  // 数据管理区
  const renderDataSection = () => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection('data')}
        className="flex items-center justify-between w-full px-1 py-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('settings.sections.data')}</h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsedSections.data ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsedSections.data && (
        <>
          <div className="space-y-3">
            {/* 导出 */}
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

            {/* 清除 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm">{t('settings.clear.title')}</CardTitle>
                </div>
                <CardDescription>{t('settings.clear.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => setClearDialogOpen(true)}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('settings.clear.button')}
                </Button>
              </CardContent>
            </Card>

            {/* 清除暂存数据 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileX className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm">{t('settings.clearDraft.title')}</CardTitle>
                </div>
                <CardDescription>{t('settings.clearDraft.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('settings.clearDraft.draftSize')}
                    </span>
                    <span className="font-medium">{draftInfo.formattedSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('settings.clearDraft.draftCount')}
                    </span>
                    <span className="font-medium">
                      {draftInfo.count} {t('settings.clearDraft.countUnit')}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setClearDraftDialogOpen(true)}
                    disabled={draftInfo.size === 0}
                    className="w-full text-orange-500 hover:text-orange-600"
                  >
                    <FileX className="h-4 w-4 mr-2" />
                    {showDraftClearSuccess
                      ? t('settings.clearDraft.success')
                      : t('settings.clearDraft.button')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clear Data Confirmation Dialog */}
          <ConfirmDialog
            isOpen={clearDialogOpen}
            title={t('settings.clear.title')}
            message={t('settings.clear.confirm')}
            confirmText={t('settings.clear.confirmButton')}
            cancelText={t('settings.clear.cancelButton')}
            confirmVariant="destructive"
            onConfirm={handleClear}
            onCancel={() => setClearDialogOpen(false)}
          />

          {/* Clear Draft Data Confirmation Dialog */}
          <ConfirmDialog
            isOpen={clearDraftDialogOpen}
            title={t('settings.clearDraft.confirmTitle')}
            message={t('settings.clearDraft.confirm')}
            confirmText={t('settings.clearDraft.confirmButton')}
            cancelText={t('settings.clearDraft.cancelButton')}
            confirmVariant="destructive"
            onConfirm={handleClearDraftData}
            onCancel={() => setClearDraftDialogOpen(false)}
          />
        </>
      )}
    </div>
  );

  // 自定义配置区
  const renderCustomizationSection = () => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection('customization')}
        className="flex items-center justify-between w-full px-1 py-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('settings.sections.customization')}
          </h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsedSections.customization ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsedSections.customization && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">{t('settings.customFactors.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.customFactors.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add/Edit Factor Form */}
                {isAddingFactor ? (
                  <div className="space-y-3 p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {editingFactor
                          ? t('settings.customFactors.editFactor')
                          : t('settings.customFactors.addFactor')}
                      </span>
                      <button
                        onClick={resetFactorForm}
                        className="p-1 rounded hover:bg-accent text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Factor Name Input */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        {t('settings.customFactors.factorName')}
                      </label>
                      <input
                        type="text"
                        value={newFactorName}
                        onChange={(e) => setNewFactorName(e.target.value)}
                        placeholder={t('settings.customFactors.factorNamePlaceholder')}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                        maxLength={20}
                      />
                    </div>

                    {/* Emoji Selector */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        {t('settings.customFactors.selectIcon')}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowEmojiPicker(true)}
                          className="w-10 h-10 rounded-lg border border-input bg-background flex items-center justify-center text-xl hover:bg-accent transition-colors"
                        >
                          {newFactorEmoji}
                        </button>
                        <span className="text-sm text-muted-foreground">{newFactorEmoji}</span>
                      </div>
                    </div>

                    {/* Emoji Picker Modal */}
                    <EmojiPicker
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      onSelect={setNewFactorEmoji}
                      selectedEmoji={newFactorEmoji}
                    />

                    {factorError && <p className="text-sm text-destructive">{factorError}</p>}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFactorForm}
                        className="flex-1"
                      >
                        {t('settings.customFactors.cancel')}
                      </Button>
                      <Button size="sm" onClick={handleSaveFactor} className="flex-1">
                        {t('settings.customFactors.save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingFactor(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('settings.customFactors.addFactor')}
                  </Button>
                )}

                {/* Custom Factors List */}
                {customFactors.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t('settings.customFactors.dragToReorder')}
                    </p>
                    <div className="space-y-1">
                      {customFactors.map((factor, index) => (
                        <div
                          key={factor.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-2 p-2 rounded-lg bg-secondary/30 cursor-move hover:bg-secondary/50 transition-colors ${
                            draggedIndex === index ? 'opacity-50' : ''
                          }`}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-lg">{factor.emoji}</span>
                          <span className="flex-1 text-sm">{factor.label}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditFactor(factor)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title={t('settings.customFactors.editFactor')}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFactor(factor.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title={t('settings.customFactors.delete')}
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('settings.customFactors.empty')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delete Custom Factor Confirmation Dialog */}
          <ConfirmDialog
            isOpen={factorDeleteDialogOpen}
            title={t('settings.customFactors.delete')}
            message={t('settings.customFactors.deleteConfirm')}
            confirmText={t('settings.customFactors.delete')}
            cancelText={t('settings.customFactors.cancel')}
            confirmVariant="destructive"
            onConfirm={confirmDeleteFactor}
            onCancel={cancelDeleteFactor}
          />
        </>
      )}
    </div>
  );

  // 数据同步区
  const renderSyncSection = () => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection('sync')}
        className="flex items-center justify-between w-full px-1 py-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('settings.sections.sync')}</h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsedSections.sync ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsedSections.sync && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">{t('settings.sync.title')}</CardTitle>
            </div>
            <CardDescription className="text-xs">{t('settings.sync.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SyncSettings />
          </CardContent>
        </Card>
      )}
    </div>
  );

  // 关于应用区
  const renderAboutSection = () => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection('about')}
        className="flex items-center justify-between w-full px-1 py-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('settings.sections.about')}</h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsedSections.about ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsedSections.about && (
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
      )}
    </div>
  );

  // ==================== 主渲染 ====================

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* 页面标题 */}
      <div className="pb-2 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">{t('settings.title')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* 安全与隐私区 */}
      {renderSecuritySection()}

      {/* 外观与体验区 */}
      {renderAppearanceSection()}

      {/* 数据管理区 */}
      {renderDataSection()}

      {/* 自定义配置区 */}
      {renderCustomizationSection()}

      {/* 数据同步区 */}
      {renderSyncSection()}

      {/* 关于应用区 */}
      {renderAboutSection()}
    </div>
  );
}
