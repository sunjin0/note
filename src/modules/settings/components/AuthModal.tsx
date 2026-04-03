'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/core/utils';
import { useTranslation } from '@/core/i18n';
import { Button } from '@/core/ui/button';
import type { User, AuthCredentials, AuthResponse } from '@/core/storage';
import {
  register,
  login,
  isValidEmail,
  checkPasswordStrength,
  saveAuthCredentials,
  saveAuthState,
  getSyncSettings,
  saveSyncSettings,
} from '@/core/storage';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  onAuthSuccess?: (user: User) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  onAuthSuccess,
}: AuthModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // 表单状态
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UI状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    feedback: [] as string[],
  });

  // 重置表单
  const resetForm = () => {
    setUsername('');
    setEmail('');
    setNickname('');
    setPassword('');
    setConfirmPassword('');
    setRememberMe(true);
    setError(null);
    setFieldErrors({});
    setPasswordStrength({ score: 0, label: '', feedback: [] });
  };

  // 切换模式时重置表单
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  // 密码强度检查
  useEffect(() => {
    if (mode === 'register' && password) {
      setPasswordStrength(checkPasswordStrength(password));
    }
  }, [password, mode]);

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (mode === 'register') {
      if (!username || username.length < 3) {
        errors.username = t('auth.usernameTooShort');
      }

      if (!email || !isValidEmail(email)) {
        errors.email = t('auth.invalidEmail');
      }

      if (!password || password.length < 6) {
        errors.password = t('auth.passwordTooShort');
      }

      if (password !== confirmPassword) {
        errors.confirmPassword = t('auth.passwordMismatch');
      }
    } else {
      // 登录模式
      if (!email) {
        errors.email = t('auth.emailRequired');
      }

      if (!password) {
        errors.password = t('auth.passwordRequired');
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      let response: AuthResponse;

      if (mode === 'register') {
        response = await register({
          username,
          email,
          password,
          confirmPassword,
          nickname: nickname || undefined,
        });
      } else {
        response = await login({
          identifier: email,
          password,
          rememberMe,
        });
      }

      if (response.success && response.user && response.token) {
        // 保存认证凭据
        const credentials: AuthCredentials = {
          userId: response.user.id,
          token: response.token,
          refreshToken: response.refreshToken || '',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          loginAt: new Date().toISOString(),
        };
        saveAuthCredentials(credentials);

        // 保存认证状态
        saveAuthState({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
          error: null,
        });

        // 更新同步设置中的认证令牌
        const syncSettings = getSyncSettings();
        syncSettings.authToken = response.token;
        saveSyncSettings(syncSettings);

        // 回调
        onAuthSuccess?.(response.user);
        onClose();
      } else {
        // 处理错误
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

  // 获取密码强度颜色
  const getStrengthColor = (score: number) => {
    const colors = [
      'bg-destructive',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-green-600',
    ];
    return colors[score] || colors[0];
  };

  // 获取密码强度宽度
  const getStrengthWidth = (score: number) => {
    return `${(score + 1) * 20}%`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 登录/注册模态框 - 只在不显示忘记密码时才显示 */}
      {!showForgotPassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* 遮罩层 */}
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

          {/* 模态框 */}
          <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-elevated border border-border animate-scale-in">
            {/* 头部 */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-card">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* 错误提示 */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* 用户名（仅注册） */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t('auth.username')}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('auth.usernamePlaceholder')}
                      className={cn(
                        'w-full pl-10 pr-3 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 transition-all',
                        fieldErrors.username
                          ? 'border-destructive focus:ring-destructive/20'
                          : 'border-input focus:ring-primary/20 focus:border-primary'
                      )}
                    />
                  </div>
                  {fieldErrors.username && (
                    <p className="text-xs text-destructive">{fieldErrors.username}</p>
                  )}
                </div>
              )}

              {/* 邮箱 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('auth.email')}</label>
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

              {/* 昵称（仅注册，可选） */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t('auth.nickname')}{' '}
                    <span className="text-muted-foreground font-normal">
                      ({t('auth.optional')})
                    </span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t('auth.nicknamePlaceholder')}
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              {/* 密码 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className={cn(
                      'w-full pl-10 pr-10 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      fieldErrors.password
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
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}

                {/* 密码强度指示器（仅注册） */}
                {mode === 'register' && password && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            getStrengthColor(passwordStrength.score)
                          )}
                          style={{ width: getStrengthWidth(passwordStrength.score) }}
                        />
                      </div>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t(passwordStrength.label)}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>• {t(item)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* 确认密码（仅注册） */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t('auth.confirmPassword')}
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
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* 记住我（仅登录） */}
              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">{t('auth.rememberMe')}</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              {/* 提交按钮 */}
              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'login' ? t('auth.loggingIn') : t('auth.registering')}
                  </>
                ) : mode === 'login' ? (
                  t('auth.loginButton')
                ) : (
                  t('auth.registerButton')
                )}
              </Button>

              {/* 切换模式 */}
              <div className="text-center text-sm text-muted-foreground">
                {mode === 'login' ? (
                  <>
                    {t('auth.noAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        resetForm();
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      {t('auth.registerNow')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('auth.hasAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        resetForm();
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      {t('auth.loginNow')}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 忘记密码模态框 */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => {
          setShowForgotPassword(false);
        }}
      />
    </>
  );
}
