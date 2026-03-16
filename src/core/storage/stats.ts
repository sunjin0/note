/**
 * 统计数据管理
 * 提供心情统计、连续记录天数等统计功能
 */

import { MoodStats } from '@/types';
import { getEntries } from './entries';

/**
 * 获取连续记录天数
 * 计算从今天往前连续有记录的天数
 * @returns 连续记录天数，如果没有记录则返回 0
 * @remarks 最多计算 365 天
 */
export function getStreak(): number {
  const entries = getEntries();
  if (entries.length === 0) return 0;

  const dates = new Set(entries.map(e => e.date));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * 获取心情统计
 * 统计各种心情类型的出现次数
 * @returns 心情统计对象，包含每种心情的计数
 */
export function getMoodStats(): MoodStats {
  const entries = getEntries();
  const stats: MoodStats = { great: 0, good: 0, okay: 0, sad: 0, angry: 0 };
  entries.forEach(e => { stats[e.mood] = (stats[e.mood] || 0) + 1; });
  return stats;
}

/**
 * 获取总记录数
 * @returns 日记条目总数
 */
export function getTotalEntries(): number {
  return getEntries().length;
}

/**
 * 获取最近记录日期
 * @returns 最近记录的日期字符串，如果没有记录则返回 null
 */
export function getLastEntryDate(): string | null {
  const entries = getEntries();
  if (entries.length === 0) return null;
  return entries[0].date;
}

/**
 * 获取最早记录日期
 * @returns 最早记录的日期字符串，如果没有记录则返回 null
 */
export function getFirstEntryDate(): string | null {
  const entries = getEntries();
  if (entries.length === 0) return null;
  return entries[entries.length - 1].date;
}

/**
 * 获取本月记录数
 * @returns 当前月份的日记条目数
 */
export function getCurrentMonthEntries(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return getEntries().filter(e => e.date.startsWith(prefix)).length;
}

/**
 * 获取本周记录数
 * @returns 当前周的日记条目数
 */
export function getCurrentWeekEntries(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  return getEntries().filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= monday;
  }).length;
}
