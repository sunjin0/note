/**
 * 全局类型定义
 * 包含应用中使用的基础类型和接口
 */

// 心情类型 (1-5)
export type Mood = number;

// 日记条目接口
export interface MoodEntry {
  id: string;
  date: string;
  mood: Mood; // 1-5
  journal: string;
  factors: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  contentHash?: string;
  journalEncrypted?: boolean;
}

// 视图类型
export type ViewType = 'dashboard' | 'calendar' | 'journal' | 'settings';

// 心情统计接口
export interface MoodStats {
  great: number;
  good: number;
  okay: number;
  sad: number;
  angry: number;
}

// 因素选项接口
export interface FactorOption {
  id: string;
  label: string;
  emoji: string;
  isCustom?: boolean;
}

// 模板分类类型
export type TemplateCategory =
  | 'work'
  | 'study'
  | 'travel'
  | 'health'
  | 'life'
  | 'custom'
  | 'favorites'
  | 'recent';

// 日记模板接口
export interface JournalTemplate {
  id: string;
  category: Exclude<TemplateCategory, 'favorites' | 'recent'>;
  titleKey: string; // i18n key for title
  contentKey: string; // i18n key for content
  title?: string; // Actual title (resolved from i18n)
  content?: string; // Actual content (resolved from i18n)
  isCustom?: boolean;
  createdAt?: string;
}

// 自定义模板接口
export interface CustomTemplate extends JournalTemplate {
  isCustom: true;
  createdAt: string;
}
