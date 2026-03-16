/**
 * 日记模板配置
 * 提供预设模板、自定义模板管理功能
 */
import { JournalTemplate, CustomTemplate, TemplateCategory } from '@/types';

// Preset journal templates
export const PRESET_TEMPLATES: JournalTemplate[] = [
  // Work templates
  {
    id: 'work-daily',
    category: 'work',
    titleKey: 'templates.work.daily.title',
    contentKey: 'templates.work.daily.content',
  },
  {
    id: 'work-challenge',
    category: 'work',
    titleKey: 'templates.work.challenge.title',
    contentKey: 'templates.work.challenge.content',
  },
  {
    id: 'work-summary',
    category: 'work',
    titleKey: 'templates.work.summary.title',
    contentKey: 'templates.work.summary.content',
  },
  
  // Study templates
  {
    id: 'study-daily',
    category: 'study',
    titleKey: 'templates.study.daily.title',
    contentKey: 'templates.study.daily.content',
  },
  {
    id: 'study-review',
    category: 'study',
    titleKey: 'templates.study.review.title',
    contentKey: 'templates.study.review.content',
  },
  {
    id: 'study-exam',
    category: 'study',
    titleKey: 'templates.study.exam.title',
    contentKey: 'templates.study.exam.content',
  },
  
  // Travel templates
  {
    id: 'travel-daily',
    category: 'travel',
    titleKey: 'templates.travel.daily.title',
    contentKey: 'templates.travel.daily.content',
  },
  {
    id: 'travel-sightseeing',
    category: 'travel',
    titleKey: 'templates.travel.sightseeing.title',
    contentKey: 'templates.travel.sightseeing.content',
  },
  {
    id: 'travel-food',
    category: 'travel',
    titleKey: 'templates.travel.food.title',
    contentKey: 'templates.travel.food.content',
  },
  
  // Health templates
  {
    id: 'health-daily',
    category: 'health',
    titleKey: 'templates.health.daily.title',
    contentKey: 'templates.health.daily.content',
  },
  {
    id: 'health-exercise',
    category: 'health',
    titleKey: 'templates.health.exercise.title',
    contentKey: 'templates.health.exercise.content',
  },
  {
    id: 'health-diet',
    category: 'health',
    titleKey: 'templates.health.diet.title',
    contentKey: 'templates.health.diet.content',
  },
  {
    id: 'health-sleep',
    category: 'health',
    titleKey: 'templates.health.sleep.title',
    contentKey: 'templates.health.sleep.content',
  },
  
  // Life templates
  {
    id: 'life-gratitude',
    category: 'life',
    titleKey: 'templates.life.gratitude.title',
    contentKey: 'templates.life.gratitude.content',
  },
  {
    id: 'life-reflection',
    category: 'life',
    titleKey: 'templates.life.reflection.title',
    contentKey: 'templates.life.reflection.content',
  },
  {
    id: 'life-weekend',
    category: 'life',
    titleKey: 'templates.life.weekend.title',
    contentKey: 'templates.life.weekend.content',
  },
  {
    id: 'life-social',
    category: 'life',
    titleKey: 'templates.life.social.title',
    contentKey: 'templates.life.social.content',
  },
];

// Category order for display
export const TEMPLATE_CATEGORY_ORDER: Exclude<TemplateCategory, 'favorites' | 'recent'>[] = [
  'work',
  'study',
  'travel',
  'health',
  'life',
  'custom',
];

// Category icons
export const CATEGORY_ICONS: Record<Exclude<TemplateCategory, 'favorites' | 'recent'>, string> = {
  work: '💼',
  study: '📚',
  travel: '✈️',
  health: '💪',
  life: '🌟',
  custom: '✨',
};

// Storage keys
const CUSTOM_TEMPLATES_KEY = 'mood_journal_custom_templates';
const FAVORITE_TEMPLATES_KEY = 'mood_journal_favorite_templates';
const RECENT_TEMPLATES_KEY = 'mood_journal_recent_templates';
const MAX_RECENT_TEMPLATES = 5;

// Get all templates (preset + custom)
export function getAllTemplates(): JournalTemplate[] {
  const customTemplates = getCustomTemplates();
  return [...PRESET_TEMPLATES, ...customTemplates];
}

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): JournalTemplate[] {
  if (category === 'favorites') {
    return getFavoriteTemplates();
  }
  if (category === 'recent') {
    return getRecentTemplates();
  }
  if (category === 'custom') {
    // 自定义分类显示所有 isCustom 为 true 的模板
    return getCustomTemplates();
  }
  const allTemplates = getAllTemplates();
  // 普通分类显示该分类下的预设模板和自定义模板
  return allTemplates.filter(t => t.category === category);
}

// Get custom templates
export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

// Save custom template
export function saveCustomTemplate(template: Omit<CustomTemplate, 'id' | 'createdAt' | 'isCustom'>): CustomTemplate {
  const templates = getCustomTemplates();
  const newTemplate: CustomTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  return newTemplate;
}

// Delete custom template
export function deleteCustomTemplate(templateId: string): boolean {
  const templates = getCustomTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  if (filtered.length !== templates.length) {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
    // Also remove from favorites and recent
    removeFromFavorites(templateId);
    removeFromRecent(templateId);
    return true;
  }
  return false;
}

// Get favorite template IDs
export function getFavoriteTemplateIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITE_TEMPLATES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

// Get favorite templates
export function getFavoriteTemplates(): JournalTemplate[] {
  const favoriteIds = getFavoriteTemplateIds();
  const allTemplates = getAllTemplates();
  return favoriteIds
    .map(id => allTemplates.find(t => t.id === id))
    .filter((t): t is JournalTemplate => t !== undefined);
}

// Add to favorites
export function addToFavorites(templateId: string): void {
  const favorites = getFavoriteTemplateIds();
  if (!favorites.includes(templateId)) {
    favorites.push(templateId);
    localStorage.setItem(FAVORITE_TEMPLATES_KEY, JSON.stringify(favorites));
  }
}

// Remove from favorites
export function removeFromFavorites(templateId: string): void {
  const favorites = getFavoriteTemplateIds();
  const filtered = favorites.filter(id => id !== templateId);
  localStorage.setItem(FAVORITE_TEMPLATES_KEY, JSON.stringify(filtered));
}

// Toggle favorite status
export function toggleFavorite(templateId: string): boolean {
  const favorites = getFavoriteTemplateIds();
  if (favorites.includes(templateId)) {
    removeFromFavorites(templateId);
    return false;
  } else {
    addToFavorites(templateId);
    return true;
  }
}

// Check if template is favorite
export function isFavorite(templateId: string): boolean {
  return getFavoriteTemplateIds().includes(templateId);
}

// Get recent template IDs
export function getRecentTemplateIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_TEMPLATES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

// Get recent templates
export function getRecentTemplates(): JournalTemplate[] {
  const recentIds = getRecentTemplateIds();
  const allTemplates = getAllTemplates();
  return recentIds
    .map(id => allTemplates.find(t => t.id === id))
    .filter((t): t is JournalTemplate => t !== undefined);
}

// Add to recent templates
export function addToRecent(templateId: string): void {
  let recent = getRecentTemplateIds();
  // Remove if already exists
  recent = recent.filter(id => id !== templateId);
  // Add to beginning
  recent.unshift(templateId);
  // Keep only max number
  recent = recent.slice(0, MAX_RECENT_TEMPLATES);
  localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(recent));
}

// Remove from recent
export function removeFromRecent(templateId: string): void {
  const recent = getRecentTemplateIds();
  const filtered = recent.filter(id => id !== templateId);
  localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(filtered));
}

// Process template content with variable replacement
export function processTemplateContent(content: string, date: string): string {
  const dt = new Date(date + 'T00:00:00');
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdaysZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  
  return content
    .replace(/\{\{date\}\}/g, date)
    .replace(/\{\{year\}\}/g, String(dt.getFullYear()))
    .replace(/\{\{month\}\}/g, String(dt.getMonth() + 1))
    .replace(/\{\{day\}\}/g, String(dt.getDate()))
    .replace(/\{\{weekday\}\}/g, weekdays[dt.getDay()])
    .replace(/\{\{weekdayZh\}\}/g, weekdaysZh[dt.getDay()]);
}
