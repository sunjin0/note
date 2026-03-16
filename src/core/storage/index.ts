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
