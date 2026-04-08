'use client';

import React from 'react';
import { X, CalendarDays } from 'lucide-react';
import { Button } from '@/core/ui/button';
import { useTranslation } from '@/core/i18n';

interface DateJumpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJump: (y: number, m: number, day?: number) => void;
  currentYear: number;
  currentMonth: number;
}

export default function DateJumpDialog({
  isOpen,
  onClose,
  onJump,
  currentYear,
  currentMonth,
}: DateJumpDialogProps) {
  const { t } = useTranslation();
  const [year, setYear] = React.useState(currentYear);
  const [month, setMonth] = React.useState(currentMonth);
  const [day, setDay] = React.useState<number | ''>('');

  const today = new Date();
  const minYear = 2000;
  const maxYear = today.getFullYear();

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  React.useEffect(() => {
    if (isOpen) {
      setYear(currentYear);
      setMonth(currentMonth);
      setDay('');
    }
  }, [isOpen, currentYear, currentMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJump(year, month-1, day || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card rounded-xl shadow-elevated border border-border animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{t('dateJump.title')}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                {t('dateJump.selectYear')}
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                {t('dateJump.selectMonth')}
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                {t('dateJump.selectDay')}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(e.target.value ? Number(e.target.value) : '')}
                placeholder={t('dateJump.selectDay')}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('dateJump.cancel')}
            </Button>
            <Button type="submit">{t('dateJump.jump')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
