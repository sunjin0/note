/**
 * 数据同步模块
 * 提供客户端与远程服务器之间的数据同步功能
 * 
 * @module sync
 */

import { MoodEntry, FactorOption, JournalTemplate } from '@/types';
import { AppSettings, SecuritySettings } from './types';
import { apiSync, apiGetSyncStatus, apiResolveConflict } from '@/core/api';

// 同步设置存储键名
export const SYNC_SETTINGS_KEY = 'mood_journal_sync_settings';
export const SYNC_STATE_KEY = 'mood_journal_sync_state';

// 默认同步服务器地址（可根据实际情况修改）
export const DEFAULT_SYNC_SERVER = 'https://api.moodjournal.app';

/**
 * 同步设置接口
 */
export interface SyncSettings {
  /** 是否启用数据同步 */
  enabled: boolean;
  /** 服务器地址 */
  serverUrl: string;
  /** 用户认证令牌 */
  authToken: string | null;
  /** 设备标识 */
  deviceId: string;
  /** 自动同步 */
  autoSync: boolean;
  /** 同步间隔（分钟） */
  syncInterval: number;
  /** 仅在WiFi下同步 */
  wifiOnly: boolean;
  /** 冲突解决策略 */
  conflictStrategy: ConflictStrategy;
  /** 上次修改时间 */
  lastModified: string;
}

/**
 * 同步状态接口
 */
export interface SyncState {
  /** 是否正在同步 */
  isSyncing: boolean;
  /** 上次同步时间 */
  lastSyncAt: string | null;
  /** 同步状态 */
  status: 'idle' | 'syncing' | 'success' | 'error' | 'conflict';
  /** 错误信息 */
  error: string | null;
  /** 待同步条目数 */
  pendingCount: number;
  /** 上次同步结果 */
  lastResult: SyncResult | null;
}

/**
 * 同步结果接口
 */
export interface SyncResult {
  /** 是否成功 */
  success: boolean;
  /** 上传的条目数 */
  uploaded: number;
  /** 下载的条目数 */
  downloaded: number;
  /** 冲突数 */
  conflicts: number;
  /** 跳过的条目数 */
  skipped: number;
  /** 错误信息 */
  error?: string;
  /** 同步时间戳 */
  timestamp: string;
}

/**
 * 同步数据包接口
 */
export interface SyncPayload {
  /** 设备ID */
  deviceId: string;
  /** 上次同步时间 */
  lastSyncAt: string | null;
  /** 数据 */
  data: {
    entries: MoodEntry[];
    settings: AppSettings;
    customFactors: FactorOption[];
    customTemplates: JournalTemplate[];
    securitySettings?: SecuritySettings;
  };
  /** 删除的条目ID列表 */
  deletedIds: string[];
}

/**
 * 服务器响应接口
 */
export interface SyncResponse {
  /** 服务器时间戳 */
  serverTimestamp: string;
  /** 需要下载的数据 */
  data: {
    entries: MoodEntry[];
    settings: AppSettings;
    customFactors: FactorOption[];
    customTemplates: JournalTemplate[];
  };
  /** 服务器删除的条目ID */
  deletedIds: string[];
  /** 冲突解决结果 */
  conflicts: Array<{
    entryId: string;
    resolution: 'server' | 'client' | 'merged';
    mergedEntry?: MoodEntry;
  }>;
}

/**
 * 冲突解决策略
 */
export type ConflictStrategy = 'server-wins' | 'client-wins' | 'manual' | 'timestamp';

/**
 * 默认同步设置
 */
export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  enabled: false,
  serverUrl: DEFAULT_SYNC_SERVER,
  authToken: null,
  deviceId: '',
  autoSync: true,
  syncInterval: 30,
  wifiOnly: false,
  conflictStrategy: 'timestamp',
  lastModified: new Date().toISOString(),
};

/**
 * 默认同步状态
 */
export const DEFAULT_SYNC_STATE: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  status: 'idle',
  error: null,
  pendingCount: 0,
  lastResult: null,
};

// ==================== 本地存储操作 ====================

/**
 * 获取同步设置
 */
export function getSyncSettings(): SyncSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SYNC_SETTINGS };
  }
  try {
    const data = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (!data) return { ...DEFAULT_SYNC_SETTINGS };
    const parsed = JSON.parse(data) as SyncSettings;
    // 确保 deviceId 存在
    if (!parsed.deviceId) {
      parsed.deviceId = generateDeviceId();
      saveSyncSettings(parsed);
    }
    return parsed;
  } catch {
    return { ...DEFAULT_SYNC_SETTINGS };
  }
}

/**
 * 保存同步设置
 */
export function saveSyncSettings(settings: SyncSettings): void {
  if (typeof window === 'undefined') return;
  settings.lastModified = new Date().toISOString();
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * 获取同步状态
 */
export function getSyncState(): SyncState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SYNC_STATE };
  }
  try {
    const data = localStorage.getItem(SYNC_STATE_KEY);
    if (!data) return { ...DEFAULT_SYNC_STATE };
    return JSON.parse(data) as SyncState;
  } catch {
    return { ...DEFAULT_SYNC_STATE };
  }
}

/**
 * 保存同步状态
 */
export function saveSyncState(state: Partial<SyncState>): void {
  if (typeof window === 'undefined') return;
  const current = getSyncState();
  const newState = { ...current, ...state };
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(newState));
}

/**
 * 生成设备唯一标识
 */
function generateDeviceId(): string {
  const id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return id;
}

// ==================== 同步控制 ====================

/**
 * 启用同步
 */
export function enableSync(): void {
  const settings = getSyncSettings();
  settings.enabled = true;
  if (!settings.deviceId) {
    settings.deviceId = generateDeviceId();
  }
  saveSyncSettings(settings);
}

/**
 * 禁用同步
 */
export function disableSync(): void {
  const settings = getSyncSettings();
  settings.enabled = false;
  saveSyncSettings(settings);
}

/**
 * 检查同步是否启用
 */
export function isSyncEnabled(): boolean {
  const settings = getSyncSettings();
  return settings.enabled && !!settings.authToken;
}

/**
 * 设置认证令牌
 */
export function setAuthToken(token: string | null): void {
  const settings = getSyncSettings();
  settings.authToken = token;
  saveSyncSettings(settings);
}

/**
 * 更新同步设置
 */
export function updateSyncSettings(updates: Partial<SyncSettings>): void {
  const settings = getSyncSettings();
  Object.assign(settings, updates);
  saveSyncSettings(settings);
}

// ==================== 数据收集 ====================

import { getEntries } from '@/core';
import { getSettings } from '@/core';
import { getCustomFactors } from '@/core';
import { getSecuritySettings } from '@/core';
import { getCustomTemplates } from '@/core/config/templates';

/**
 * 收集所有需要同步的本地数据
 */
export function collectSyncData(): SyncPayload['data'] {
  return {
    entries: getEntries(),
    settings: getSettings(),
    customFactors: getCustomFactors(),
    customTemplates: getCustomTemplates(),
    securitySettings: getSecuritySettings(),
  };
}

// ==================== 网络检测 ====================

/**
 * 检查网络状态
 */
export function checkNetworkStatus(): { online: boolean; type?: string } {
  if (typeof window === 'undefined') {
    return { online: false };
  }
  
  const online = navigator.onLine;
  // @ts-ignore - Network Information API 可能不存在
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const type = connection?.type || connection?.effectiveType;
  
  return { online, type };
}

/**
 * 检查是否可以同步
 */
export function canSync(): { canSync: boolean; reason?: string } {
  const settings = getSyncSettings();
  const { online, type } = checkNetworkStatus();
  
  if (!settings.enabled) {
    return { canSync: false, reason: 'sync_disabled' };
  }
  
  if (!settings.authToken) {
    return { canSync: false, reason: 'not_authenticated' };
  }
  
  if (!online) {
    return { canSync: false, reason: 'offline' };
  }
  
  if (settings.wifiOnly && type !== 'wifi') {
    return { canSync: false, reason: 'wifi_required' };
  }
  
  return { canSync: true };
}

// ==================== 冲突解决 ====================

/**
 * 解决数据冲突
 * @param localEntry 本地条目
 * @param serverEntry 服务器条目
 * @param strategy 冲突解决策略
 */
export function resolveConflict(
  localEntry: MoodEntry,
  serverEntry: MoodEntry,
  strategy: ConflictStrategy = 'timestamp'
): MoodEntry {
  switch (strategy) {
    case 'server-wins':
      return serverEntry;
    
    case 'client-wins':
      return localEntry;
    
    case 'timestamp':
      // 选择更新时间较新的
      const localTime = new Date(localEntry.updatedAt).getTime();
      const serverTime = new Date(serverEntry.updatedAt).getTime();
      return localTime > serverTime ? localEntry : serverEntry;
    
    case 'manual':
    default:
      // 默认使用服务器版本，但标记为冲突
      return serverEntry;
  }
}

// ==================== 数据同步 API ====================

/**
 * 执行数据同步
 * 调用后端API进行数据同步
 */
export async function performSync(): Promise<SyncResult> {
  const { canSync: can, reason } = canSync();
  
  if (!can) {
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      skipped: 0,
      error: reason || 'sync_not_allowed',
      timestamp: new Date().toISOString(),
    };
  }
  
  const settings = getSyncSettings();
  const state = getSyncState();
  
  // 更新同步状态
  saveSyncState({
    isSyncing: true,
    status: 'syncing',
    error: null,
  });
  
  try {
    // 收集本地数据
    const payload: SyncPayload = {
      deviceId: settings.deviceId,
      lastSyncAt: state.lastSyncAt,
      data: collectSyncData(),
      deletedIds: [], // TODO: 实现删除追踪
    };
    
    // 调用后端API
    const result = await apiSync(payload);
    
    if (result.success) {
      // 更新同步状态
      saveSyncState({
        isSyncing: false,
        lastSyncAt: result.timestamp,
        status: result.conflicts > 0 ? 'conflict' : 'success',
        error: null,
        lastResult: result,
      });
    } else {
      saveSyncState({
        isSyncing: false,
        status: 'error',
        error: result.error || 'sync_failed',
        lastResult: result,
      });
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'sync_failed';
    
    saveSyncState({
      isSyncing: false,
      status: 'error',
      error: errorMessage,
    });
    
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      skipped: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 强制同步（忽略自动同步设置）
 */
export async function forceSync(): Promise<SyncResult> {
  return performSync();
}

/**
 * 清除同步数据
 */
export function clearSyncData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SYNC_SETTINGS_KEY);
  localStorage.removeItem(SYNC_STATE_KEY);
}

// ==================== 自动同步 ====================

let autoSyncInterval: NodeJS.Timeout | null = null;

/**
 * 启动自动同步
 */
export function startAutoSync(): void {
  if (typeof window === 'undefined') return;
  
  stopAutoSync(); // 先停止现有的
  
  const settings = getSyncSettings();
  if (!settings.enabled || !settings.autoSync) return;
  
  const intervalMs = settings.syncInterval * 60 * 1000;
  
  autoSyncInterval = setInterval(() => {
    const { canSync: can } = canSync();
    if (can) {
      performSync();
    }
  }, intervalMs);
}

/**
 * 停止自动同步
 */
export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

/**
 * 重新配置自动同步
 */
export function reconfigureAutoSync(): void {
  startAutoSync();
}
