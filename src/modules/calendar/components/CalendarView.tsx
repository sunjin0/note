'use client';

import React from 'react';
import { cn } from '@/core/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/card';
import { Button } from '@/core/ui/button';
import { Mood, MoodEntry } from '@/types';
import { MOOD_CONFIG, CALENDAR_COLORS, HEATMAP_VALUE } from '@/core/config/mood';
import { useTranslation } from '@/core/i18n';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Grid3X3,
  Moon,
} from 'lucide-react';
import { getLunarDate, isLunarFestival } from '@/core/utils/lunar';

interface CalendarViewProps {
  entries: MoodEntry[];
  onSelectDate: (date: string) => void;
}

export default function CalendarView({ entries, onSelectDate }: CalendarViewProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [daysRange, setDaysRange] = React.useState<90 | 180 | 365>(90);
  const [showLunar, setShowLunar] = React.useState(false);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = React.useState<string | null>(todayStr);
  const [viewMode, setViewMode] = React.useState<'month' | 'year'>('month');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthEntries = React.useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return entries.filter((e) => e.date.startsWith(prefix));
  }, [entries, year, month]);

  const entryMap = React.useMemo(() => {
    const map: Record<string, MoodEntry> = {};
    monthEntries.forEach((e) => {
      map[e.date] = e;
    });
    return map;
  }, [monthEntries]);

  const prevMonth = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(year - 1, 0, 1));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const nextMonth = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(year + 1, 0, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const goToday = () => {
    const now = new Date();
    if (viewMode === 'year') {
      setCurrentDate(new Date(now.getFullYear(), 0, 1));
    } else {
      setCurrentDate(now);
      setSelectedDate(todayStr);
    }
  };

  const { moodDotColor, moodCellBg } = CALENDAR_COLORS;

  // Mood stats for this month
  const moodCounts: Record<Mood, number> = { great: 0, good: 0, okay: 0, sad: 0, angry: 0 };
  monthEntries.forEach((e) => {
    moodCounts[e.mood]++;
  });

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
          <h2 className="text-xl font-bold text-foreground">
            {viewMode === 'month'
              ? t('calendar.title', { year, month: month + 1 })
              : `${year}${t('calendar.yearSuffix') || '年'}`}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {viewMode === 'month'
              ? t('calendar.recordsThisMonth', { count: monthEntries.length })
              : t('calendar.recordsThisYear', {
                  count: entries.filter((e) => e.date.startsWith(String(year))).length,
                })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'month'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('calendar.monthView') || '月'}</span>
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'year'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('calendar.yearView') || '年'}</span>
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLunar(!showLunar)}
            className={cn(showLunar && 'bg-primary/10 border-primary')}
            title={showLunar ? t('calendar.hideLunar') : t('calendar.showLunar')}
          >
            <Moon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            {t('calendar.today')}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'year' ? (
        <YearView
          year={year}
          entries={entries}
          onSelectDate={onSelectDate}
          onMonthClick={(m) => {
            setCurrentDate(new Date(year, m, 1));
            setViewMode('month');
          }}
        />
      ) : (
        <>
          {/* Month View Content */}

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-4">
              {/* Week headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {t<string[]>('calendar.weekDays', {}).map((d: string) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
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
                        isFuture && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isToday
                            ? 'text-primary'
                            : entry
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                        )}
                      >
                        {day}
                      </span>
                      {showLunar && (
                        <span className="text-[9px] text-muted-foreground mt-0.5 truncate w-full text-center">
                          {getLunarDate(dateStr)}
                        </span>
                      )}
                      {entry && (
                        <span className="text-xs mt-0.5">{MOOD_CONFIG[entry.mood].emoji}</span>
                      )}
                      {isToday && !entry && <Plus className="h-3 w-3 text-primary mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Month Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(Object.entries(MOOD_CONFIG) as [Mood, (typeof MOOD_CONFIG)[Mood]][]).map(
              ([key, config]) => (
                <Card key={key} className={cn('border-none', config.bgClass)}>
                  <CardContent className="p-3 flex items-center gap-2">
                    <span className="text-xl">{config.emoji}</span>
                    <div>
                      <p className="text-lg font-bold text-foreground">{moodCounts[key as Mood]}</p>
                      <p className="text-[10px] text-muted-foreground">{t(`mood.${key}`)}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </>
      )}

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('calendar.heatmap')}</CardTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {([90, 180, 365] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDaysRange(range)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    daysRange === range
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(`calendar.heatmapDays${range}`)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <HeatmapView entries={entries} daysRange={daysRange} />
        </CardContent>
      </Card>
    </div>
  );
}

// 年度视图组件
function YearView({
  year,
  entries,
  onSelectDate,
  onMonthClick,
}: {
  year: number;
  entries: MoodEntry[];
  onSelectDate: (date: string) => void;
  onMonthClick: (month: number) => void;
}) {
  const { t } = useTranslation();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 获取年度数据
  const yearEntries = entries.filter((e) => e.date.startsWith(String(year)));
  const entryMap: Record<string, MoodEntry> = {};
  yearEntries.forEach((e) => {
    entryMap[e.date] = e;
  });

  // 生成12个月的迷你日历
  const months = Array.from({ length: 12 }, (_, i) => i);
  const weekDays = (t('calendar.weekDaysShort', {}) as unknown as string[]) || [
    '日',
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {months.map((month) => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);

        // 计算该月的心情统计
        const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthData = yearEntries.filter((e) => e.date.startsWith(monthPrefix));
        const moodCount = monthData.length;
        const avgMood =
          moodCount > 0
            ? monthData.reduce((sum, e) => {
                const values: Record<Mood, number> = {
                  great: 5,
                  good: 4,
                  okay: 3,
                  sad: 2,
                  angry: 1,
                };
                return sum + values[e.mood];
              }, 0) / moodCount
            : 0;

        return (
          <Card
            key={month}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onMonthClick(month)}
          >
            <CardContent className="p-3">
              {/* 月份标题 */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {month + 1}
                  {t('calendar.monthSuffix') || '月'}
                </h3>
                {moodCount > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {moodCount}
                  </span>
                )}
              </div>

              {/* 迷你日历网格 */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* 星期标题 */}
                {weekDays.map((d, i) => (
                  <div key={i} className="text-center text-[8px] text-muted-foreground py-0.5">
                    {d}
                  </div>
                ))}
                {/* 日期单元格 */}
                {days.map((day, i) => {
                  if (day === null) return <div key={`blank-${i}`} className="aspect-square" />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const entry = entryMap[dateStr];
                  const isToday = dateStr === todayStr;
                  const isFuture = new Date(dateStr + 'T00:00:00') > today;

                  return (
                    <button
                      key={dateStr}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFuture) {
                          onSelectDate(dateStr);
                        }
                      }}
                      disabled={isFuture}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded text-[10px] transition-colors',
                        entry && CALENDAR_COLORS.moodCellBg[entry.mood],
                        isToday && 'ring-1 ring-primary font-bold',
                        !entry && 'text-muted-foreground',
                        !isFuture && 'hover:bg-accent cursor-pointer',
                        isFuture && 'opacity-30 cursor-not-allowed'
                      )}
                      title={
                        entry
                          ? `${month + 1}/${day} ${t(`mood.${entry.mood}`)}`
                          : `${month + 1}/${day}`
                      }
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* 心情指示条 */}
              {moodCount > 0 && (
                <div className="mt-2 h-1 rounded-full overflow-hidden bg-muted flex">
                  {(['great', 'good', 'okay', 'sad', 'angry'] as Mood[]).map((mood) => {
                    const count = monthData.filter((e) => e.mood === mood).length;
                    const percentage = (count / moodCount) * 100;
                    if (percentage === 0) return null;
                    return (
                      <div
                        key={mood}
                        className={cn(
                          'h-full',
                          CALENDAR_COLORS.moodDotColor[mood].replace('bg-', 'bg-mood-')
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function HeatmapView({ entries, daysRange }: { entries: MoodEntry[]; daysRange: 90 | 180 | 365 }) {
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

  const days = Array.from({ length: daysRange }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysRange - 1 - i));
    return d.toISOString().split('T')[0];
  });

  const entryMap: Record<string, MoodEntry> = {};
  entries.forEach((e) => {
    entryMap[e.date] = e;
  });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const calculateStreaks = () => {
    const allDates = Object.keys(entryMap).sort().reverse();
    if (allDates.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    const checkDate = new Date(today);

    for (let i = 0; i < 365 * 2; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entryMap[dateStr]) {
        currentStreak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let longestStreak = 0;
    let tempStreak = 1;
    const sortedDates = allDates.sort();

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00');
      const currDate = new Date(sortedDates[i] + 'T00:00:00');
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  };

  const streaks = calculateStreaks();

  // Group by weeks
  const weeks: (string | null)[][] = [];
  let currentWeek: (string | null)[] = [];
  const firstDayOfWeek = new Date(days[0] + 'T00:00:00').getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }
  days.forEach((d) => {
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
    const firstValidDay = week.find((d) => d !== null);
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
  const weekDayLabels = (t('calendar.weekDaysShort', {}) as unknown as string[]) || [
    '日',
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
  ];

  return (
    <div className="space-y-3">
      {/* Streak Stats */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-xs text-muted-foreground">{t('calendar.currentStreak')}</p>
              <p className="text-xl font-bold text-foreground">
                {streaks.current}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('calendar.daysUnit')}
                </span>
              </p>
            </div>
          </div>
          {streaks.current > 0 && (
            <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1">
              {t('calendar.streakKeepGoing')}
            </p>
          )}
        </div>
        <div className="flex-1 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xs text-muted-foreground">{t('calendar.longestStreak')}</p>
              <p className="text-xl font-bold text-foreground">
                {streaks.longest}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('calendar.daysUnit')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

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
                    {monthLabel}
                    {t('calendar.monthSuffix') || '月'}
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
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
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
                      val !== null
                        ? 'hover:ring-2 hover:ring-foreground/30 hover:scale-110'
                        : 'hover:bg-muted/60'
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
