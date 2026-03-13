'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mood, MoodEntry } from '@/lib/types';
import { MOOD_CONFIG, CALENDAR_COLORS, HEATMAP_VALUE } from '@/lib/mood-config';
import { useTranslation } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarViewProps {
  entries: MoodEntry[];
  onSelectDate: (date: string) => void;
}

export default function CalendarView({ entries, onSelectDate }: CalendarViewProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = React.useState<string | null>(todayStr);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthEntries = React.useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return entries.filter(e => e.date.startsWith(prefix));
  }, [entries, year, month]);

  const entryMap = React.useMemo(() => {
    const map: Record<string, MoodEntry> = {};
    monthEntries.forEach(e => { map[e.date] = e; });
    return map;
  }, [monthEntries]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(todayStr);
  };

  const { moodDotColor, moodCellBg } = CALENDAR_COLORS;

  // Mood stats for this month
  const moodCounts: Record<Mood, number> = { great: 0, good: 0, okay: 0, sad: 0, angry: 0 };
  monthEntries.forEach(e => { moodCounts[e.mood]++; });

  const days = [];
  // Fill blanks for first week
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('calendar.title', { year, month: month + 1 })}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('calendar.recordsThisMonth', { count: monthEntries.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>{t('calendar.today')}</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Week headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {(t('calendar.weekDays', {}) as unknown as string[]).map((d: string) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const entry = entryMap[dateStr];
              const isToday = dateStr === todayStr;
              const isFuture = new Date(dateStr + 'T00:00:00') > today;

              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    if (!isFuture) {
                      setSelectedDate(dateStr);
                      onSelectDate(dateStr);
                    }
                  }}
                  disabled={isFuture}
                  className={cn(
                    'relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200',
                    isSelected && 'ring-2 ring-primary',
                    entry && moodCellBg[entry.mood],
                    !isFuture && !entry && 'hover:bg-accent',
                    isFuture && 'opacity-30 cursor-not-allowed',
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    isToday ? 'text-primary' : entry ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {day}
                  </span>
                  {entry && (
                    <span className="text-xs mt-0.5">{MOOD_CONFIG[entry.mood].emoji}</span>
                  )}
                  {isToday && !entry && (
                    <Plus className="h-3 w-3 text-primary mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Month Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, config]) => (
          <Card key={key} className={cn('border-none', config.bgClass)}>
            <CardContent className="p-3 flex items-center gap-2">
              <span className="text-xl">{config.emoji}</span>
              <div>
                <p className="text-lg font-bold text-foreground">{moodCounts[key as Mood]}</p>
                <p className="text-[10px] text-muted-foreground">{t(`mood.${key}`)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('calendar.heatmap')}</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatmapView entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}

function HeatmapView({ entries }: { entries: MoodEntry[] }) {
  const { t } = useTranslation();
  
  const moodValue = HEATMAP_VALUE;
  
  const valueColor = (v: number | null) => {
    if (v === null) return 'bg-muted/40';
    if (v >= 4) return 'bg-mood-great';
    if (v >= 3) return 'bg-mood-good';
    if (v >= 2) return 'bg-mood-okay';
    if (v >= 1) return 'bg-mood-sad';
    return 'bg-mood-angry';
  };

  // Last 90 days
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    return d.toISOString().split('T')[0];
  });

  const entryMap: Record<string, MoodEntry> = {};
  entries.forEach(e => { entryMap[e.date] = e; });

  // Group by weeks
  const weeks: (string | null)[][] = [];
  let currentWeek: (string | null)[] = [];
  const firstDayOfWeek = new Date(days[0] + 'T00:00:00').getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }
  days.forEach(d => {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Get month labels for the heatmap
  const getMonthLabel = (weekIndex: number) => {
    const week = weeks[weekIndex];
    if (!week) return null;
    const firstValidDay = week.find(d => d !== null);
    if (!firstValidDay) return null;
    const dt = new Date(firstValidDay + 'T00:00:00');
    const dayOfMonth = dt.getDate();
    // Only show month label on first week of each month or first week
    if (weekIndex === 0 || dayOfMonth <= 7) {
      return dt.getMonth() + 1;
    }
    return null;
  };

  // Week day labels
  const weekDayLabels = t('calendar.weekDaysShort', {}) as unknown as string[] || ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-3">
      {/* Month labels row */}
      <div className="flex gap-1">
        <div className="w-6 md:w-8 flex-shrink-0" /> {/* Space for weekday labels */}
        <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-thin pb-1">
          {weeks.map((_, wi) => {
            const monthLabel = getMonthLabel(wi);
            return (
              <div key={wi} className="flex-shrink-0 w-4 md:w-5 flex items-center justify-center">
                {monthLabel && (
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    {monthLabel}{t('calendar.monthSuffix') || '月'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap grid with weekday labels */}
      <div className="flex gap-1">
        {/* Weekday labels */}
        <div className="flex flex-col gap-1 w-6 md:w-8 flex-shrink-0">
          {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
            <div 
              key={dayIndex} 
              className="h-4 md:h-5 flex items-center justify-end pr-1 text-[10px] md:text-xs text-muted-foreground"
            >
              {weekDayLabels[dayIndex]}
            </div>
          ))}
        </div>

        {/* Heatmap cells */}
        <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-thin py-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((d, di) => {
                if (!d) return <div key={`null-${di}`} className="w-4 h-4 md:w-5 md:h-5" />;
                const entry = entryMap[d];
                const val = entry ? moodValue[entry.mood] : null;
                const dt = new Date(d + 'T00:00:00');
                const tooltip = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()} ${entry ? t(`mood.${entry.mood}`) : t('calendar.noRecord')}`;
                
                return (
                  <div
                    key={d}
                    className={cn(
                      'w-4 h-4 md:w-5 md:h-5 rounded transition-all duration-200 cursor-pointer',
                      valueColor(val),
                      val !== null ? 'hover:ring-2 hover:ring-foreground/30 hover:scale-110' : 'hover:bg-muted/60'
                    )}
                    title={tooltip}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{t('calendar.heatmapLess')}</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-muted/40" />
            <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-mood-angry" />
            <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-mood-sad" />
            <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-mood-okay" />
            <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-mood-good" />
            <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-mood-great" />
          </div>
          <span>{t('calendar.heatmapMore')}</span>
        </div>
        
        {/* Date range indicator */}
        <div className="text-[10px] text-muted-foreground">
          {(() => {
            const startDate = new Date(days[0] + 'T00:00:00');
            const endDate = new Date(days[days.length - 1] + 'T00:00:00');
            return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
          })()}
        </div>
      </div>
    </div>
  );
}
