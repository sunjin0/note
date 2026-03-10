'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mood, MoodEntry, MOOD_CONFIG } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarViewProps {
  entries: MoodEntry[];
  onSelectDate: (date: string) => void;
}

export default function CalendarView({ entries, onSelectDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

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
  const goToday = () => setCurrentDate(new Date());

  const moodDotColor: Record<Mood, string> = {
    great: 'bg-mood-great',
    good: 'bg-mood-good',
    okay: 'bg-mood-okay',
    sad: 'bg-mood-sad',
    angry: 'bg-mood-angry',
  };

  const moodCellBg: Record<Mood, string> = {
    great: 'mood-bg-great',
    good: 'mood-bg-good',
    okay: 'mood-bg-okay',
    sad: 'mood-bg-sad',
    angry: 'mood-bg-angry',
  };

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
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{year}年{month + 1}月</h2>
          <p className="text-xs text-muted-foreground mt-0.5">本月记录了 {monthEntries.length} 天</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>今天</Button>
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
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
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

              return (
                <button
                  key={dateStr}
                  onClick={() => !isFuture && onSelectDate(dateStr)}
                  disabled={isFuture}
                  className={cn(
                    'relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200',
                    isToday && 'ring-2 ring-primary',
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
                <p className="text-[10px] text-muted-foreground">{config.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">最近三个月心情热图</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatmapView entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}

function HeatmapView({ entries }: { entries: MoodEntry[] }) {
  const moodValue: Record<Mood, number> = { great: 4, good: 3, okay: 2, sad: 1, angry: 0 };
  const valueColor = (v: number | null) => {
    if (v === null) return 'bg-muted';
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

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-2 scrollbar-thin">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((d, di) => {
              if (!d) return <div key={`null-${di}`} className="w-3 h-3 md:w-3.5 md:h-3.5" />;
              const entry = entryMap[d];
              const val = entry ? moodValue[entry.mood] : null;
              const dt = new Date(d + 'T00:00:00');
              const tooltip = `${dt.getMonth() + 1}/${dt.getDate()} ${entry ? MOOD_CONFIG[entry.mood].label : '未记录'}`;
              return (
                <div
                  key={d}
                  className={cn('w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm transition-colors', valueColor(val), val !== null && 'opacity-80')}
                  title={tooltip}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span>少</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-mood-angry opacity-80" />
          <div className="w-3 h-3 rounded-sm bg-mood-sad opacity-80" />
          <div className="w-3 h-3 rounded-sm bg-mood-okay opacity-80" />
          <div className="w-3 h-3 rounded-sm bg-mood-good opacity-80" />
          <div className="w-3 h-3 rounded-sm bg-mood-great opacity-80" />
        </div>
        <span>好</span>
      </div>
    </div>
  );
}
