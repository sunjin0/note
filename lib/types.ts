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
