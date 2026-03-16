/**
 * API 配置模块
 * 定义后端API的基础配置和常量
 * 
 * @module api/config
 */

/**
 * API 基础URL
 * 优先使用环境变量，否则使用默认值
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.moodjournal.app/v1';

/**
 * API 端点定义
 */
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    changePassword: '/auth/change-password',
  },
  // 同步相关
  sync: {
    sync: '/sync',
    status: '/sync/status',
    resolveConflict: '/sync/resolve-conflict',
  },
  // 用户数据
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
    deleteAccount: '/user/account',
  },
} as const;

/**
 * API 请求配置
 */
export const API_CONFIG = {
  /** 请求超时时间（毫秒） */
  timeout: 30000,
  /** 重试次数 */
  retryCount: 3,
  /** 重试延迟（毫秒） */
  retryDelay: 1000,
} as const;

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * API 错误码映射
 */
export const API_ERROR_CODES: Record<string, string> = {
  'AUTH_INVALID_CREDENTIALS': 'auth.invalidCredentials',
  'AUTH_USER_EXISTS': 'auth.emailExists',
  'AUTH_USERNAME_EXISTS': 'auth.usernameExists',
  'AUTH_TOKEN_EXPIRED': 'auth.tokenExpired',
  'AUTH_INVALID_TOKEN': 'auth.invalidToken',
  'AUTH_UNAUTHORIZED': 'auth.unauthorized',
  'VALIDATION_ERROR': 'api.validationError',
  'RATE_LIMIT_EXCEEDED': 'api.rateLimitExceeded',
  'SERVER_ERROR': 'api.serverError',
  'NETWORK_ERROR': 'api.networkError',
  'SYNC_CONFLICT': 'sync.conflictDetected',
};
