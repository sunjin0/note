/**
 * 认证 API 模块
 * 提供与后端认证相关的API调用
 * 
 * @module api/auth
 */

import { apiClient, ApiError } from './client';
import { API_ENDPOINTS } from './config';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@/core/storage';

/**
 * 后端认证响应接口
 */
interface BackendAuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresAt: string;
  };
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

/**
 * 用户注册
 */
export async function apiRegister(request: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<BackendAuthResponse>(
      API_ENDPOINTS.auth.register,
      {
        username: request.username,
        email: request.email,
        password: request.password,
        nickname: request.nickname,
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    }

    return {
      success: false,
      error: response.error?.code,
      fieldErrors: response.error?.fieldErrors,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.errorCode || error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    return { success: false, error: 'api.networkError' };
  }
}

/**
 * 用户登录
 */
export async function apiLogin(request: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<BackendAuthResponse>(
      API_ENDPOINTS.auth.login,
      {
        identifier: request.identifier,
        password: request.password,
        rememberMe: request.rememberMe,
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    }

    return {
      success: false,
      error: response.error?.code,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.errorCode || error.message,
      };
    }
    return { success: false, error: 'api.networkError' };
  }
}

/**
 * 用户登出
 */
export async function apiLogout(): Promise<void> {
  try {
    await apiClient.post(API_ENDPOINTS.auth.logout);
  } catch {
    // 即使API调用失败，本地也要清除状态
  }
}

/**
 * 获取当前用户信息
 */
export async function apiGetCurrentUser(): Promise<User | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: { user: User } }>(
      API_ENDPOINTS.auth.me
    );
    
    if (response.success) {
      return response.data.user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 刷新认证令牌
 */
export async function apiRefreshToken(refreshToken: string): Promise<{
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      data?: {
        token: string;
        refreshToken: string;
        expiresAt: string;
      };
      error?: { code: string; message: string };
    }>(API_ENDPOINTS.auth.refresh, { refreshToken });

    if (response.success && response.data) {
      return {
        success: true,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      };
    }

    return {
      success: false,
      error: response.error?.code,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.errorCode || error.message,
      };
    }
    return { success: false, error: 'api.networkError' };
  }
}

/**
 * 修改密码
 */
export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      error?: { code: string; message: string };
    }>(API_ENDPOINTS.auth.changePassword, {
      currentPassword,
      newPassword,
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.code,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.errorCode || error.message,
      };
    }
    return { success: false, error: 'api.networkError' };
  }
}
