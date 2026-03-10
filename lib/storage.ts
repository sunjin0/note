import { MoodEntry, MoodStats } from './types';

const STORAGE_KEY = 'mood_journal_entries';
const SETTINGS_KEY = 'mood_journal_settings';

export interface AppSettings {
  encrypted: boolean;
  createdAt: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getEntries(): MoodEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const entries = JSON.parse(data) as MoodEntry[];
    // Sort by date descending (newest first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

export function saveEntry(entry: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt'>): MoodEntry {
  const entries = getEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const updated: MoodEntry = {
      ...entries[existingIndex],
      ...entry,
      updatedAt: now,
    };
    entries[existingIndex] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return updated;
  }

  const newEntry: MoodEntry = {
    ...entry,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  entries.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return newEntry;
}

export function updateEntry(id: string, updates: Partial<MoodEntry>): MoodEntry | null {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index < 0) return null;

  const updated: MoodEntry = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  entries[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return updated;
}

export function deleteEntry(id: string): boolean {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getEntryByDate(date: string): MoodEntry | undefined {
  return getEntries().find(e => e.date === date);
}

export function getEntriesForMonth(year: number, month: number): MoodEntry[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return getEntries().filter(e => e.date.startsWith(prefix));
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return { encrypted: false, createdAt: new Date().toISOString() };
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { encrypted: false, createdAt: new Date().toISOString() };
    return JSON.parse(data) as AppSettings;
  } catch {
    return { encrypted: false, createdAt: new Date().toISOString() };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportData(): string {
  const entries = getEntries();
  const settings = getSettings();
  return JSON.stringify({ entries, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

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

export function getMoodStats(): MoodStats {
  const entries = getEntries();
  const stats: MoodStats = { great: 0, good: 0, okay: 0, sad: 0, angry: 0 };
  entries.forEach(e => { stats[e.mood] = (stats[e.mood] || 0) + 1; });
  return stats;
}
