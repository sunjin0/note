/**
 * 应用设置存储管理
 * 提供应用设置的读写功能
 */

import { AppSettings } from './types';
import { SETTINGS_KEY, DEFAULT_SETTINGS } from './constants';

/**
 * 获取应用设置
 * @returns 应用设置对象，如果不存在则返回默认设置
 * @remarks 默认设置为未加密，创建时间为当前时间
 * @remarks 在服务端渲染（SSR）环境下返回默认设置
 */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() };
  }
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() };
    return JSON.parse(data) as AppSettings;
  } catch {
    return { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() };
  }
}

/**
 * 保存应用设置
 * @param settings - 要保存的应用设置对象
 */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
