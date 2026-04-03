'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/core/utils';
import { useTranslation } from '@/core/i18n';
import { Button } from '@/core/ui/button';
import type { ConflictStrategy } from '@/core/storage';
import { useGlobal, useSync, useAuth } from '@/core/context';
import { canSync, checkNetworkStatus, saveSyncSettings } from '@/core/storage';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Settings2,
  Shield,
  Smartphone,
  Clock,
  User as UserIcon,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import AuthModal from './AuthModal';
import ConflictResolution from './ConflictResolution';

interface SyncSettingsProps {
  className?: string;
}

export default function SyncSettings({ className }: SyncSettingsProps) {
  const { t } = useTranslation();
  const { isLoggedIn, user, logout } = useAuth();
  const { syncSettings, syncState, conflicts, updateSyncSettings, enableSync, disableSync, syncNow, refreshState } = useSync();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{ online: boolean; type?: string }>({ online: true });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    setNetworkStatus(checkNetworkStatus());
    
    const handleOnline = () => setNetworkStatus(checkNetworkStatus());
    const handleOffline = () => setNetworkStatus(checkNetworkStatus());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn && syncSettings?.enabled) {
      disableSync();
      setShowAdvanced(false);
      setShowConflictModal(false);
    }
  }, [isLoggedIn, syncSettings?.enabled, disableSync]);

  const handleToggleSync = async (enabled: boolean) => {
    if (enabled) {
      if (!isLoggedIn) {
        setAuthModalMode('login');
        setShowAuthModal(true);
        return;
      }
      enableSync();
    } else {
      disableSync();
    }
  };

  const handleLogin = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthModalMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
    setShowAdvanced(false);
    setShowConflictModal(false);
  };

  const handleAuthSuccess = () => {
    enableSync();
    refreshState();
  };

  const handleConflictResolved = () => {
    refreshState();
    if (conflicts.length === 0) {
      setShowConflictModal(false);
    }
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    try {
      const result = await syncNow();
      if (result.success) {
        showNotification('success', t('sync.syncSuccess', { 
          uploaded: result.uploaded, 
          downloaded: result.downloaded 
        }));
      } else {
        showNotification('error', result.error || t('sync.syncFailed'));
      }
    } catch (error) {
      showNotification('error', t('sync.syncError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = (updates: Partial<typeof syncSettings>) => {
    if (!syncSettings) return;
    const newSettings = { ...syncSettings, ...updates };
    saveSyncSettings(newSettings);
    refreshState();
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    console.log(`[${type}] ${message}`);
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return t('sync.never');
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return t('sync.justNow');
    if (diff < 3600000) return t('sync.minutesAgo', { count: Math.floor(diff / 60000) });
    if (diff < 86400000) return t('sync.hoursAgo', { count: Math.floor(diff / 3600000) });
    return date.toLocaleDateString();
  };

  if (!syncSettings || !syncState) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  const getSyncStatusDisplay = () => {
    switch (syncState.status) {
      case 'syncing':
        return { icon: RefreshCw, color: 'text-primary', text: t('sync.syncing'), animate: true };
      case 'success':
        return { icon: CheckCircle2, color: 'text-green-500', text: t('sync.synced'), animate: false };
      case 'error':
        return { icon: AlertCircle, color: 'text-destructive', text: t('sync.error'), animate: false };
      case 'conflict':
        return { icon: AlertCircle, color: 'text-orange-500', text: t('sync.conflict'), animate: false };
      default:
        return { icon: CloudOff, color: 'text-muted-foreground', text: t('sync.notSynced'), animate: false };
    }
  };

  const syncStatus = getSyncStatusDisplay();
  const StatusIcon = syncStatus.icon;
  const { canSync: canPerformSync, reason } = canSync();

  return (
    <div className={cn('space-y-6', className)}>
      {/* 用户信息卡片 */}
      <div className="bg-card border border-border rounded-xl p-5">
        {isLoggedIn && user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {user.nickname || user.username}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {t('auth.logout')}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('auth.notLoggedIn')}</h3>
                <p className="text-sm text-muted-foreground">{t('auth.loginToSync')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleLogin}>
                {t('auth.login')}
              </Button>
              <Button size="sm" onClick={handleRegister}>
                {t('auth.register')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 同步状态卡片 */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              syncSettings.enabled ? 'bg-primary/10' : 'bg-muted'
            )}>
              {syncSettings.enabled ? (
                <Cloud className="h-6 w-6 text-primary" />
              ) : (
                <CloudOff className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {syncSettings.enabled ? t('sync.enabled') : t('sync.disabled')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {syncSettings.enabled 
                  ? t('sync.lastSync', { time: formatLastSync(syncState.lastSyncAt) })
                  : t('sync.disabledDescription')
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => handleToggleSync(!syncSettings.enabled)}
            disabled={!isLoggedIn}
            className={cn(
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
              syncSettings.enabled ? 'bg-primary' : 'bg-muted-foreground/30',
              !isLoggedIn && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                syncSettings.enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {syncSettings.enabled && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className={cn('h-5 w-5', syncStatus.color, syncStatus.animate && 'animate-spin')} />
                <span className={cn('text-sm font-medium', syncStatus.color)}>
                  {syncStatus.text}
                </span>
                {syncState.error && (
                  <span className="text-sm text-destructive ml-2">
                    ({syncState.error})
                  </span>
                )}
              </div>
              {syncState.pendingCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    {t('sync.pendingCount', { count: syncState.pendingCount })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {syncState.status === 'conflict' && conflicts.length > 0 && (
        <div className="bg-orange-50 border border-orange-500 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-sm text-foreground mb-1">
                {t('sync.conflictTitle', { count: conflicts.length })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('sync.conflictDescription')}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={() => setShowConflictModal(true)}>
              {t('sync.resolveConflicts')}
            </Button>
          </div>
        </div>
      )}

      {/* 网络状态 */}
      <div className="flex items-center gap-3 px-1">
        {networkStatus.online ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              {t('sync.online')}
              {networkStatus.type && ` (${networkStatus.type})`}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{t('sync.offline')}</span>
          </>
        )}
      </div>

      {/* 立即同步按钮 */}
      {syncSettings.enabled && (
        <Button
          onClick={handleSyncNow}
          disabled={isLoading || !canPerformSync}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          {isLoading ? t('sync.syncing') : t('sync.syncNow')}
        </Button>
      )}

      {/* 无法同步的原因 */}
      {syncSettings.enabled && !canPerformSync && reason && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{t(`sync.reason.${reason}`)}</p>
        </div>
      )}

      {/* 高级设置 */}
      {syncSettings.enabled && isLoggedIn && (
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{t('sync.advancedSettings')}</span>
            </div>
            <span className={cn('text-muted-foreground transition-transform', showAdvanced && 'rotate-180')}>
              ▼
            </span>
          </button>

          {showAdvanced && (
            <div className="p-4 pt-0 space-y-4 border-t border-border">
              {/* 自动同步 */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{t('sync.autoSync')}</p>
                    <p className="text-xs text-muted-foreground">{t('sync.autoSyncDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateSettings({ autoSync: !syncSettings.autoSync })}
                  className={cn(
                    'relative inline-flex h-6 w-10 items-center rounded-full transition-colors',
                    syncSettings.autoSync ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      syncSettings.autoSync ? 'translate-x-5' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* 同步间隔 */}
              {syncSettings.autoSync && (
                <div className="pl-7 space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {t('sync.syncInterval')}
                  </label>
                  <select
                    value={syncSettings.syncInterval}
                    onChange={(e) => handleUpdateSettings({ syncInterval: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={5}>{t('sync.interval.5min')}</option>
                    <option value={15}>{t('sync.interval.15min')}</option>
                    <option value={30}>{t('sync.interval.30min')}</option>
                    <option value={60}>{t('sync.interval.1hour')}</option>
                    <option value={360}>{t('sync.interval.6hours')}</option>
                  </select>
                </div>
              )}

              {/* 仅WiFi同步 */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{t('sync.wifiOnly')}</p>
                    <p className="text-xs text-muted-foreground">{t('sync.wifiOnlyDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateSettings({ wifiOnly: !syncSettings.wifiOnly })}
                  className={cn(
                    'relative inline-flex h-6 w-10 items-center rounded-full transition-colors',
                    syncSettings.wifiOnly ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      syncSettings.wifiOnly ? 'translate-x-5' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* 冲突解决策略 */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t('sync.conflictStrategy')}
                </label>
                <select
                  value={syncSettings.conflictStrategy || 'timestamp'}
                  onChange={(e) => handleUpdateSettings({ conflictStrategy: e.target.value as ConflictStrategy })}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="timestamp">{t('sync.strategy.timestamp')}</option>
                  <option value="server-wins">{t('sync.strategy.serverWins')}</option>
                  <option value="client-wins">{t('sync.strategy.clientWins')}</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {t('sync.conflictStrategyDesc')}
                </p>
              </div>

              {/* 设备信息 */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span>{t('sync.deviceId')}: {syncSettings.deviceId.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 隐私说明 */}
      <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl">
        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">{t('sync.privacyTitle')}</p>
          <p>{t('sync.privacyDesc')}</p>
        </div>
      </div>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <ConflictResolution
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflicts={conflicts}
        onResolved={handleConflictResolved}
      />
    </div>
  );
}
