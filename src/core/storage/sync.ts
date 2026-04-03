/**
 * 数据同步模块 - 简化版
 * 符合 SYNC_DESIGN.md 规范
 */

import { MoodEntry } from '@/types';
import { apiSync, type SyncResult } from '@/core/api';
import { getEntries, saveSyncedEntries, markEntriesDeleted } from './entries';

export const SYNC_SETTINGS_KEY = 'mood_journal_sync_settings';
export const SYNC_STATE_KEY = 'mood_journal_sync_state';
export const SYNC_CONFLICTS_KEY = 'mood_journal_sync_conflicts';

export const DEFAULT_SYNC_SERVER = 'https://api.moodjournal.app';

export type SyncOperationType = 'push' | 'pull' | 'bidirectional';

export interface SyncSettings {
  enabled: boolean;
  serverUrl: string;
  authToken: string | null;
  deviceId: string;
  autoSync: boolean;
  syncInterval: number;
  wifiOnly: boolean;
  conflictStrategy: 'server-wins' | 'client-wins' | 'manual' | 'timestamp';
  lastModified: string;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncedAt?: string;
  pendingEntryIds: string[];
  pendingDeletes: Array<{
    id: string;
    deletedAt: string;
  }>;
  status: 'idle' | 'syncing' | 'success' | 'error' | 'conflict';
  error: string | null;
  pendingCount: number;
  lastResult: SyncResult | null;
}

export type ConflictResolution = 'server' | 'client' | 'merged' | 'pending';

export type ConflictStrategy = 'server-wins' | 'client-wins' | 'manual' | 'timestamp';

export { type SyncResult };

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

export const DEFAULT_SYNC_STATE: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  pendingEntryIds: [],
  pendingDeletes: [],
  status: 'idle',
  error: null,
  pendingCount: 0,
  lastResult: null,
};

export function getSyncSettings(): SyncSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SYNC_SETTINGS };
  }
  try {
    const data = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (!data) return { ...DEFAULT_SYNC_SETTINGS };
    const parsed = JSON.parse(data) as SyncSettings;
    if (!parsed.deviceId) {
      parsed.deviceId = generateDeviceId();
      saveSyncSettings(parsed);
    }
    return parsed;
  } catch {
    return { ...DEFAULT_SYNC_SETTINGS };
  }
}

export function saveSyncSettings(settings: SyncSettings): void {
  if (typeof window === 'undefined') return;
  settings.lastModified = new Date().toISOString();
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
}

export function getSyncState(): SyncState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SYNC_STATE };
  }
  try {
    const data = localStorage.getItem(SYNC_STATE_KEY);
    if (!data) return { ...DEFAULT_SYNC_STATE };
    const parsed = JSON.parse(data) as SyncState;
    return {
      ...DEFAULT_SYNC_STATE,
      ...parsed,
      pendingEntryIds: parsed.pendingEntryIds || [],
      pendingDeletes: parsed.pendingDeletes || [],
    };
  } catch {
    return { ...DEFAULT_SYNC_STATE };
  }
}

export function saveSyncState(state: Partial<SyncState>): void {
  if (typeof window === 'undefined') return;
  const current = getSyncState();
  const newState = {
    ...current,
    ...state,
    pendingEntryIds: state.pendingEntryIds ?? current.pendingEntryIds,
    pendingDeletes: state.pendingDeletes ?? current.pendingDeletes,
  };
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(newState));
}

function generateDeviceId(): string {
  const id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return id;
}

export function enableSync(): void {
  const settings = getSyncSettings();
  const state = getSyncState();

  settings.enabled = true;
  if (!settings.deviceId) {
    settings.deviceId = generateDeviceId();
  }
  saveSyncSettings(settings);

  if (!state.lastSyncAt) {
    markAllEntriesForSync();
  }
}

export function disableSync(): void {
  const settings = getSyncSettings();
  settings.enabled = false;
  saveSyncSettings(settings);
}

export function isSyncEnabled(): boolean {
  const settings = getSyncSettings();
  return settings.enabled && !!settings.authToken;
}

export function setAuthToken(token: string | null): void {
  const settings = getSyncSettings();
  settings.authToken = token;
  saveSyncSettings(settings);
}

export function updateSyncSettings(updates: Partial<SyncSettings>): void {
  const settings = getSyncSettings();
  Object.assign(settings, updates);
  saveSyncSettings(settings);
}

export function trackPendingChange(entry: MoodEntry): void {
  const state = getSyncState();
  if (!state.pendingEntryIds) {
    state.pendingEntryIds = [];
  }
  if (!state.pendingEntryIds.includes(entry.id)) {
    state.pendingEntryIds.push(entry.id);
    state.pendingCount++;
    saveSyncState(state);
  }
}

export function markAllEntriesForSync(): void {
  const allEntries = getEntries();
  const state = getSyncState();

  if (!state.pendingEntryIds) {
    state.pendingEntryIds = [];
  }

  allEntries.forEach((entry) => {
    if (!entry.deletedAt && !state.pendingEntryIds.includes(entry.id)) {
      state.pendingEntryIds.push(entry.id);
      state.pendingCount++;
    }
  });

  saveSyncState(state);
}

export function trackDeletedId(id: string): void {
  const state = getSyncState();
  if (!state.pendingDeletes) {
    state.pendingDeletes = [];
  }
  const deletedAt = new Date().toISOString();
  state.pendingDeletes.push({ id, deletedAt });
  state.pendingCount++;
  saveSyncState(state);
}

export function clearPendingSync(): void {
  const state = getSyncState();
  state.pendingEntryIds = [];
  state.pendingDeletes = [];
  state.pendingCount = 0;
  saveSyncState(state);
}

export function collectSyncData(): MoodEntry[] {
  const state = getSyncState();
  const allEntries = getEntries();

  if (!state.pendingEntryIds || !Array.isArray(state.pendingEntryIds)) {
    return [];
  }

  return allEntries.filter((entry) => state.pendingEntryIds.includes(entry.id) && !entry.deletedAt);
}

export interface SyncPayload {
  deviceId: string;
  lastSyncAt: string | null;
  entries: MoodEntry[];
  deletes: Array<{ id: string; deletedAt: string }>;
}

export interface SyncResponse {
  success: boolean;
  entries: MoodEntry[];
  deletes: Array<{ id: string; deletedAt: string }>;
  timestamp: string;
  error?: string;
}

export interface ConflictEntry {
  id: string;
  clientUpdatedAt: string;
  serverUpdatedAt: string;
  clientEntry: MoodEntry;
  serverEntry: MoodEntry;
  autoResolution: 'server' | 'client';
}

let autoSyncTimer: ReturnType<typeof setInterval> | null = null;

export function checkNetworkStatus(): { online: boolean; type?: string } {
  if (typeof window === 'undefined') {
    return { online: false };
  }
  const online = navigator.onLine;
  const connection = (navigator as unknown as { connection?: { type?: string } }).connection;
  return {
    online,
    type: connection?.type,
  };
}

export function canSync(): { canSync: boolean; reason?: string } {
  const settings = getSyncSettings();
  const network = checkNetworkStatus();

  if (!settings.enabled) {
    return { canSync: false, reason: 'sync_disabled' };
  }

  if (!settings.authToken) {
    return { canSync: false, reason: 'not_authenticated' };
  }

  if (!network.online) {
    return { canSync: false, reason: 'offline' };
  }

  if (settings.wifiOnly && network.type && network.type !== 'wifi') {
    return { canSync: false, reason: 'wifi_only' };
  }

  return { canSync: true };
}

export async function resolveConflict(
  entryId: string,
  resolution: 'server' | 'client',
  entry?: MoodEntry
): Promise<{ success: boolean; error?: string }> {
  const { apiResolveConflict } = await import('@/core/api');
  return apiResolveConflict(entryId, resolution, entry);
}

export async function forceSync(): Promise<SyncResult> {
  const check = canSync();
  if (!check.canSync) {
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      skipped: 0,
      deleted: 0,
      error: check.reason || 'cannot_sync',
      timestamp: new Date().toISOString(),
    };
  }
  return performSync();
}

export function clearSyncData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SYNC_SETTINGS_KEY);
  localStorage.removeItem(SYNC_STATE_KEY);
}

export function startAutoSync(): void {
  const settings = getSyncSettings();

  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }

  if (!settings.enabled || !settings.autoSync) {
    return;
  }

  const intervalMs = settings.syncInterval * 60 * 1000;
  autoSyncTimer = setInterval(() => {
    const check = canSync();
    if (check.canSync) {
      performSync().catch(() => {});
    }
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }
}

export function reconfigureAutoSync(): void {
  stopAutoSync();
  startAutoSync();
}

export function getConflicts(): ConflictEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SYNC_CONFLICTS_KEY);
    if (!data) return [];
    return JSON.parse(data) as ConflictEntry[];
  } catch {
    return [];
  }
}

export function saveConflicts(conflicts: ConflictEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_CONFLICTS_KEY, JSON.stringify(conflicts));
}

export function clearConflicts(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SYNC_CONFLICTS_KEY);
}

export function removeConflict(entryId: string): void {
  const conflicts = getConflicts();
  const filtered = conflicts.filter((c) => c.id !== entryId);
  saveConflicts(filtered);
}

export async function performSync(): Promise<SyncResult> {
  const settings = getSyncSettings();
  const state = getSyncState();

  if (!settings.enabled || !settings.authToken) {
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      skipped: 0,
      deleted: 0,
      error: 'sync_not_enabled',
      timestamp: new Date().toISOString(),
    };
  }

  saveSyncState({
    isSyncing: true,
    status: 'syncing',
    error: null,
  });

  try {
    const syncData = collectSyncData();

    const payload: SyncPayload = {
      deviceId: settings.deviceId,
      lastSyncAt: state.lastSyncAt,
      entries: syncData,
      deletes: state.pendingDeletes,
    };

    const response = await apiSync(payload);

    if (response.success) {
      clearPendingSync();

      if (response.entries && response.entries.length > 0) {
        saveSyncedEntries(response.entries);
      }

      if (response.deletes && response.deletes.length > 0) {
        markEntriesDeleted(response.deletes);
      }

      if (response.conflictDetails && response.conflictDetails.length > 0) {
        saveConflicts(response.conflictDetails);
      } else {
        clearConflicts();
      }

      saveSyncState({
        isSyncing: false,
        lastSyncAt: response.timestamp,
        lastSyncedAt: response.timestamp,
        status: response.conflicts > 0 ? 'conflict' : 'success',
        error: null,
        lastResult: response,
      });

      return response;
    }

    saveSyncState({
      isSyncing: false,
      status: 'error',
      error: response.error,
    });

    return response;
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
      deleted: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}
