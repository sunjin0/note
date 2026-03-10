'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSettings, saveSettings, exportData, clearAllData, AppSettings } from '@/lib/storage';
import { Shield, Download, Trash2, Info } from 'lucide-react';

interface SettingsProps {
  onDataChange: () => void;
}

const defaultSettings: AppSettings = { encrypted: false, createdAt: '' };

export default function SettingsView({ onDataChange }: SettingsProps) {
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
        <h2 className="text-xl font-bold text-foreground">设置</h2>
        <p className="text-xs text-muted-foreground mt-0.5">管理你的数据和隐私</p>
      </div>

      {/* Privacy */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">隐私保护</CardTitle>
          </div>
          <CardDescription>开启数据加密保护你的日记内容</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">本地数据加密</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!mounted ? '加载中...' : (settings.encrypted ? '数据已加密存储' : '数据以明文存储')}
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
            <CardTitle className="text-sm">导出数据</CardTitle>
          </div>
          <CardDescription>将所有记录导出为 JSON 文件</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {showExportDone ? '导出成功 ✓' : '导出所有数据'}
          </Button>
        </CardContent>
      </Card>

      {/* Clear */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm">清除数据</CardTitle>
          </div>
          <CardDescription>此操作不可逆，请谨慎操作</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmClear ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">确定要删除所有数据吗？</p>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleClear} className="flex-1">
                  确认删除
                </Button>
                <Button variant="outline" onClick={() => setConfirmClear(false)} className="flex-1">
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirmClear(true)} className="w-full text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              清除所有数据
            </Button>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">关于</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>心情日记 v1.0</p>
            <p>一个简洁的心情追踪和日记应用。所有数据安全存储在你的本地设备上，不会上传到任何服务器。</p>
            <p className="text-xs">所有数据仅保存在浏览器 localStorage 中</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
