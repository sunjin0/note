'use client';

import React, { useState } from 'react';
import { Button } from '@/core/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/card';
import { useTranslation } from '@/core/i18n';
import { getSettings, saveSettings } from '@/core/storage';
import { X, Check } from 'lucide-react';

interface WeeklyGoalModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WeeklyGoalModal({ open, onClose }: WeeklyGoalModalProps) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState(5);
  const settings = getSettings();

  const handleSave = () => {
    saveSettings({
      ...settings,
      weeklyGoalDays: goal,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">{t('dashboard.weeklyGoal')}</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('dashboard.weeklyGoalDesc')}</p>
          <div className="space-y-2">
            {[3, 5, 7].map((days) => (
              <button
                key={days}
                onClick={() => setGoal(days)}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  goal === days
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <span className="font-medium">{days}</span>
                <span className="text-xs text-muted-foreground ml-2">{t('dashboard.days')}</span>
              </button>
            ))}
          </div>
          <Button onClick={handleSave} className="w-full">
            <Check className="h-4 w-4 mr-2" />
            {t('dashboard.weeklyGoalSet')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
