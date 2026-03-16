/**
 * 存储管理模块
 * 提供本地数据的增删改查、加密解密、密码保护等功能
 * 所有数据存储在浏览器的 localStorage 中
 * 
 * @module storage
 */

// 类型导出
export type {
  AppSettings,
  SecuritySettings,
  SecurityQuestion,
  DraftDataInfo,
  PasswordResetResult,
  LockoutStatus,
  SecurityQuestionOption,
  SecurityQuestionAnswer,
} from '@/core/storage/types';

// 常量导出
export {
  STORAGE_KEY,
  SETTINGS_KEY,
  SECURITY_KEY,
  SESSION_KEY,
  CUSTOM_FACTORS_KEY,
  DRAFT_KEY_PREFIX,
  MIN_SECURITY_QUESTIONS,
  MAX_SECURITY_QUESTIONS,
  DEFAULT_SECURITY_QUESTIONS,
  DEFAULT_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from '@/core/storage/constants';

// 日记条目管理
export {
  getEntries,
  saveEntry,
  updateEntry,
  deleteEntry,
  getEntryByDate,
  getEntriesForMonth,
  encryptEntry,
  decryptEntry,
  reEncryptAllEntries,
} from '@/core/storage/entries';

// 应用设置管理
export {
  getSettings,
  saveSettings,
} from '@/core/storage/settings';

// 安全设置与会话管理
export {
  getSecuritySettings,
  saveSecuritySettings,
  setPassword,
  disablePassword,
  verifyPassword,
  verifySecurityAnswers,
  resetPassword,
  changePasswordWithDataPreservation,
  createSession,
  clearSession,
  isSessionValid,
  isPasswordEnabled,
  getLockoutStatus,
} from '@/core/storage/security';

// 自定义因素管理
export {
  getCustomFactors,
  saveCustomFactors,
  addCustomFactor,
  updateCustomFactor,
  deleteCustomFactor,
  reorderCustomFactors,
  getAllFactors,
} from '@/core/storage/factors';

// 暂存数据管理
export {
  getDraftDataInfo,
  clearAllDraftData,
  saveDraft,
  getDraft,
  deleteDraft,
} from '@/core/storage/drafts';

// 统计数据管理
export {
  getStreak,
  getMoodStats,
  getTotalEntries,
  getLastEntryDate,
  getFirstEntryDate,
  getCurrentMonthEntries,
  getCurrentWeekEntries,
} from '@/core/storage/stats';

// 数据备份与导出
export {
  exportData,
  parseExportData,
  importData,
  clearAllData,
  downloadExportFile,
  type ExportData,
} from '@/core/storage/backup';

// 加密工具
export {
  simpleHash,
  encryptData,
  decryptData,
} from '@/core/storage/crypto';

// 数据同步
export {
  // 类型
  type SyncSettings,
  type SyncState,
  type SyncResult,
  type SyncPayload,
  type SyncResponse,
  type ConflictStrategy,
  // 常量
  SYNC_SETTINGS_KEY,
  SYNC_STATE_KEY,
  DEFAULT_SYNC_SETTINGS,
  DEFAULT_SYNC_STATE,
  // 设置管理
  getSyncSettings,
  saveSyncSettings,
  updateSyncSettings,
  // 状态管理
  getSyncState,
  saveSyncState,
  // 同步控制
  enableSync,
  disableSync,
  isSyncEnabled,
  setAuthToken,
  // 网络检测
  checkNetworkStatus,
  canSync,
  // 数据收集
  collectSyncData,
  // 冲突解决
  resolveConflict,
  // 同步操作
  performSync,
  forceSync,
  clearSyncData,
  // 自动同步
  startAutoSync,
  stopAutoSync,
  reconfigureAutoSync,
} from '@/core/storage/sync';

// 用户认证
export {
  // 类型
  type User,
  type AuthCredentials,
  type AuthState,
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
  // 常量
  AUTH_KEY,
  AUTH_STATE_KEY,
  DEFAULT_AUTH_STATE,
  // 凭据管理
  getAuthCredentials,
  saveAuthCredentials,
  clearAuthCredentials,
  // 状态管理
  getAuthState,
  saveAuthState,
  clearAuthState,
  // 认证检查
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  isTokenExpiringSoon,
  // 认证操作
  register,
  login,
  logout,
  refreshToken,
  initAuth,
  updateUserInfo,
  changePassword,
  // 验证工具
  isValidEmail,
  checkPasswordStrength,
} from '@/core/storage/auth';
