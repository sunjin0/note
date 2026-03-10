import { MoodEntry, MoodStats } from './types';

const STORAGE_KEY = 'mood_journal_entries';
const SETTINGS_KEY = 'mood_journal_settings';
const SECURITY_KEY = 'mood_journal_security';
const SESSION_KEY = 'mood_journal_session';

export interface AppSettings {
  encrypted: boolean;
  createdAt: string;
}

export interface SecuritySettings {
  passwordEnabled: boolean;
  passwordHash: string;
  securityQuestions: SecurityQuestion[];
  lockoutAttempts: number;
  lockoutUntil: string | null;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answerHash: string;
}

export const DEFAULT_SECURITY_QUESTIONS = [
  { id: 'q1', questionKey: 'security.questions.pet', defaultQuestion: '你童年宠物的名字是什么？' },
  { id: 'q2', questionKey: 'security.questions.school', defaultQuestion: '你小学的名字是什么？' },
  { id: 'q3', questionKey: 'security.questions.city', defaultQuestion: '你出生的城市是哪里？' },
  { id: 'q4', questionKey: 'security.questions.mother', defaultQuestion: '你母亲的娘家姓是什么？' },
  { id: 'q5', questionKey: 'security.questions.book', defaultQuestion: '你最喜欢的书是什么？' },
];

export const MIN_SECURITY_QUESTIONS = 1;
export const MAX_SECURITY_QUESTIONS = 5;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
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

export function getSecuritySettings(): SecuritySettings {
  if (typeof window === 'undefined') {
    return {
      passwordEnabled: false,
      passwordHash: '',
      securityQuestions: [],
      lockoutAttempts: 0,
      lockoutUntil: null,
    };
  }
  try {
    const data = localStorage.getItem(SECURITY_KEY);
    if (!data) {
      return {
        passwordEnabled: false,
        passwordHash: '',
        securityQuestions: [],
        lockoutAttempts: 0,
        lockoutUntil: null,
      };
    }
    return JSON.parse(data) as SecuritySettings;
  } catch {
    return {
      passwordEnabled: false,
      passwordHash: '',
      securityQuestions: [],
      lockoutAttempts: 0,
      lockoutUntil: null,
    };
  }
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SECURITY_KEY, JSON.stringify(settings));
}

export function setPassword(password: string, questions: { question: string; answer: string }[]): void {
  const security: SecuritySettings = {
    passwordEnabled: true,
    passwordHash: simpleHash(password),
    securityQuestions: questions.map(q => ({
      id: Math.random().toString(36).substr(2, 9),
      question: q.question,
      answerHash: simpleHash(q.answer.toLowerCase().trim()),
    })),
    lockoutAttempts: 0,
    lockoutUntil: null,
  };
  saveSecuritySettings(security);
}

export function disablePassword(): void {
  const settings = getSecuritySettings();
  settings.passwordEnabled = false;
  settings.passwordHash = '';
  settings.securityQuestions = [];
  settings.lockoutAttempts = 0;
  settings.lockoutUntil = null;
  saveSecuritySettings(settings);
  clearSession();
}

export function verifyPassword(password: string): boolean {
  const settings = getSecuritySettings();
  if (!settings.passwordEnabled) return true;
  
  if (settings.lockoutUntil) {
    const lockoutTime = new Date(settings.lockoutUntil).getTime();
    if (Date.now() < lockoutTime) {
      return false;
    }
    settings.lockoutUntil = null;
    settings.lockoutAttempts = 0;
  }
  
  const isValid = simpleHash(password) === settings.passwordHash;
  
  if (!isValid) {
    settings.lockoutAttempts++;
    if (settings.lockoutAttempts >= 5) {
      settings.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    }
    saveSecuritySettings(settings);
  } else {
    settings.lockoutAttempts = 0;
    settings.lockoutUntil = null;
    saveSecuritySettings(settings);
    createSession();
  }
  
  return isValid;
}

export function verifySecurityAnswers(answers: string[]): boolean {
  const settings = getSecuritySettings();
  if (!settings.passwordEnabled || settings.securityQuestions.length === 0) return false;
  
  return settings.securityQuestions.every((q, index) => {
    const answer = answers[index]?.toLowerCase().trim() || '';
    return simpleHash(answer) === q.answerHash;
  });
}

export function resetPassword(newPassword: string): void {
  const settings = getSecuritySettings();
  settings.passwordHash = simpleHash(newPassword);
  settings.lockoutAttempts = 0;
  settings.lockoutUntil = null;
  saveSecuritySettings(settings);
  createSession();
}

export function createSession(): void {
  if (typeof window === 'undefined') return;
  const session = {
    authenticated: true,
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function isSessionValid(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    if (!data) return false;
    const session = JSON.parse(data);
    return session.authenticated === true;
  } catch {
    return false;
  }
}

export function isPasswordEnabled(): boolean {
  const settings = getSecuritySettings();
  return settings.passwordEnabled;
}

export function getLockoutStatus(): { isLocked: boolean; remainingMinutes: number } {
  const settings = getSecuritySettings();
  if (!settings.lockoutUntil) return { isLocked: false, remainingMinutes: 0 };
  
  const lockoutTime = new Date(settings.lockoutUntil).getTime();
  const remaining = Math.ceil((lockoutTime - Date.now()) / (60 * 1000));
  
  if (remaining <= 0) {
    settings.lockoutUntil = null;
    settings.lockoutAttempts = 0;
    saveSecuritySettings(settings);
    return { isLocked: false, remainingMinutes: 0 };
  }
  
  return { isLocked: true, remainingMinutes: remaining };
}
