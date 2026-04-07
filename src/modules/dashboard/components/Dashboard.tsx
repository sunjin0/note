'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/core/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/card';
import { Button } from '@/core/ui/button';
import { Mood, MoodEntry, MoodStats, FactorOption } from '@/types';
import { MOOD_CONFIG, FACTOR_OPTIONS, DASHBOARD_CHART } from '@/core/config/mood';
import { getStreak, getMoodStats, getCustomFactors, getSettings } from '@/core/storage';
import { useTranslation } from '@/core/i18n';
import {
  Plus,
  Flame,
  BookOpen,
  TrendingUp,
  ChevronRight,
  PieChart,
  Target,
  Calendar,
  Settings,
  Check,
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  onNewEntry: (date?: string, mood?: Mood) => void;
  onViewJournal: () => void;
  entries: MoodEntry[];
}

const defaultStats: MoodStats = { great: 0, good: 0, okay: 0, sad: 0, angry: 0 };

type TrendPeriod = 7 | 30 | 90;

export default function Dashboard({ onNewEntry, onViewJournal, entries }: DashboardProps) {
  const { t } = useTranslation();
  const [weeklyGoal, setWeeklyGoal] = useState<number>(5);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [allFactors, setAllFactors] = useState<FactorOption[]>(FACTOR_OPTIONS);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>(7);
  const [trendData, setTrendData] = useState<
    { date: Date; label: string; dayNum: number; entry?: MoodEntry }[]
  >([]);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState<MoodStats>(defaultStats);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setMounted(true);
    setStreak(getStreak());
    setStats(getMoodStats());
    const customFactors = getCustomFactors();
    setAllFactors([...FACTOR_OPTIONS, ...customFactors]);

    const settings = getSettings();
    setWeeklyGoal(settings.weeklyGoalDays || 5);
  }, [entries]);

  const totalEntries = entries.length;

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    setTodayStr(today);

    const weekDays = t<string[]>('calendar.weekDays', {});
    const days = Array.from({ length: trendPeriod }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (trendPeriod - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      const entry = entries.find((e) => e.date === dateStr);
      return {
        date: d,
        label: weekDays[d.getDay()],
        dayNum: d.getDate(),
        entry,
      };
    });
    setTrendData(days);
  }, [entries, t, trendPeriod]);

  const todayEntry = entries.find((e) => e.date === todayStr);
  const recentEntries = entries.slice(0, 5);

  const { moodToHeight, moodBarColor } = DASHBOARD_CHART;
  const topMood = (Object.entries(stats) as [Mood, number][]).sort((a, b) => b[1] - a[1])[0];

  const moodToScore: Record<Mood, number> = {
    great: 5,
    good: 4,
    okay: 3,
    sad: 2,
    angry: 1,
  };

  const avgMoodIndex: number =
    totalEntries > 0
      ? Number(
          (entries.reduce((sum, entry) => sum + moodToScore[entry.mood], 0) / totalEntries).toFixed(
            1
          )
        )
      : 0;

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(new Date());
  const weeklySuccess = entries.filter((e) => {
    const entryDate = new Date(e.date + 'T00:00:00');
    return entryDate >= weekStart;
  }).length;

  const factorCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    entry.factors.forEach((factor) => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });
  });
  const topFactors = Object.entries(factorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const factor = allFactors.find((f) => f.id === id);
      return factor ? ([id, count] as [string, number]) : null;
    })
    .filter((item): item is [string, number] => item !== null);

  const dayOfWeekStats: Record<number, { count: number; totalScore: number }> = {};
  entries.forEach((entry) => {
    const day = new Date(entry.date).getDay();
    if (!dayOfWeekStats[day]) {
      dayOfWeekStats[day] = { count: 0, totalScore: 0 };
    }
    dayOfWeekStats[day].count++;
    dayOfWeekStats[day].totalScore += moodToScore[entry.mood];
  });
  const bestDayOfWeek = Object.entries(dayOfWeekStats)
    .map(([day, data]) => ({
      day: parseInt(day),
      avgScore: data.totalScore / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)[0] as
    | {
        day: number;
        avgScore: number;
        count: number;
      }
    | undefined;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden h-48 md:h-56">
        <img
          src="/images/hero-banner.png"
          alt={t('app.title')}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-foreground/20 flex items-center">
          <div className="px-8">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              {!mounted
                ? t('settings.privacy.loading')
                : todayEntry
                  ? `${t('dashboard.todayMood')}  ${t(`mood.${todayEntry.mood}`)}`
                  : t('dashboard.howAreYou')}
            </h1>
            <p className="text-primary-foreground/80 text-sm mb-4">{t('app.description')}</p>
            <Button onClick={() => onNewEntry(todayStr)} className="shadow-medium">
              <Plus className="h-4 w-4 mr-2" />
              {todayEntry ? t('dashboard.updateMood') : t('dashboard.recordMood')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{mounted ? streak : '—'}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.streak')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.totalEntries')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {mounted && topMood && topMood[1] > 0 ? MOOD_CONFIG[topMood[0]].emoji : '—'}
              </p>
              <p className="text-xs text-muted-foreground">{t('dashboard.commonMood')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {mounted
                  ? totalEntries > 0
                    ? Math.round(((stats.great + stats.good) / totalEntries) * 100)
                    : 0
                  : '—'}
                %
              </p>
              <p className="text-xs text-muted-foreground">{t('dashboard.last7Days')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart + Mood Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trend Mood Chart with Period Selector */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">{t('dashboard.moodTrend')}</CardTitle>
            <div className="flex gap-1">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setTrendPeriod(days as TrendPeriod)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md transition-all',
                    trendPeriod === days
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {t(`dashboard.days${days}`)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <div className="flex items-end h-24 gap-px">
                {trendData.map((day, i) => (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center justify-end h-full"
                    title={
                      day.entry
                        ? `${day.date.toLocaleDateString()} - ${t(`mood.${day.entry.mood}`)}`
                        : day.date.toLocaleDateString()
                    }
                  >
                    {day.entry ? (
                      <div
                        className={cn(
                          'w-full rounded-t-sm transition-all duration-300 hover:opacity-80',
                          moodBarColor[day.entry.mood]
                        )}
                        style={{ height: `${moodToHeight[day.entry.mood]}%` }}
                      />
                    ) : (
                      <div className="w-full h-px bg-muted/30" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex h-6 gap-px mt-1">
                {trendData.map((day, i) => {
                  const showLabel =
                    trendPeriod <= 7 ||
                    (trendPeriod === 30 && i % 7 === 0) ||
                    (trendPeriod === 90 && (i === 0 || i % 15 === 0 || i === trendPeriod - 1));

                  return (
                    <div key={i} className="flex-1 flex items-start justify-center">
                      {showLabel && (
                        <span className="text-[8px] text-muted-foreground leading-none">
                          {trendPeriod <= 7 ? day.label : day.dayNum}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              {t('dashboard.moodDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalEntries === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                {t('dashboard.noDataYet')}
              </div>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={[
                        {
                          name: t('mood.great'),
                          value: stats.great,
                          color: MOOD_CONFIG.great.color.replace('text-', ''),
                        },
                        {
                          name: t('mood.good'),
                          value: stats.good,
                          color: MOOD_CONFIG.good.color.replace('text-', ''),
                        },
                        {
                          name: t('mood.okay'),
                          value: stats.okay,
                          color: MOOD_CONFIG.okay.color.replace('text-', ''),
                        },
                        {
                          name: t('mood.sad'),
                          value: stats.sad,
                          color: MOOD_CONFIG.sad.color.replace('text-', ''),
                        },
                        {
                          name: t('mood.angry'),
                          value: stats.angry,
                          color: MOOD_CONFIG.angry.color.replace('text-', ''),
                        },
                      ].filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { value: stats.great, fill: '#22c55e' },
                        { value: stats.good, fill: '#3b82f6' },
                        { value: stats.okay, fill: '#eab308' },
                        { value: stats.sad, fill: '#6b7280' },
                        { value: stats.angry, fill: '#ef4444' },
                      ]
                        .filter((d) => d.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} ${t('journal.entries')}`, name]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="middle"
                      align="right"
                      layout="vertical"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Statistics - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Mood Index */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('dashboard.avgMoodIndex')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-20">
              <span className="text-3xl font-bold text-foreground">
                {mounted && totalEntries > 0 ? avgMoodIndex.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-muted-foreground ml-2">/ 5.0</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(avgMoodIndex / 5) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Common Factors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('dashboard.commonFactors')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFactors.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('dashboard.noDataYet')}
              </div>
            ) : (
              <div className="space-y-2">
                {topFactors.slice(0, 4).map(([factorId, count]) => {
                  const factor = allFactors.find((f) => f.id === factorId);
                  if (!factor) return null;
                  return (
                    <div key={factorId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{factor.emoji}</span>
                        <span className="text-xs text-foreground">
                          {factor.isCustom ? factor.label : t(`factors.${factorId}`)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {count} {t('dashboard.days')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Day of Week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('dashboard.bestDayOfWeek')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestDayOfWeek && bestDayOfWeek.count > 0 ? (
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {t('calendar.weekDays')[bestDayOfWeek.day]}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t('dashboard.bestDayOfWeekDesc')}
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  <span>{t('dashboard.avgMoodIndex')}:</span>
                  <span className="font-semibold">{bestDayOfWeek.avgScore.toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('dashboard.noDataYet')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goal - Full Width */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('dashboard.weeklyGoal')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGoalModal(true)}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {t('dashboard.weeklyGoalProgress')}
                </span>
                <span className="text-lg font-bold text-foreground">
                  {weeklySuccess} / {weeklyGoal} {t('dashboard.days')}
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    weeklySuccess >= weeklyGoal ? 'bg-green-500' : 'bg-primary'
                  )}
                  style={{
                    width: `${Math.min((weeklySuccess / weeklyGoal) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{t('dashboard.weeklyGoalDesc')}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[3, 5, 7].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    const settings = getSettings();
                    settings.weeklyGoalDays = days;
                    localStorage.setItem('mood_journal_settings', JSON.stringify(settings));
                    setWeeklyGoal(days);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-full transition-all',
                    weeklyGoal === days
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {days} {t('dashboard.days')}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Mood Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('dashboard.recordMood')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {(Object.entries(MOOD_CONFIG) as [Mood, (typeof MOOD_CONFIG)[Mood]][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  onClick={() => todayStr && onNewEntry(todayStr, key)}
                  disabled={!todayStr}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50',
                    todayEntry?.mood === key
                      ? `${config.bgClass} ${config.ringClass} border-transparent`
                      : 'border-transparent hover:bg-accent'
                  )}
                >
                  <span className="text-3xl">{config.emoji}</span>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      todayEntry?.mood === key ? config.color : 'text-muted-foreground'
                    )}
                  >
                    {t(`mood.${key}`)}
                  </span>
                </button>
              )
            )}
          </div>
          {todayEntry && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              {t('dashboard.todayMood')} · {MOOD_CONFIG[todayEntry.mood].emoji}{' '}
              {t(`mood.${todayEntry.mood}`)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">{t('dashboard.recentEntries')}</CardTitle>
          <button
            onClick={onViewJournal}
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.noRecords')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => {
                const config = MOOD_CONFIG[entry.mood];
                const d = new Date(entry.date + 'T00:00:00');
                const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
                const plainText = entry.journal.replace(/<[^>]*>/g, '');
                const entryFactors = entry.factors
                  .map((f) => allFactors.find((o) => o.id === f))
                  .filter(Boolean);
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50',
                      config.bgClass
                    )}
                    onClick={() => onNewEntry(entry.date)}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{config.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{dateLabel}</span>
                        <span className={cn('text-xs font-medium', config.color)}>
                          {t(`mood.${entry.mood}`)}
                        </span>
                      </div>
                      {plainText && (
                        <p className="text-xs text-muted-foreground truncate">{plainText}</p>
                      )}
                      {entryFactors.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {entryFactors.slice(0, 3).map((f) => (
                            <span
                              key={f!.id}
                              className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-secondary-foreground"
                            >
                              {f!.emoji} {f!.isCustom ? f!.label : t(`factors.${f!.id}`)}
                            </span>
                          ))}
                          {entryFactors.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{entryFactors.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {entry.photos.length > 0 && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={entry.photos[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
