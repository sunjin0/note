/**
 * 暂存数据管理
 * 管理编辑器中自动保存的草稿数据
 */

import { DraftDataInfo } from './types';
import { DRAFT_KEY_PREFIX } from './constants';

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

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear draft data:', error);
  }
}

/**
 * 保存草稿数据
 * @param key - 草稿键名（不含前缀）
 * @param data - 要保存的数据
 */
export function saveDraft(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${key}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

/**
 * 获取草稿数据
 * @param key - 草稿键名（不含前缀）
 * @returns 草稿数据，如果不存在则返回 null
 */
export function getDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(`${DRAFT_KEY_PREFIX}${key}`);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * 删除草稿数据
 * @param key - 草稿键名（不含前缀）
 */
export function deleteDraft(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${DRAFT_KEY_PREFIX}${key}`);
}
