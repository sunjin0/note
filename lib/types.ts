export type Mood = 'great' | 'good' | 'okay' | 'sad' | 'angry';

export interface MoodEntry {
  id: string;
  date: string;
  mood: Mood;
  journal: string;
  factors: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
  journalEncrypted?: boolean;
}

export type ViewType = 'dashboard' | 'calendar' | 'journal' | 'settings';

export interface MoodStats {
  great: number;
  good: number;
  okay: number;
  sad: number;
  angry: number;
}

export interface FactorOption {
  id: string;
  label: string;
  emoji: string;
  isCustom?: boolean;
}

// Journal Template Types
export type TemplateCategory = 'work' | 'study' | 'travel' | 'health' | 'life' | 'custom' | 'favorites' | 'recent';

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

export interface CustomTemplate extends JournalTemplate {
  isCustom: true;
  createdAt: string;
}
