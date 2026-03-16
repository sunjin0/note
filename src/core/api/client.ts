/**
 * API 客户端模块
 * 提供HTTP请求封装、拦截器、错误处理等功能
 * 
 * @module api/client
 */

import { API_BASE_URL, API_CONFIG, HTTP_STATUS, API_ERROR_CODES } from './config';
import { getAuthToken, getAuthCredentials, saveAuthCredentials, clearAuthCredentials } from '@/core/storage';

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 请求配置接口
 */
interface RequestConfig extends RequestInit {
  /** 是否跳过认证 */
  skipAuth?: boolean;
  /** 重试次数 */
  retryCount?: number;
  /** 超时时间 */
  timeout?: number;
}

/**
 * 构建完整URL
 */
function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

/**
 * 获取请求头
 */
function getHeaders(config: RequestConfig): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // 添加认证令牌
  if (!config.skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * 带超时的fetch
 */
async function fetchWithTimeout(
  url: string,
  config: RequestConfig
): Promise<Response> {
  const timeout = config.timeout || API_CONFIG.timeout;
  
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new ApiError('Request timeout', 0, 'TIMEOUT'));
    }, timeout);

    fetch(url, {
      ...config,
      signal: controller.signal,
    })
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

/**
 * 处理API响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // 处理空响应
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorCode = data.code || data.error?.code;
    const message = data.message || data.error?.message || 'Request failed';
    const fieldErrors = data.errors || data.fieldErrors;
    
    throw new ApiError(
      message,
      response.status,
      errorCode,
      fieldErrors
    );
  }

  return data as T;
}

/**
 * 刷新认证令牌
 */
async function refreshAuthToken(): Promise<string | null> {
  const credentials = getAuthCredentials();
  if (!credentials?.refreshToken) return null;

  try {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: credentials.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // 更新存储的凭据
    const newCredentials = {
      ...credentials,
      token: data.token,
      refreshToken: data.refreshToken || credentials.refreshToken,
      expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    saveAuthCredentials(newCredentials);

    return data.token;
  } catch {
    // 刷新失败，清除认证状态
    clearAuthCredentials();
    return null;
  }
}

/**
 * 发送API请求
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  const retryCount = config.retryCount ?? API_CONFIG.retryCount;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        ...config,
        headers: getHeaders(config),
      });

      // 处理401错误 - 尝试刷新令牌
      if (response.status === HTTP_STATUS.UNAUTHORIZED && !config.skipAuth) {
        const newToken = await refreshAuthToken();
        if (newToken && attempt < retryCount) {
          // 使用新令牌重试
          continue;
        }
      }

      return await handleResponse<T>(response);
    } catch (error) {
      lastError = error as Error;
      
      // 网络错误时重试
      if (error instanceof TypeError && attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1)));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * API 客户端
 */
export const apiClient = {
  /**
   * GET 请求
   */
  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, { ...config, method: 'GET' });
  },

  /**
   * POST 请求
   */
  post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT 请求
   */
  put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH 请求
   */
  patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE 请求
   */
  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, { ...config, method: 'DELETE' });
  },
};

/**
 * 获取API错误消息
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // 优先使用错误码映射
    if (error.errorCode && API_ERROR_CODES[error.errorCode]) {
      return API_ERROR_CODES[error.errorCode];
    }
    
    // 根据状态码返回通用错误
    switch (error.statusCode) {
      case HTTP_STATUS.UNAUTHORIZED:
        return 'auth.unauthorized';
      case HTTP_STATUS.FORBIDDEN:
        return 'auth.forbidden';
      case HTTP_STATUS.NOT_FOUND:
        return 'api.notFound';
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return 'api.rateLimitExceeded';
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return 'api.serverError';
      default:
        return error.message;
    }
  }
  
  if (error instanceof TypeError) {
    return 'api.networkError';
  }
  
  return 'api.unknownError';
}

export { API_BASE_URL, API_CONFIG, HTTP_STATUS };
