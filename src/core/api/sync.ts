/**
 * 同步 API 模块
 * 提供与后端数据同步相关的API调用
 * 
 * @module api/sync
 */

import { apiClient, ApiError } from './client';
import { API_ENDPOINTS } from './config';
import type { SyncPayload, SyncResponse, SyncResult } from '@/core/storage';

/**
 * 后端同步响应接口
 */
interface BackendSyncResponse {
  success: boolean;
  data?: {
    serverTimestamp: string;
    entries: SyncPayload['data']['entries'];
    settings: SyncPayload['data']['settings'];
    customFactors: SyncPayload['data']['customFactors'];
    customTemplates: SyncPayload['data']['customTemplates'];
    deletedIds: string[];
    conflicts: Array<{
      entryId: string;
      resolution: 'server' | 'client' | 'merged';
      mergedEntry?: SyncPayload['data']['entries'][0];
    }>;
  };
  error?: {
    code: string;
    message: string;
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
        uploaded: payload.data.entries.length,
        downloaded: response.data.entries.length,
        conflicts: response.data.conflicts.length,
        skipped: 0,
        timestamp: response.data.serverTimestamp,
      };
    }

    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      skipped: 0,
      error: response.error?.code || 'sync.failed',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        skipped: 0,
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
      error: 'api.networkError',
      timestamp: new Date().toISOString(),
    };
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
  resolution: 'server' | 'client' | 'merged',
  mergedEntry?: SyncPayload['data']['entries'][0]
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      error?: { code: string; message: string };
    }>(API_ENDPOINTS.sync.resolveConflict, {
      entryId,
      resolution,
      mergedEntry,
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
