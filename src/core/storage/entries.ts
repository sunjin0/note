/**
 * 日记条目存储管理
 * 提供日记条目的增删改查功能
 */

import { MoodEntry } from '@/types';
import { STORAGE_KEY } from './constants';
import { encryptData, decryptData } from './crypto';

/**
 * 生成唯一标识符
 * 使用时间戳和随机数组合生成
 * @returns 唯一标识字符串
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 加密日记条目
 * 对条目的 journal 字段进行加密，并标记为已加密
 * @param entry - 要加密的日记条目
 * @returns 加密后的日记条目
 */
export function encryptEntry(entry: MoodEntry): MoodEntry {
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
export function decryptEntry(entry: MoodEntry): MoodEntry {
  return {
    ...entry,
    journal: decryptData(entry.journal),
    journalEncrypted: false,
  };
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
 * 重新加密所有日记条目
 * 用于开启或关闭加密功能时批量处理现有数据
 * @param enableEncryption - 是否启用加密（true 为加密，false 为解密）
 * @param onProgress - 进度回调函数，参数为（当前处理数量，总数量）
 * @throws 如果处理过程中发生错误会抛出异常
 */
export function reEncryptAllEntries(
  enableEncryption: boolean,
  onProgress?: (current: number, total: number) => void
): void {
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
