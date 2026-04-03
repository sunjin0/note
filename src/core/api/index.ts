/**
 * API 模块
 * 提供与后端通信的所有功能
 * 
 * @module api
 */

// 配置
export {
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
  HTTP_STATUS,
  API_ERROR_CODES,
} from './config';

// 客户端
export {
  apiClient,
  ApiError,
  getApiErrorMessage,
} from './client';

// 认证 API
export {
  apiRegister,
  apiLogin,
  apiLogout,
  apiGetCurrentUser,
  apiRefreshToken,
  apiChangePassword,
} from './auth';

// 同步 API
export {
  apiSync,
  apiGetSyncStatus,
  apiResolveConflict,
  type SyncResult,
  type SyncPayload,
  type ConflictDetail,
} from './sync';
