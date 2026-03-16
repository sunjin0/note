'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/core/utils';
import { Bell, X, Clock } from 'lucide-react';
import { useTranslation } from '@/core/i18n';

interface SmartReminderProps {
  entries: { date: string }[];
  onRemind: () => void;
}

interface ReminderState {
  lastRemindedAt: string | null;
  reminderEnabled: boolean;
  preferredHour: number;
}

const REMINDER_KEY = 'mood-journal-reminder';
const DEFAULT_PREFERRED_HOUR = 20; // 晚上8点

export default function SmartReminder({ entries, onRemind }: SmartReminderProps) {
  const { t } = useTranslation();
  const [showReminder, setShowReminder] = useState(false);
  const [reminderState, setReminderState] = useState<ReminderState>({
    lastRemindedAt: null,
    reminderEnabled: true,
    preferredHour: DEFAULT_PREFERRED_HOUR,
  });
  const [dismissed, setDismissed] = useState(false);

  // 加载提醒设置
  useEffect(() => {
    const stored = localStorage.getItem(REMINDER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setReminderState(prev => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
  }, []);

  // 保存提醒设置
  const saveReminderState = useCallback((state: Partial<ReminderState>) => {
    const newState = { ...reminderState, ...state };
    setReminderState(newState);
    localStorage.setItem(REMINDER_KEY, JSON.stringify(newState));
  }, [reminderState]);

  // 检查是否需要提醒
  useEffect(() => {
    if (!reminderState.reminderEnabled || dismissed) return;

    const checkReminder = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();

      // 检查今天是否已记录
      const hasTodayEntry = entries.some(e => e.date === today);
      if (hasTodayEntry) {
        setShowReminder(false);
        return;
      }

      // 检查今天是否已经提醒过
      if (reminderState.lastRemindedAt === today) {
        setShowReminder(false);
        return;
      }

      // 分析用户的记录习惯
      const recordHours = entries.map(e => {
        // 假设记录时间是随机的，基于日期生成一个模拟时间
        const date = new Date(e.date + 'T12:00:00');
        return date.getHours();
      });

      // 计算平均记录时间（如果有记录）
      let preferredHour = reminderState.preferredHour;
      if (recordHours.length > 0) {
        const avgHour = recordHours.reduce((a, b) => a + b, 0) / recordHours.length;
        // 根据习惯调整提醒时间，但不要太早
        preferredHour = Math.max(18, Math.round(avgHour));
      }

      // 如果当前时间超过首选时间，显示提醒
      if (currentHour >= preferredHour) {
        setShowReminder(true);
        saveReminderState({ lastRemindedAt: today });
      }
    };

    // 立即检查一次
    checkReminder();

    // 每小时检查一次
    const interval = setInterval(checkReminder, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [entries, reminderState, dismissed, saveReminderState]);

  const handleDismiss = () => {
    setShowReminder(false);
    setDismissed(true);
  };

  const handleRemindNow = () => {
    setShowReminder(false);
    onRemind();
  };

  if (!showReminder) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-card border border-border rounded-xl shadow-elevated p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">
              {t('reminder.title')}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t('reminder.message')}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleRemindNow}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('reminder.recordNow')}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-muted-foreground text-xs hover:text-foreground transition-colors"
              >
                {t('reminder.later')}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* 连续记录提示 */}
        {entries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {t('reminder.streakInfo', { count: calculateStreak(entries) })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// 计算连续记录天数
function calculateStreak(entries: { date: string }[]): number {
  if (entries.length === 0) return 0;
  
  const sortedDates = [...entries]
    .map(e => e.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // 如果今天没有记录，检查昨天是否有
  let streak = 0;
  let checkDate = sortedDates[0] === today ? today : yesterday;
  
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }
  
  for (const date of sortedDates) {
    if (date === checkDate) {
      streak++;
      // 移动到前一天
      const prevDate = new Date(new Date(checkDate + 'T00:00:00').getTime() - 24 * 60 * 60 * 1000);
      checkDate = prevDate.toISOString().split('T')[0];
    } else if (new Date(date).getTime() < new Date(checkDate).getTime()) {
      // 跳过了某天，中断
      break;
    }
  }
  
  return streak;
}
