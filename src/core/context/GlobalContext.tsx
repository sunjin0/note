'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { MoodEntry } from '@/types';
import type { User, SyncSettings as SyncSettingsType, SyncState, ConflictEntry } from '@/core/storage';
import {
  getCurrentUser,
  isAuthenticated,
  getSyncSettings,
  getSyncState,
  saveSyncSettings,
  getEntries,
  enableSync as storageEnableSync,
  disableSync as storageDisableSync,
  startAutoSync,
  stopAutoSync,
  getConflicts,
  clearConflicts,
  performSync,
  logout as storageLogout,
  initAuth,
} from '@/core/storage';

interface GlobalState {
  entries: MoodEntry[];
  user: User | null;
  isLoggedIn: boolean;
  syncSettings: SyncSettingsType | null;
  syncState: SyncState | null;
  conflicts: ConflictEntry[];
}

interface GlobalContextType extends GlobalState {
  refreshState: () => void;
  refreshEntries: () => void;
  updateUser: (user: User | null) => void;
  updateSyncSettings: (settings: Partial<SyncSettingsType>) => void;
  enableSync: () => void;
  disableSync: () => void;
  logout: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GlobalState>({
    entries: [],
    user: null,
    isLoggedIn: false,
    syncSettings: null,
    syncState: null,
    conflicts: [],
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshEntries = useCallback(() => {
    const entries = getEntries();
    setState(prev => ({
      ...prev,
      entries,
    }));
  }, []);

  const refreshState = useCallback(() => {
    const entries = getEntries();
    setState(prev => ({
      ...prev,
      entries,
      user: getCurrentUser(),
      isLoggedIn: isAuthenticated(),
      syncSettings: getSyncSettings(),
      syncState: getSyncState(),
      conflicts: getConflicts(),
    }));
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await initAuth();
      refreshState();
      setIsInitialized(true);
    };
    
    initialize();
  }, [refreshState]);

  useEffect(() => {
    if (!isInitialized) return;
    
    intervalRef.current = setInterval(refreshState, 3000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInitialized, refreshState]);

  const updateUser = useCallback((user: User | null) => {
    setState(prev => ({
      ...prev,
      user,
      isLoggedIn: !!user,
    }));
  }, []);

  const updateSyncSettings = useCallback((updates: Partial<SyncSettingsType>) => {
    const currentSettings = getSyncSettings();
    const newSettings = { ...currentSettings, ...updates };
    saveSyncSettings(newSettings);
    setState(prev => ({
      ...prev,
      syncSettings: newSettings,
    }));
  }, []);

  const enableSync = useCallback(() => {
    storageEnableSync();
    startAutoSync();
    refreshState();
  }, [refreshState]);

  const disableSync = useCallback(() => {
    storageDisableSync();
    stopAutoSync();
    clearConflicts();
    refreshState();
  }, [refreshState]);

  const logout = useCallback(async () => {
    await storageLogout();
    stopAutoSync();
    clearConflicts();
    refreshState();
  }, [refreshState]);

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <GlobalContext.Provider
      value={{
        ...state,
        refreshState,
        refreshEntries,
        updateUser,
        updateSyncSettings,
        enableSync,
        disableSync,
        logout,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}

export function useEntries() {
  const { entries, refreshEntries } = useGlobal();
  
  return {
    entries,
    refreshEntries,
  };
}

export function useSync() {
  const { syncSettings, syncState, conflicts, updateSyncSettings, enableSync, disableSync, refreshState } = useGlobal();
  
  const syncNow = useCallback(async () => {
    const result = await performSync();
    refreshState();
    return result;
  }, [refreshState]);

  return {
    syncSettings,
    syncState,
    conflicts,
    updateSyncSettings,
    enableSync,
    disableSync,
    syncNow,
    refreshState,
  };
}

export function useAuth() {
  const { user, isLoggedIn, updateUser, logout, refreshState } = useGlobal();
  
  return {
    user,
    isLoggedIn,
    updateUser,
    logout,
    refreshState,
  };
}
