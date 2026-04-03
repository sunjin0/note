/**
 * 安全设置与会话管理
 * 提供密码保护、安全问题、会话管理等功能
 */

import {
  SecuritySettings,
  SecurityQuestionAnswer,
  PasswordResetResult,
  LockoutStatus,
} from './types';
import { SECURITY_KEY, SESSION_KEY, DEFAULT_SECURITY_SETTINGS, STORAGE_KEY } from './constants';
import { simpleHash } from './crypto';
import { encryptEntry, decryptEntry, getEntries } from './entries';

/**
 * 获取安全设置
 * @returns 安全设置对象，如果不存在则返回默认设置（密码未启用）
 * @remarks 在服务端渲染（SSR）环境下返回默认设置
 */
export function getSecuritySettings(): SecuritySettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SECURITY_SETTINGS };
  }
  try {
    const data = localStorage.getItem(SECURITY_KEY);
    if (!data) {
      return { ...DEFAULT_SECURITY_SETTINGS };
    }
    return JSON.parse(data) as SecuritySettings;
  } catch {
    return { ...DEFAULT_SECURITY_SETTINGS };
  }
}

/**
 * 保存安全设置
 * @param settings - 要保存的安全设置对象
 * @remarks 在服务端渲染（SSR）环境下不执行任何操作
 */
export function saveSecuritySettings(settings: SecuritySettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SECURITY_KEY, JSON.stringify(settings));
}

/**
 * 设置密码
 * 首次启用密码保护时调用
 * @param password - 要设置的密码
 * @param questions - 安全问题数组，每个问题包含问题和答案
 */
export function setPassword(password: string, questions: SecurityQuestionAnswer[]): void {
  const security: SecuritySettings = {
    passwordEnabled: true,
    passwordHash: simpleHash(password),
    securityQuestions: questions.map((q) => ({
      id: Math.random().toString(36).substring(2, 11),
      question: q.question,
      answerHash: simpleHash(q.answer.toLowerCase().trim()),
    })),
    lockoutAttempts: 0,
    lockoutUntil: null,
  };
  saveSecuritySettings(security);
}

/**
 * 禁用密码保护
 * 关闭密码保护功能，清除所有密码相关设置和会话
 */
export function disablePassword(): void {
  const settings = getSecuritySettings();
  settings.passwordEnabled = false;
  settings.passwordHash = '';
  settings.securityQuestions = [];
  settings.lockoutAttempts = 0;
  settings.lockoutUntil = null;
  saveSecuritySettings(settings);
  clearSession();
}

/**
 * 验证密码
 * 检查密码是否正确，处理锁定逻辑，成功后创建会话
 * @param password - 要验证的密码
 * @returns 密码是否正确
 * @remarks 连续 5 次错误会锁定 30 分钟
 */
export function verifyPassword(password: string): boolean {
  const settings = getSecuritySettings();
  if (!settings.passwordEnabled) return true;

  if (settings.lockoutUntil) {
    const lockoutTime = new Date(settings.lockoutUntil).getTime();
    if (Date.now() < lockoutTime) {
      return false;
    }
    settings.lockoutUntil = null;
    settings.lockoutAttempts = 0;
  }

  const isValid = simpleHash(password) === settings.passwordHash;

  if (!isValid) {
    settings.lockoutAttempts++;
    if (settings.lockoutAttempts >= 5) {
      settings.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    }
    saveSecuritySettings(settings);
  } else {
    settings.lockoutAttempts = 0;
    settings.lockoutUntil = null;
    saveSecuritySettings(settings);
    createSession();
  }

  return isValid;
}

/**
 * 验证安全问题答案
 * 用于忘记密码流程中的身份验证
 * @param answers - 用户提供的答案数组，顺序需与设置时一致
 * @returns 所有答案是否正确
 */
export function verifySecurityAnswers(answers: string[]): boolean {
  const settings = getSecuritySettings();
  if (!settings.passwordEnabled || settings.securityQuestions.length === 0) return false;

  return settings.securityQuestions.every((q, index) => {
    const answer = answers[index]?.toLowerCase().trim() || '';
    return simpleHash(answer) === q.answerHash;
  });
}

/**
 * 重置密码（忘记密码流程）
 * 在通过安全问题验证后重置密码，同时保护已加密数据
 * 流程：解密所有数据 → 重置密码 → 重新加密所有数据
 * @param newPassword - 新密码
 * @returns 操作结果，包含成功状态和可能的错误信息
 * @remarks 在服务端渲染（SSR）环境下会失败
 * @remarks 如果解密失败会阻止密码重置，防止数据丢失
 */
export function resetPassword(newPassword: string): PasswordResetResult {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot reset password in SSR context' };
  }

  try {
    const settings = getSecuritySettings();

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      settings.passwordHash = simpleHash(newPassword);
      settings.lockoutAttempts = 0;
      settings.lockoutUntil = null;
      saveSecuritySettings(settings);
      createSession();
      return { success: true };
    }

    const entries = JSON.parse(data) as import('@/types').MoodEntry[];

    const decryptedEntries: import('@/types').MoodEntry[] = [];
    for (const entry of entries) {
      const decryptedEntry = decryptEntry(entry);
      if (entry.journalEncrypted && decryptedEntry.journal === entry.journal) {
        return {
          success: false,
          error: 'Failed to decrypt some entries. Data may be corrupted.',
        };
      }
      decryptedEntries.push({
        ...decryptedEntry,
        journalEncrypted: false,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(decryptedEntries));

    settings.passwordHash = simpleHash(newPassword);
    settings.lockoutAttempts = 0;
    settings.lockoutUntil = null;
    saveSecuritySettings(settings);

    const reEncryptedEntries = decryptedEntries.map((entry) => encryptEntry(entry));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reEncryptedEntries));

    createSession();

    return { success: true };
  } catch (error) {
    console.error('Password reset failed:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Password reset failed due to an unexpected error',
    };
  }
}

/**
 * 修改密码并保护数据（修改密码流程）
 * 在修改密码时先解密所有数据，修改密码后再重新加密
 * 流程：验证旧密码 → 解密所有数据 → 修改密码 → 重新加密所有数据
 * @param oldPassword - 当前密码（用于解密数据）
 * @param newPassword - 新密码（用于重新加密数据）
 * @param questions - 新的安全问题数组
 * @returns 操作结果，包含成功状态和可能的错误信息
 * @remarks 在服务端渲染（SSR）环境下会失败
 * @remarks 如果旧密码验证失败或解密失败会阻止密码修改，防止数据丢失
 */
export function changePasswordWithDataPreservation(
  oldPassword: string,
  newPassword: string,
  questions: SecurityQuestionAnswer[]
): PasswordResetResult {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot change password in SSR context' };
  }

  try {
    // Step 1: Verify old password
    const settings = getSecuritySettings();
    if (settings.passwordEnabled && simpleHash(oldPassword) !== settings.passwordHash) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Step 2: Get all entries and decrypt them with old key
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // No entries, just change password
      const newSecurity: SecuritySettings = {
        passwordEnabled: true,
        passwordHash: simpleHash(newPassword),
        securityQuestions: questions.map((q) => ({
          id: Math.random().toString(36).substring(2, 11),
          question: q.question,
          answerHash: simpleHash(q.answer.toLowerCase().trim()),
        })),
        lockoutAttempts: 0,
        lockoutUntil: null,
      };
      saveSecuritySettings(newSecurity);
      createSession();
      return { success: true };
    }

    const entries = JSON.parse(data) as import('@/types').MoodEntry[];

    // Step 3: Decrypt all entries with old password (current key)
    const decryptedEntries: import('@/types').MoodEntry[] = [];
    for (const entry of entries) {
      const decryptedEntry = decryptEntry(entry);
      // Verify decryption was successful (if it was encrypted)
      if (entry.journalEncrypted && decryptedEntry.journal === entry.journal) {
        // Decryption failed - journal content is still encrypted
        return {
          success: false,
          error: 'Failed to decrypt some entries. Please ensure your current password is correct.',
        };
      }
      decryptedEntries.push({
        ...decryptedEntry,
        journalEncrypted: false, // Mark as plaintext temporarily
      });
    }

    // Step 4: Save decrypted entries temporarily (as plaintext)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decryptedEntries));

    // Step 5: Update password and security settings
    const newSecurity: SecuritySettings = {
      passwordEnabled: true,
      passwordHash: simpleHash(newPassword),
      securityQuestions: questions.map((q) => ({
        id: Math.random().toString(36).substring(2, 11),
        question: q.question,
        answerHash: simpleHash(q.answer.toLowerCase().trim()),
      })),
      lockoutAttempts: 0,
      lockoutUntil: null,
    };
    saveSecuritySettings(newSecurity);

    // Step 6: Re-encrypt all entries with new password
    const reEncryptedEntries = decryptedEntries.map((entry) => encryptEntry(entry));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reEncryptedEntries));

    // Step 7: Create new session
    createSession();

    return { success: true };
  } catch (error) {
    console.error('Password change failed:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Password change failed due to an unexpected error',
    };
  }
}

/**
 * 创建会话
 * 在用户成功验证密码后创建会话，用于保持登录状态
 * @remarks 在服务端渲染（SSR）环境下不执行任何操作
 * @remarks 会话信息存储在 sessionStorage 中，页面关闭后自动清除
 */
export function createSession(): void {
  if (typeof window === 'undefined') return;
  const session = {
    authenticated: true,
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * 清除会话
 * 用于登出或禁用密码保护时清除登录状态
 * @remarks 在服务端渲染（SSR）环境下不执行任何操作
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * 检查会话是否有效
 * @returns 会话是否有效（已认证）
 * @remarks 在服务端渲染（SSR）环境下返回 true
 */
export function isSessionValid(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    if (!data) return false;
    const session = JSON.parse(data);
    return session.authenticated === true;
  } catch {
    return false;
  }
}

/**
 * 检查是否启用了密码保护
 * @returns 是否已启用密码保护
 */
export function isPasswordEnabled(): boolean {
  const settings = getSecuritySettings();
  return settings.passwordEnabled;
}

/**
 * 获取账户锁定状态
 * 检查是否因多次密码错误而被锁定，以及剩余锁定时间
 * @returns 锁定状态对象，包含是否锁定和剩余分钟数
 * @remarks 如果锁定时间已过期，会自动清除锁定状态
 */
export function getLockoutStatus(): LockoutStatus {
  const settings = getSecuritySettings();
  if (!settings.lockoutUntil) return { isLocked: false, remainingMinutes: 0 };

  const lockoutTime = new Date(settings.lockoutUntil).getTime();
  const remaining = Math.ceil((lockoutTime - Date.now()) / (60 * 1000));

  if (remaining <= 0) {
    settings.lockoutUntil = null;
    settings.lockoutAttempts = 0;
    saveSecuritySettings(settings);
    return { isLocked: false, remainingMinutes: 0 };
  }

  return { isLocked: true, remainingMinutes: remaining };
}
