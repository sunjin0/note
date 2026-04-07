/**
 * 统计数据管理
 * 提供心情统计、连续记录天数、统计功能
 */

import { MoodStats, Mood, MoodEntry } from '@/types';
import { getEntries } from './entries';
import { getSettings } from './settings';

const moodToScore: Record<Mood, number> = {
  great: 5,
  good: 4,
  okay: 3,
  sad: 2,
  angry: 1,
};

/**
 * 获取连续记录天数
 */
export function getStreak(): number {
  const entries = getEntries();
  if (entries.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (entries.find((e) => e.date === dateStr && !e.deletedAt)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 获取心情统计
 */
export function getMoodStats(): MoodStats {
  const entries = getEntries().filter((e) => !e.deletedAt);
  const stats: MoodStats = { great: 0, good: 0, okay: 0, sad: 0, angry: 0 };

  entries.forEach((entry) => {
    stats[entry.mood]++;
  });

  return stats;
}

/**
 * 获取总记录数
 */
export function getTotalEntries(): number {
  return getEntries().filter((e) => !e.deletedAt).length;
}

/**
 * 获取本周记录数
 */
export function getCurrentWeekEntries(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const entries = getEntries().filter((e) => {
    const entryDate = new Date(e.date);
    return entryDate >= monday && !e.deletedAt;
  });

  return entries.length;
}

/**
 * 获取本周积极心情达标天数
 */
export function getThisWeekSuccess(): number {
  const settings = getSettings();
  const weeklyGoal = settings.weeklyGoalDays || 5;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const weekEntries = getEntries().filter((e) => {
    const entryDate = new Date(e.date);
    return entryDate >= monday && !e.deletedAt;
  });

  if (weekEntries.length === 0) return 0;

  const successCount = weekEntries.filter((e) => {
    const score = moodToScore[e.mood];
    return score >= 4;
  }).length;

  return successCount;
}

/**
 * 获取最常出现的因素
 */
export function getMostCommonFactor(): { factor: string; count: number } | null {
  const entries = getEntries().filter((e) => !e.deletedAt);

  if (entries.length === 0) return null;

  const factorCounts: Record<string, number> = {};

  entries.forEach((entry) => {
    entry.factors.forEach((factor) => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });
  });

  const sortedFactors = Object.entries(factorCounts).sort((a, b) => b[1] - a[1]);

  if (sortedFactors.length === 0) return null;

  return {
    factor: sortedFactors[0][0],
    count: sortedFactors[0][1],
  };
}

/**
 * 获取平均心情指数 (1-5)
 */
export function getAverageMoodScore(): number {
  const entries = getEntries().filter((e) => !e.deletedAt);

  if (entries.length === 0) return 0;

  const totalScore = entries.reduce((sum, entry) => {
    return sum + moodToScore[entry.mood];
  }, 0);

  return Math.round((totalScore / entries.length) * 10) / 10;
}

/**
 * 获取周几心情最好
 */
export function getBestDayOfWeek(): { day: number; avgScore: number } | null {
  const entries = getEntries().filter((e) => !e.deletedAt);

  if (entries.length === 0) return null;

  const dayScores: Record<number, number[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  entries.forEach((entry) => {
    const day = new Date(entry.date).getDay();
    dayScores[day].push(moodToScore[entry.mood]);
  });

  const dayAverages: Array<{ day: number; avgScore: number }> = [];

  for (let day = 0; day < 7; day++) {
    if (dayScores[day].length > 0) {
      const avg = dayScores[day].reduce((a, b) => a + b, 0) / dayScores[day].length;
      dayAverages.push({ day, avgScore: avg });
    }
  }

  if (dayAverages.length === 0) return null;

  dayAverages.sort((a, b) => b.avgScore - a.avgScore);

  return dayAverages[0];
}
