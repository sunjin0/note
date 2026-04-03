/**
 * 日记条目存储管理
 * 提供日记条目的增删改查功能
 */

import { MoodEntry } from '@/types';
import { STORAGE_KEY } from './constants';
import { encryptData, decryptData } from './crypto';
import { getSettings } from './settings';

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
  const settings = getSettings();
  const shouldEncrypt = settings.encrypted;
  const entries = getEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);

  const now = new Date().toISOString();

  let savedEntry: MoodEntry;

  if (existingIndex >= 0) {
    const updated: MoodEntry = {
      ...entries[existingIndex],
      ...entry,
      updatedAt: now,
      deletedAt: undefined,
    };
    savedEntry = updated;
    entries[existingIndex] = updated;
  } else {
    const newEntry: MoodEntry = {
      ...entry,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    savedEntry = newEntry;
    entries.unshift(newEntry);
  }

  const entriesToSave = entries.map(e => {
    if (shouldEncrypt) {
      return encryptEntry(e);
    } else {
      return { ...e, journalEncrypted: false };
    }
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));

  import('./sync').then(({ trackPendingChange }) => {
    trackPendingChange(savedEntry);
  }).catch(() => {});

  return savedEntry;
}

/**
 * 更新日记条目
 * 根据 id 查找并更新条目的指定字段
 * @param id - 要更新的条目 id
 * @param updates - 要更新的字段部分数据
 * @returns 更新后的完整条目，如果未找到则返回 null
 */
export function updateEntry(id: string, updates: Partial<MoodEntry>): MoodEntry | null {
  const settings = getSettings();
  const shouldEncrypt = settings.encrypted;
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index < 0) return null;

  const updated: MoodEntry = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  entries[index] = updated;
  
  const entriesToSave = entries.map(e => {
    if (shouldEncrypt) {
      return encryptEntry(e);
    } else {
      return { ...e, journalEncrypted: false };
    }
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));

  import('./sync').then(({ trackPendingChange }) => {
    trackPendingChange(updated);
  }).catch(() => {});

  return updated;
}

/**
 * 软删除日记条目（标记为 deletedAt，但不物理删除)
 * @param id - 要删除的条目 id
 * @returns 是否成功标记为删除（找到并标记为已删除）
 */
export function deleteEntry(id: string): boolean {
  const settings = getSettings();
  const shouldEncrypt = settings.encrypted;
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index < 0) return false;
  
  const now = new Date().toISOString();
  
  entries[index] = {
    ...entries[index],
    deletedAt: now,
    updatedAt: now,
  };
  
  const entriesToSave = entries.map(e => {
    if (shouldEncrypt) {
      return encryptEntry(e);
    } else {
      return { ...e, journalEncrypted: false };
    }
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));
  
  import('./sync').then(({ trackDeletedId }) => {
    trackDeletedId(id);
  }).catch(() => {});

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

/**
 * 批量保存从服务器同步的日记条目
 * 不会触发同步追踪，用于接收服务器数据
 * @param syncedEntries - 从服务器同步的日记条目数组
 * @returns 保存的条目数量
 */
export function saveSyncedEntries(syncedEntries: MoodEntry[]): number {
  if (typeof window === 'undefined' || syncedEntries.length === 0) return 0;
  
  const settings = getSettings();
  const shouldEncrypt = settings.encrypted;
  
  const data = localStorage.getItem(STORAGE_KEY);
  let entries: MoodEntry[] = data ? JSON.parse(data) : [];
  let savedCount = 0;
  
  syncedEntries.forEach(syncedEntry => {
    let entryToSave = { ...syncedEntry };
    
    if (syncedEntry.journalEncrypted) {
      entryToSave = decryptEntry(syncedEntry);
    }
    
    if (shouldEncrypt) {
      entryToSave = encryptEntry(entryToSave);
    } else {
      entryToSave.journalEncrypted = false;
    }
    
    const existingIndex = entries.findIndex(e => e.id === syncedEntry.id);
    
    if (existingIndex >= 0) {
      const existing = entries[existingIndex];
      const existingDecrypted = decryptEntry(existing);
      if (new Date(syncedEntry.updatedAt) > new Date(existingDecrypted.updatedAt)) {
        entries[existingIndex] = entryToSave;
        savedCount++;
      }
    } else {
      entries.push(entryToSave);
      savedCount++;
    }
  });
  
  const sortedEntries = entries.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedEntries));
  
  return savedCount;
}

/**
 * 批量标记条目为已删除（从服务器同步的删除操作）
 * @param deletes - 要删除的条目ID和删除时间数组
 * @returns 标记删除的条目数量
 */
export function markEntriesDeleted(deletes: Array<{ id: string; deletedAt: string }>): number {
  if (typeof window === 'undefined' || deletes.length === 0) return 0;
  
  const settings = getSettings();
  const shouldEncrypt = settings.encrypted;
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return 0;
  
  const entries: MoodEntry[] = JSON.parse(data);
  let deletedCount = 0;
  
  deletes.forEach(({ id, deletedAt }) => {
    const index = entries.findIndex(e => e.id === id);
    if (index >= 0) {
      let entry = entries[index];
      if (entry.journalEncrypted) {
        entry = decryptEntry(entry);
      }
      
      if (!entry.deletedAt) {
        entry.deletedAt = deletedAt;
        entry.updatedAt = deletedAt;
        
        if (shouldEncrypt) {
          entry = encryptEntry(entry);
        } else {
          entry.journalEncrypted = false;
        }
        
        entries[index] = entry;
        deletedCount++;
      }
    }
  });
  
  if (deletedCount > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
  
  return deletedCount;
}
