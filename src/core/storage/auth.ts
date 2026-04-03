/**
 * 用户认证模块
 * 提供用户注册、登录、登出和认证状态管理功能
 *
 * @module auth
 */

import { simpleHash } from '@/core';
import {
  apiRegister,
  apiLogin,
  apiLogout,
  apiGetCurrentUser,
  apiRefreshToken,
  apiChangePassword,
} from '@/core/api';

// 认证数据存储键名
export const AUTH_KEY = 'mood_journal_auth';
export const AUTH_STATE_KEY = 'mood_journal_auth_state';

/**
 * 用户信息接口
 */
export interface User {
  /** 用户唯一标识 */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 昵称 */
  nickname?: string;
  /** 头像URL */
  avatar?: string;
  /** 创建时间 */
  createdAt: string;
  /** 最后登录时间 */
  lastLoginAt?: string;
}

/**
 * 认证凭据接口（存储在本地）
 */
export interface AuthCredentials {
  /** 用户ID */
  userId: string;
  /** 认证令牌 */
  token: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌过期时间 */
  expiresAt: string;
  /** 登录时间 */
  loginAt: string;
}

/**
 * 认证状态接口
 */
export interface AuthState {
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 当前用户 */
  user: User | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 最后检查时间 */
  lastCheckedAt: string | null;
}

/**
 * 登录请求接口
 */
export interface LoginRequest {
  /** 邮箱或用户名 */
  identifier: string;
  /** 密码 */
  password: string;
  /** 记住我 */
  rememberMe?: boolean;
}

/**
 * 注册请求接口
 */
export interface RegisterRequest {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 昵称（可选） */
  nickname?: string;
}

/**
 * 认证响应接口
 */
export interface AuthResponse {
  /** 是否成功 */
  success: boolean;
  /** 用户信息 */
  user?: User;
  /** 认证令牌 */
  token?: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 错误信息 */
  error?: string;
  /** 错误字段 */
  fieldErrors?: Record<string, string>;
}

/**
 * 默认认证状态
 */
export const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  lastCheckedAt: null,
};

// ==================== 本地存储操作 ====================

/**
 * 获取认证凭据
 */
export function getAuthCredentials(): AuthCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    return JSON.parse(data) as AuthCredentials;
  } catch {
    return null;
  }
}

/**
 * 保存认证凭据
 */
export function saveAuthCredentials(credentials: AuthCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(credentials));
}

/**
 * 清除认证凭据
 */
export function clearAuthCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

/**
 * 获取认证状态
 */
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_AUTH_STATE };
  }
  try {
    const data = localStorage.getItem(AUTH_STATE_KEY);
    if (!data) return { ...DEFAULT_AUTH_STATE };
    return JSON.parse(data) as AuthState;
  } catch {
    return { ...DEFAULT_AUTH_STATE };
  }
}

/**
 * 保存认证状态
 */
export function saveAuthState(state: Partial<AuthState>): void {
  if (typeof window === 'undefined') return;
  const current = getAuthState();
  const newState = { ...current, ...state, lastCheckedAt: new Date().toISOString() };
  localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(newState));
}

/**
 * 清除认证状态
 */
export function clearAuthState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STATE_KEY);
}

// ==================== 认证状态检查 ====================

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  const credentials = getAuthCredentials();
  if (!credentials) return false;

  // 检查令牌是否过期
  const expiresAt = new Date(credentials.expiresAt);
  if (expiresAt <= new Date()) {
    return false;
  }

  return true;
}

/**
 * 获取当前用户
 */
export function getCurrentUser(): User | null {
  const state = getAuthState();
  return state.user;
}

/**
 * 获取认证令牌
 */
export function getAuthToken(): string | null {
  const credentials = getAuthCredentials();
  return credentials?.token || null;
}

/**
 * 检查令牌是否即将过期（1小时内）
 */
export function isTokenExpiringSoon(): boolean {
  const credentials = getAuthCredentials();
  if (!credentials) return false;

  const expiresAt = new Date(credentials.expiresAt);
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

  return expiresAt <= oneHourFromNow;
}

// ==================== 认证操作 ====================

/**
 * 用户注册
 * 调用后端API进行用户注册
 */
export async function register(request: RegisterRequest): Promise<AuthResponse> {
  // 验证输入
  const fieldErrors: Record<string, string> = {};

  if (!request.username || request.username.length < 3) {
    fieldErrors.username = 'auth.usernameTooShort';
  }

  if (!request.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
    fieldErrors.email = 'auth.invalidEmail';
  }

  if (!request.password || request.password.length < 6) {
    fieldErrors.password = 'auth.passwordTooShort';
  }

  if (request.password !== request.confirmPassword) {
    fieldErrors.confirmPassword = 'auth.passwordMismatch';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // 调用后端API
  const response = await apiRegister(request);

  if (response.success && response.token && response.user) {
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
      error: null,
    });
  }

  return response;
}

/**
 * 用户登录
 * 调用后端API进行用户登录
 */
export async function login(request: LoginRequest): Promise<AuthResponse> {
  // 验证输入
  if (!request.identifier || !request.password) {
    return { success: false, error: 'auth.invalidCredentials' };
  }

  // 调用后端API
  const response = await apiLogin(request);

  if (response.success && response.token && response.user) {
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
      error: null,
    });
  }

  return response;
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  // 调用后端API
  await apiLogout();

  // 清除本地存储
  clearAuthCredentials();
  clearAuthState();

  // 清除同步相关的认证令牌
  const { getSyncSettings, saveSyncSettings } = await import('./sync');
  const syncSettings = getSyncSettings();
  syncSettings.authToken = null;
  saveSyncSettings(syncSettings);
}

/**
 * 刷新认证令牌
 */
export async function refreshToken(): Promise<boolean> {
  const credentials = getAuthCredentials();
  if (!credentials?.refreshToken) return false;

  // 调用后端API刷新令牌
  const response = await apiRefreshToken(credentials.refreshToken);

  if (response.success && response.token) {
    const newCredentials: AuthCredentials = {
      ...credentials,
      token: response.token,
      refreshToken: response.refreshToken || credentials.refreshToken,
      expiresAt: response.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    saveAuthCredentials(newCredentials);

    // 更新同步设置中的令牌
    const { getSyncSettings, saveSyncSettings } = await import('./sync');
    const syncSettings = getSyncSettings();
    syncSettings.authToken = response.token;
    saveSyncSettings(syncSettings);

    return true;
  }

  return false;
}

/**
 * 初始化认证状态
 * 应用启动时调用，恢复登录状态
 */
export async function initAuth(): Promise<void> {
  const credentials = getAuthCredentials();

  if (!credentials) {
    saveAuthState({ isAuthenticated: false, user: null, isLoading: false });
    return;
  }

  // 检查令牌是否过期
  const expiresAt = new Date(credentials.expiresAt);
  if (expiresAt <= new Date()) {
    // 尝试刷新令牌
    const refreshed = await refreshToken();
    if (!refreshed) {
      clearAuthCredentials();
      saveAuthState({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }
  }

  // 从后端获取最新用户信息
  const user = await apiGetCurrentUser();
  if (user) {
    saveAuthState({
      isAuthenticated: true,
      user,
      isLoading: false,
    });

    // 同步更新同步设置中的令牌
    const { getSyncSettings, saveSyncSettings } = await import('./sync');
    const syncSettings = getSyncSettings();
    syncSettings.authToken = credentials.token;
    saveSyncSettings(syncSettings);
  } else {
    // 获取用户信息失败，清除认证状态
    clearAuthCredentials();
    saveAuthState({ isAuthenticated: false, user: null, isLoading: false });
  }
}

/**
 * 更新用户信息
 */
export function updateUserInfo(updates: Partial<User>): void {
  const state = getAuthState();
  if (state.user) {
    const updatedUser = { ...state.user, ...updates };
    saveAuthState({ user: updatedUser });
  }
}

/**
 * 修改密码
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const credentials = getAuthCredentials();
  if (!credentials) {
    return { success: false, error: 'auth.notAuthenticated' };
  }

  // 调用后端API
  return apiChangePassword(currentPassword, newPassword);
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 验证密码强度
 * 返回密码强度评分（0-4）和提示信息
 */
export function checkPasswordStrength(password: string): {
  score: number;
  label: string;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('auth.passwordTooShort');
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('auth.passwordNeedMixedCase');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('auth.passwordNeedNumber');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('auth.passwordNeedSpecialChar');
  }

  const labels = ['auth.weak', 'auth.fair', 'auth.good', 'auth.strong', 'auth.veryStrong'];

  return {
    score,
    label: labels[score],
    feedback,
  };
}
