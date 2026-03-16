/**
 * 数据备份与导出管理
 * 提供数据导出、导入、清除等功能
 */

import { MoodEntry } from '@/types';
import { getEntries } from './entries';
import { getSettings } from './settings';
import { getSecuritySettings, clearSession } from './security';
import { STORAGE_KEY, SETTINGS_KEY, SECURITY_KEY } from './constants';

/**
 * 导出数据结果接口
 */
export interface ExportData {
  entries: MoodEntry[];
  settings: import('./types').AppSettings;
  securitySettings: import('./types').SecuritySettings;
  exportedAt: string;
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
 * 解析导出数据
 * @param jsonString - JSON 格式的导出数据
 * @returns 解析后的数据对象，如果解析失败返回 null
 */
export function parseExportData(jsonString: string): ExportData | null {
  try {
    const data = JSON.parse(jsonString) as ExportData;
    // 基本验证
    if (!data.entries || !Array.isArray(data.entries)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
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
 * 导入数据
 * 将导出的数据导入到应用中
 * @param data - 要导入的数据对象
 * @param options - 导入选项
 * @returns 导入结果
 */
export function importData(
  data: ExportData,
  options: { merge?: boolean; overwrite?: boolean } = {}
): { success: boolean; error?: string; importedCount: number } {
  const { merge = false, overwrite = false } = options;

  try {
    if (!data.entries || !Array.isArray(data.entries)) {
      return { success: false, error: 'Invalid data format', importedCount: 0 };
    }

    if (overwrite) {
      // 完全覆盖现有数据
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
      if (data.settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      }
      if (data.securitySettings) {
        localStorage.setItem(SECURITY_KEY, JSON.stringify(data.securitySettings));
      }
      return { success: true, importedCount: data.entries.length };
    }

    if (merge) {
      // 合并数据：保留现有数据，添加新数据（根据日期去重）
      const existingData = localStorage.getItem(STORAGE_KEY);
      const existingEntries: MoodEntry[] = existingData ? JSON.parse(existingData) : [];
      
      const existingDates = new Set(existingEntries.map(e => e.date));
      const newEntries = data.entries.filter(e => !existingDates.has(e.date));
      
      const mergedEntries = [...existingEntries, ...newEntries];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedEntries));
      
      return { success: true, importedCount: newEntries.length };
    }

    // 默认：如果已有数据，拒绝导入
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (existingData) {
      const existingEntries = JSON.parse(existingData) as MoodEntry[];
      if (existingEntries.length > 0) {
        return { 
          success: false, 
          error: 'Existing data found. Use merge=true or overwrite=true option.',
          importedCount: 0 
        };
      }
    }

    // 首次导入
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
    if (data.settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    }
    if (data.securitySettings) {
      localStorage.setItem(SECURITY_KEY, JSON.stringify(data.securitySettings));
    }
    
    return { success: true, importedCount: data.entries.length };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Import failed',
      importedCount: 0 
    };
  }
}

/**
 * 下载导出文件
 * 将数据导出为 JSON 文件并触发下载
 * @param filename - 文件名（不含扩展名）
 */
export function downloadExportFile(filename?: string): void {
  if (typeof window === 'undefined') return;
  
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename || 'mood-journal-backup'}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
