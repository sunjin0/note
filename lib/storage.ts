/**
 * 存储管理模块
 * 提供本地数据的增删改查、加密解密、密码保护等功能
 * 所有数据存储在浏览器的 localStorage 中
 */

import { MoodEntry, MoodStats, FactorOption } from './types';

/** 日记条目存储键名 */
const STORAGE_KEY = 'mood_journal_entries';
/** 应用设置存储键名 */
const SETTINGS_KEY = 'mood_journal_settings';
/** 安全设置存储键名 */
const SECURITY_KEY = 'mood_journal_security';
/** 会话信息存储键名 */
const SESSION_KEY = 'mood_journal_session';
/** 自定义因素存储键名 */
const CUSTOM_FACTORS_KEY = 'mood_journal_custom_factors';

/**
 * 应用设置接口
 */
export interface AppSettings {
  /** 是否启用数据加密 */
  encrypted: boolean;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 安全设置接口
 */
export interface SecuritySettings {
  /** 是否启用密码保护 */
  passwordEnabled: boolean;
  /** 密码哈希值 */
  passwordHash: string;
  /** 安全问题列表 */
  securityQuestions: SecurityQuestion[];
  /** 密码错误尝试次数 */
  lockoutAttempts: number;
  /** 锁定截止时间 */
  lockoutUntil: string | null;
}

/**
 * 安全问题接口
 */
export interface SecurityQuestion {
  /** 问题唯一标识 */
  id: string;
  /** 问题内容 */
  question: string;
  /** 答案哈希值 */
  answerHash: string;
}

/** 默认安全问题列表 */
export const DEFAULT_SECURITY_QUESTIONS = [
  { id: 'q1', questionKey: 'security.questions.pet', defaultQuestion: '你童年宠物的名字是什么？' },
  { id: 'q2', questionKey: 'security.questions.school', defaultQuestion: '你小学的名字是什么？' },
  { id: 'q3', questionKey: 'security.questions.city', defaultQuestion: '你出生的城市是哪里？' },
  { id: 'q4', questionKey: 'security.questions.mother', defaultQuestion: '你母亲的娘家姓是什么？' },
  { id: 'q5', questionKey: 'security.questions.book', defaultQuestion: '你最喜欢的书是什么？' },
];

/** 最小安全问题数量 */
export const MIN_SECURITY_QUESTIONS = 1;
/** 最大安全问题数量 */
export const MAX_SECURITY_QUESTIONS = 5;

/**
 * 简单的字符串哈希函数
 * 用于密码和安全问题答案的哈希存储
 * @param str - 要哈希的字符串
 * @returns 哈希后的字符串（36进制）
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * 获取加密密钥
 * 使用当前密码哈希作为密钥，如果没有设置密码则使用默认密钥
 * @returns 加密密钥字符串
 */
function getEncryptionKey(): string {
  const security = getSecuritySettings();
  return security.passwordHash || 'default-key';
}

/**
 * 将字符串转换为 Uint8Array
 * 使用 TextEncoder 进行 UTF-8 编码
 * @param str - 要转换的字符串
 * @returns Uint8Array 字节数组
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * 将 Uint8Array 转换为字符串
 * 使用 TextDecoder 进行 UTF-8 解码
 * @param bytes - 要转换的字节数组
 * @returns 解码后的字符串
 */
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * 将 Uint8Array 转换为 Base64 字符串
 * @param bytes - 要转换的字节数组
 * @returns Base64 编码的字符串
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

/**
 * 将 Base64 字符串转换为 Uint8Array
 * @param base64 - Base64 编码的字符串
 * @returns 解码后的字节数组
 */
function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
}

/**
 * 使用 XOR 算法加密/解密字节数据
 * 由于 XOR 的特性，对同一数据执行两次相同操作会还原原数据
 * @param data - 要加密/解密的字节数组
 * @param key - 加密密钥
 * @returns 加密/解密后的字节数组
 */
function xorBytes(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = stringToBytes(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

/**
 * 加密数据
 * 将字符串转换为 UTF-8 字节，使用 XOR 加密，然后编码为 Base64
 * @param data - 要加密的明文字符串
 * @returns Base64 编码的加密字符串
 */
function encryptData(data: string): string {
  const key = getEncryptionKey();
  const dataBytes = stringToBytes(data);
  const encryptedBytes = xorBytes(dataBytes, key);
  return bytesToBase64(encryptedBytes);
}

/**
 * 解密数据
 * 将 Base64 字符串解码，使用 XOR 解密，然后转换为 UTF-8 字符串
 * @param encryptedData - Base64 编码的加密字符串
 * @returns 解密后的明文字符串，解密失败则返回原字符串
 */
function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const encryptedBytes = base64ToBytes(encryptedData);
    const decryptedBytes = xorBytes(encryptedBytes, key);
    return bytesToString(decryptedBytes);
  } catch {
    return encryptedData;
  }
}

/**
 * 加密日记条目
 * 对条目的 journal 字段进行加密，并标记为已加密
 * @param entry - 要加密的日记条目
 * @returns 加密后的日记条目
 */
function encryptEntry(entry: MoodEntry): MoodEntry {
  return {
    ...entry,
    journal: encryptData(entry.journal),
    journalEncrypted: true,
  };
}

/**
 * 解密日记条目
 * 对条目的 journal 字段进行解密，并标记为未加密
 * @param entry - 要解密的日记条目
 * @returns 解密后的日记条目
 */
function decryptEntry(entry: MoodEntry): MoodEntry {
  return {
    ...entry,
    journal: decryptData(entry.journal),
    journalEncrypted: false,
  };
}

/**
 * 生成唯一标识符
 * 使用时间戳和随机数组合生成
 * @returns 唯一标识字符串
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 获取所有日记条目
 * 从 localStorage 中读取所有条目，自动解密并按日期降序排列（最新的在前）
 * @returns 日记条目数组，如果读取失败则返回空数组
 * @remarks 在服务端渲染（SSR）环境下返回空数组
 */
export function getEntries(): MoodEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const entries = JSON.parse(data) as MoodEntry[];
    return entries
      .map(decryptEntry)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

/**
 * 保存日记条目
 * 如果指定日期已存在条目则更新，否则创建新条目
 * @param entry - 要保存的日记条目数据（不含 id、createdAt、updatedAt）
 * @returns 保存后的完整日记条目（包含生成的 id 和时间戳）
 */
export function saveEntry(entry: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt'>): MoodEntry {
  const entries = getEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const updated: MoodEntry = {
      ...entries[existingIndex],
      ...entry,
      updatedAt: now,
    };
    const encryptedUpdated = encryptEntry(updated);
    entries[existingIndex] = encryptedUpdated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return updated;
  }

  const newEntry: MoodEntry = {
    ...entry,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const encryptedNewEntry = encryptEntry(newEntry);
  entries.unshift(encryptedNewEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return newEntry;
}

/**
 * 更新日记条目
 * 根据 id 查找并更新条目的指定字段
 * @param id - 要更新的条目 id
 * @param updates - 要更新的字段部分数据
 * @returns 更新后的完整条目，如果未找到则返回 null
 */
export function updateEntry(id: string, updates: Partial<MoodEntry>): MoodEntry | null {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index < 0) return null;

  const updated: MoodEntry = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  const encryptedUpdated = encryptEntry(updated);
  entries[index] = encryptedUpdated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return updated;
}

/**
 * 删除日记条目
 * @param id - 要删除的条目 id
 * @returns 是否成功删除（找到并删除了条目返回 true，未找到返回 false）
 */
export function deleteEntry(id: string): boolean {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * 根据日期获取日记条目
 * @param date - 日期字符串（格式：YYYY-MM-DD）
 * @returns 找到的日记条目，未找到则返回 undefined
 */
export function getEntryByDate(date: string): MoodEntry | undefined {
  return getEntries().find(e => e.date === date);
}

/**
 * 获取指定月份的日记条目
 * @param year - 年份
 * @param month - 月份（0-11，0 表示一月）
 * @returns 该月份的所有日记条目
 */
export function getEntriesForMonth(year: number, month: number): MoodEntry[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return getEntries().filter(e => e.date.startsWith(prefix));
}

/**
 * 获取应用设置
 * @returns 应用设置对象，如果不存在则返回默认设置
 * @remarks 默认设置为未加密，创建时间为当前时间
 * @remarks 在服务端渲染（SSR）环境下返回默认设置
 */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return { encrypted: false, createdAt: new Date().toISOString() };
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { encrypted: false, createdAt: new Date().toISOString() };
    return JSON.parse(data) as AppSettings;
  } catch {
    return { encrypted: false, createdAt: new Date().toISOString() };
  }
}

/**
 * 保存应用设置
 * @param settings - 要保存的应用设置对象
 */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * 导出所有数据
 * 将日记条目、应用设置和安全设置导出为 JSON 字符串
 * @returns 格式化的 JSON 字符串，包含所有数据
 */
export function exportData(): string {
  const entries = getEntries();
  const settings = getSettings();
  const securitySettings = getSecuritySettings();
  return JSON.stringify({ entries, settings, securitySettings, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * 清除所有数据
 * 删除所有日记条目、应用设置、安全设置和会话信息
 * @remarks 此操作不可逆，请谨慎使用
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(SECURITY_KEY);
  clearSession();
}

/**
 * 重新加密所有日记条目
 * 用于开启或关闭加密功能时批量处理现有数据
 * @param enableEncryption - 是否启用加密（true 为加密，false 为解密）
 * @param onProgress - 进度回调函数，参数为（当前处理数量，总数量）
 * @throws 如果处理过程中发生错误会抛出异常
 */
export function reEncryptAllEntries(enableEncryption: boolean, onProgress?: (current: number, total: number) => void): void {
  if (typeof window === 'undefined') return;
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  
  try {
    const entries = JSON.parse(data) as MoodEntry[];
    const total = entries.length;
    
    const processedEntries = entries.map((entry, index) => {
      if (onProgress) {
        onProgress(index + 1, total);
      }
      
      if (enableEncryption) {
        // Encrypt if not already encrypted
        if (!entry.journalEncrypted) {
          return encryptEntry(entry);
        }
      } else {
        // Decrypt if encrypted
        if (entry.journalEncrypted) {
          return decryptEntry(entry);
        }
      }
      return entry;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processedEntries));
  } catch (error) {
    console.error('Failed to re-encrypt entries:', error);
    throw error;
  }
}

/**
 * 获取连续记录天数
 * 计算从今天往前连续有记录的天数
 * @returns 连续记录天数，如果没有记录则返回 0
 * @remarks 最多计算 365 天
 */
export function getStreak(): number {
  const entries = getEntries();
  if (entries.length === 0) return 0;

  const dates = new Set(entries.map(e => e.date));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * 获取心情统计
 * 统计各种心情类型的出现次数
 * @returns 心情统计对象，包含每种心情的计数
 */
export function getMoodStats(): MoodStats {
  const entries = getEntries();
  const stats: MoodStats = { great: 0, good: 0, okay: 0, sad: 0, angry: 0 };
  entries.forEach(e => { stats[e.mood] = (stats[e.mood] || 0) + 1; });
  return stats;
}

/**
 * 获取安全设置
 * @returns 安全设置对象，如果不存在则返回默认设置（密码未启用）
 * @remarks 在服务端渲染（SSR）环境下返回默认设置
 */
export function getSecuritySettings(): SecuritySettings {
  if (typeof window === 'undefined') {
    return {
      passwordEnabled: false,
      passwordHash: '',
      securityQuestions: [],
      lockoutAttempts: 0,
      lockoutUntil: null,
    };
  }
  try {
    const data = localStorage.getItem(SECURITY_KEY);
    if (!data) {
      return {
        passwordEnabled: false,
        passwordHash: '',
        securityQuestions: [],
        lockoutAttempts: 0,
        lockoutUntil: null,
      };
    }
    return JSON.parse(data) as SecuritySettings;
  } catch {
    return {
      passwordEnabled: false,
      passwordHash: '',
      securityQuestions: [],
      lockoutAttempts: 0,
      lockoutUntil: null,
    };
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
export function setPassword(password: string, questions: { question: string; answer: string }[]): void {
  const security: SecuritySettings = {
    passwordEnabled: true,
    passwordHash: simpleHash(password),
    securityQuestions: questions.map(q => ({
      id: Math.random().toString(36).substr(2, 9),
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
export function resetPassword(newPassword: string): { success: boolean; error?: string } {
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

    const entries = JSON.parse(data) as MoodEntry[];
    
    const decryptedEntries: MoodEntry[] = [];
    for (const entry of entries) {
      const decryptedEntry = decryptEntry(entry);
      if (entry.journalEncrypted && decryptedEntry.journal === entry.journal) {
        return { 
          success: false, 
          error: 'Failed to decrypt some entries. Data may be corrupted.' 
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

    const reEncryptedEntries = decryptedEntries.map(entry => encryptEntry(entry));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reEncryptedEntries));

    createSession();

    return { success: true };
  } catch (error) {
    console.error('Password reset failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Password reset failed due to an unexpected error' 
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
  questions: { question: string; answer: string }[]
): { success: boolean; error?: string } {
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
        securityQuestions: questions.map(q => ({
          id: Math.random().toString(36).substr(2, 9),
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

    const entries = JSON.parse(data) as MoodEntry[];
    
    // Step 3: Decrypt all entries with old password (current key)
    const decryptedEntries: MoodEntry[] = [];
    for (const entry of entries) {
      const decryptedEntry = decryptEntry(entry);
      // Verify decryption was successful (if it was encrypted)
      if (entry.journalEncrypted && decryptedEntry.journal === entry.journal) {
        // Decryption failed - journal content is still encrypted
        return { 
          success: false, 
          error: 'Failed to decrypt some entries. Please ensure your current password is correct.' 
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
      securityQuestions: questions.map(q => ({
        id: Math.random().toString(36).substr(2, 9),
        question: q.question,
        answerHash: simpleHash(q.answer.toLowerCase().trim()),
      })),
      lockoutAttempts: 0,
      lockoutUntil: null,
    };
    saveSecuritySettings(newSecurity);

    // Step 6: Re-encrypt all entries with new password
    const reEncryptedEntries = decryptedEntries.map(entry => encryptEntry(entry));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reEncryptedEntries));

    // Step 7: Create new session
    createSession();

    return { success: true };
  } catch (error) {
    console.error('Password change failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Password change failed due to an unexpected error' 
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
export function getLockoutStatus(): { isLocked: boolean; remainingMinutes: number } {
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

/**
 * 自定义因素管理
 * 提供自定义心情影响因素的增删改查功能
 */

/**
 * 获取所有自定义因素
 * @returns 自定义因素数组，如果读取失败则返回空数组
 * @remarks 在服务端渲染（SSR）环境下返回空数组
 */
export function getCustomFactors(): FactorOption[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CUSTOM_FACTORS_KEY);
    if (!data) return [];
    return JSON.parse(data) as FactorOption[];
  } catch {
    return [];
  }
}

/**
 * 保存自定义因素列表
 * @param factors - 要保存的自定义因素数组
 * @remarks 在服务端渲染（SSR）环境下不执行任何操作
 */
export function saveCustomFactors(factors: FactorOption[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_FACTORS_KEY, JSON.stringify(factors));
}

/**
 * 添加自定义因素
 * @param factor - 要添加的因素数据（不含 isCustom 字段）
 * @returns 添加后的完整因素对象（包含 isCustom=true）
 */
export function addCustomFactor(factor: Omit<FactorOption, 'isCustom'>): FactorOption {
  const customFactors = getCustomFactors();
  const newFactor: FactorOption = {
    ...factor,
    isCustom: true,
  };
  customFactors.push(newFactor);
  saveCustomFactors(customFactors);
  return newFactor;
}

/**
 * 更新自定义因素
 * @param id - 要更新的因素 id
 * @param updates - 要更新的字段部分数据
 * @returns 更新后的完整因素对象，如果未找到则返回 null
 */
export function updateCustomFactor(id: string, updates: Partial<FactorOption>): FactorOption | null {
  const customFactors = getCustomFactors();
  const index = customFactors.findIndex(f => f.id === id);
  if (index < 0) return null;
  
  customFactors[index] = { ...customFactors[index], ...updates };
  saveCustomFactors(customFactors);
  return customFactors[index];
}

/**
 * 删除自定义因素
 * @param id - 要删除的因素 id
 * @returns 是否成功删除（找到并删除了因素返回 true，未找到返回 false）
 */
export function deleteCustomFactor(id: string): boolean {
  const customFactors = getCustomFactors();
  const filtered = customFactors.filter(f => f.id !== id);
  if (filtered.length === customFactors.length) return false;
  saveCustomFactors(filtered);
  return true;
}

/**
 * 重新排序自定义因素
 * @param factors - 排序后的因素数组
 * @remarks 直接替换整个因素列表，用于拖拽排序后保存
 */
export function reorderCustomFactors(factors: FactorOption[]): void {
  saveCustomFactors(factors);
}

/**
 * 获取所有因素（预设 + 自定义）
 * @returns 包含预设因素和自定义因素的完整数组
 */
export function getAllFactors(): FactorOption[] {
  const { FACTOR_OPTIONS } = require('./types');
  const customFactors = getCustomFactors();
  return [...FACTOR_OPTIONS, ...customFactors];
}

/**
 * 暂存数据管理
 * 管理编辑器中自动保存的草稿数据
 */

/** 暂存数据键名前缀 */
const DRAFT_KEY_PREFIX = 'mood_draft_';

/**
 * 暂存数据信息接口
 */
export interface DraftDataInfo {
  /** 数据大小（字节） */
  size: number;
  /** 格式化后的大小字符串 */
  formattedSize: string;
  /** 暂存条目数量 */
  count: number;
}

/**
 * 获取暂存数据信息
 * 统计所有暂存数据的大小和数量
 * @returns 暂存数据信息对象
 * @remarks 在服务端渲染（SSR）环境下返回零值
 */
export function getDraftDataInfo(): DraftDataInfo {
  if (typeof window === 'undefined') {
    return { size: 0, formattedSize: '0 KB', count: 0 };
  }
  
  try {
    let totalSize = 0;
    let count = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        const value = localStorage.getItem(key) || '';
        totalSize += new Blob([value]).size;
        count++;
      }
    }
    
    return {
      size: totalSize,
      formattedSize: formatBytes(totalSize),
      count,
    };
  } catch {
    return { size: 0, formattedSize: '0 KB', count: 0 };
  }
}

/**
 * 格式化字节大小
 * 将字节数转换为人类可读的格式（B/KB/MB/GB）
 * @param bytes - 字节数
 * @returns 格式化后的字符串，如 "1.5 MB"
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

/**
 * 清除所有暂存数据
 * 删除所有以 DRAFT_KEY_PREFIX 开头的 localStorage 项
 * @remarks 在服务端渲染（SSR）环境下不执行任何操作
 */
export function clearAllDraftData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear draft data:', error);
  }
}
