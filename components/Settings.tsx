'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSettings, saveSettings, exportData, clearAllData, AppSettings } from '@/lib/storage';
import { useTranslation, Locale } from '@/lib/i18n';
import { Shield, Download, Trash2, Info, Languages } from 'lucide-react';

interface SettingsProps {
  onDataChange: () => void;
}

const defaultSettings: AppSettings = { encrypted: false, createdAt: '' };

export default function SettingsView({ onDataChange }: SettingsProps) {
  const { t, locale, setLocale } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showExportDone, setShowExportDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(getSettings());
  }, []);

  const toggleEncryption = () => {
    const updated = { ...settings, encrypted: !settings.encrypted };
    saveSettings(updated);
    setSettings(updated);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-journal-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDone(true);
    setTimeout(() => setShowExportDone(false), 3000);
  };

  const handleClear = () => {
    clearAllData();
    setConfirmClear(false);
    onDataChange();
  };

  return (
    <div className="space-y-4 max-w-lg animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('settings.title')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.language.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['zh-CN', 'en-US'] as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  locale === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {t(`settings.language.${lang.replace('-', '')}`)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.privacy.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.privacy.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t('settings.privacy.encryption')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!mounted ? t('settings.privacy.loading') : (settings.encrypted ? t('settings.privacy.encrypted') : t('settings.privacy.notEncrypted'))}
              </p>
            </div>
            <button
              onClick={toggleEncryption}
              disabled={!mounted}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.encrypted ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-soft transition-transform duration-200 ${settings.encrypted ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.export.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.export.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {showExportDone ? t('settings.export.success') : t('settings.export.button')}
          </Button>
        </CardContent>
      </Card>

      {/* Clear */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm">{t('settings.clear.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.clear.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmClear ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">{t('settings.clear.confirm')}</p>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleClear} className="flex-1">
                  {t('settings.clear.confirmButton')}
                </Button>
                <Button variant="outline" onClick={() => setConfirmClear(false)} className="flex-1">
                  {t('settings.clear.cancelButton')}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirmClear(true)} className="w-full text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('settings.clear.button')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('settings.about.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t('settings.about.appName')}</p>
            <p>{t('settings.about.description')}</p>
            <p className="text-xs">{t('settings.about.storageNote')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
