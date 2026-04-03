/**
 * 同步 API 模块
 * 提供与后端数据同步相关的API调用
 * 符合 SYNC_DESIGN.md 规范
 */

import { apiClient, ApiError } from './client';
import { API_ENDPOINTS } from './config';
import type { MoodEntry } from '@/types';

/**
 * 同步请求负载
 */
export interface SyncPayload {
  deviceId: string;
  lastSyncAt: string | null;
  entries: MoodEntry[];
  deletes: Array<{
    id: string;
    deletedAt: string;
  }>;
}

/**
 * 冲突详情
 */
export interface ConflictDetail {
  id: string;
  clientUpdatedAt: string;
  serverUpdatedAt: string;
  clientEntry: MoodEntry;
  serverEntry: MoodEntry;
  autoResolution: 'server' | 'client';
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  skipped: number;
  deleted: number;
  error?: string;
  timestamp: string;
  conflictDetails?: ConflictDetail[];
  entries?: MoodEntry[];
  deletes?: Array<{ id: string; deletedAt: string }>;
}

/**
 * 后端同步响应接口
 */
interface BackendSyncResponse {
  success: boolean;
  data?: {
    serverTime: string;
    entries: MoodEntry[];
    deletes: Array<{
      id: string;
      deletedAt: string;
    }>;
    conflicts: Array<{
      id: string;
      clientUpdatedAt: string;
      serverUpdatedAt: string;
      clientEntry: MoodEntry;
      serverEntry: MoodEntry;
      autoResolution: 'server' | 'client';
    }>;
    stats: {
      uploaded: number;
      downloaded: number;
      deleted: number;
      conflicts: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 处理同步错误
 */
function handleSyncError(error: unknown): SyncResult {
  if (error instanceof ApiError) {
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      skipped: 0,
      deleted: 0,
      error: error.errorCode || error.message,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    success: false,
    uploaded: 0,
    downloaded: 0,
    conflicts: 0,
    skipped: 0,
    deleted: 0,
    error: 'api.networkError',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 执行数据同步
 */
export async function apiSync(payload: SyncPayload): Promise<SyncResult> {
  try {
    const response = await apiClient.post<BackendSyncResponse>(
      API_ENDPOINTS.sync.sync,
      payload
    );

    if (response.success && response.data) {
      return {
        success: true,
        uploaded: response.data.stats.uploaded,
        downloaded: response.data.stats.downloaded,
        conflicts: response.data.stats.conflicts,
        skipped: 0,
        deleted: response.data.stats.deleted,
        timestamp: response.data.serverTime,
        conflictDetails: response.data.conflicts,
        entries: response.data.entries,
        deletes: response.data.deletes,
      };
    }

    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      skipped: 0,
      deleted: 0,
      error: response.error?.code || 'sync.failed',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return handleSyncError(error);
  }
}

/**
 * 获取同步状态
 */
export async function apiGetSyncStatus(): Promise<{
  success: boolean;
  lastSyncAt?: string;
  pendingChanges?: number;
  error?: string;
}> {
  try {
    const response = await apiClient.get<{
      success: boolean;
      data?: {
        lastSyncAt: string;
        pendingChanges: number;
      };
      error?: { code: string; message: string };
    }>(API_ENDPOINTS.sync.status);

    if (response.success && response.data) {
      return {
        success: true,
        lastSyncAt: response.data.lastSyncAt,
        pendingChanges: response.data.pendingChanges,
      };
    }

    return {
      success: false,
      error: response.error?.code,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.errorCode || error.message,
      };
    }
    return { success: false, error: 'api.networkError' };
  }
}

/**
 * 解决同步冲突
 */
export async function apiResolveConflict(
  entryId: string,
  resolution: 'server' | 'client',
  entry?: MoodEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      error?: { code: string; message: string };
    }>(`${API_ENDPOINTS.sync.resolveConflict}/${entryId}/resolve`, {
      resolution,
      entry,
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.code,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.errorCode || error.message,
      };
    }
    return { success: false, error: 'api.networkError' };
  }
}
