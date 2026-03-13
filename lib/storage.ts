import { MoodEntry, MoodStats, FactorOption } from './types';

const STORAGE_KEY = 'mood_journal_entries';
const SETTINGS_KEY = 'mood_journal_settings';
const SECURITY_KEY = 'mood_journal_security';
const SESSION_KEY = 'mood_journal_session';
const CUSTOM_FACTORS_KEY = 'mood_journal_custom_factors';

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

// Simple XOR encryption for diary content
function getEncryptionKey(): string {
  const security = getSecuritySettings();
  return security.passwordHash || 'default-key';
}

// Convert string to Uint8Array using TextEncoder
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string using TextDecoder
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// Convert Uint8Array to Base64 string
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

// Convert Base64 string to Uint8Array
function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
}

// XOR encrypt/decrypt bytes with key
function xorBytes(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = stringToBytes(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

function encryptData(data: string): string {
  const key = getEncryptionKey();
  // Convert string to bytes (UTF-8), XOR encrypt, then encode to Base64
  const dataBytes = stringToBytes(data);
  const encryptedBytes = xorBytes(dataBytes, key);
  return bytesToBase64(encryptedBytes);
}

function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    // Decode Base64, XOR decrypt, then convert bytes to string (UTF-8)
    const encryptedBytes = base64ToBytes(encryptedData);
    const decryptedBytes = xorBytes(encryptedBytes, key);
    return bytesToString(decryptedBytes);
  } catch {
    return encryptedData;
  }
}

function encryptEntry(entry: MoodEntry): MoodEntry {
  return {
    ...entry,
    journal: encryptData(entry.journal),
    journalEncrypted: true,
  };
}

function decryptEntry(entry: MoodEntry): MoodEntry {
  return {
    ...entry,
    journal: decryptData(entry.journal),
    journalEncrypted: false,
  };
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
    // Decrypt entries and sort by date descending (newest first)
    return entries
      .map(decryptEntry)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const encryptedUpdated = encryptEntry(updated);
    entries[existingIndex] = encryptedUpdated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return updated;
  }

  const newEntry: MoodEntry = {
    ...entry,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const encryptedNewEntry = encryptEntry(newEntry);
  entries.unshift(encryptedNewEntry);
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
  const encryptedUpdated = encryptEntry(updated);
  entries[index] = encryptedUpdated;
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
  const securitySettings = getSecuritySettings();
  return JSON.stringify({ entries, settings, securitySettings, exportedAt: new Date().toISOString() }, null, 2);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(SECURITY_KEY);
  clearSession();
}

export function reEncryptAllEntries(enableEncryption: boolean, onProgress?: (current: number, total: number) => void): void {
  if (typeof window === 'undefined') return;
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  
  try {
    const entries = JSON.parse(data) as MoodEntry[];
    const total = entries.length;
    
    const processedEntries = entries.map((entry, index) => {
      if (onProgress) {
        onProgress(index + 1, total);
      }
      
      if (enableEncryption) {
        // Encrypt if not already encrypted
        if (!entry.journalEncrypted) {
          return encryptEntry(entry);
        }
      } else {
        // Decrypt if encrypted
        if (entry.journalEncrypted) {
          return decryptEntry(entry);
        }
      }
      return entry;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processedEntries));
  } catch (error) {
    console.error('Failed to re-encrypt entries:', error);
    throw error;
  }
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

// Custom Factors Management
export function getCustomFactors(): FactorOption[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CUSTOM_FACTORS_KEY);
    if (!data) return [];
    return JSON.parse(data) as FactorOption[];
  } catch {
    return [];
  }
}

export function saveCustomFactors(factors: FactorOption[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_FACTORS_KEY, JSON.stringify(factors));
}

export function addCustomFactor(factor: Omit<FactorOption, 'isCustom'>): FactorOption {
  const customFactors = getCustomFactors();
  const newFactor: FactorOption = {
    ...factor,
    isCustom: true,
  };
  customFactors.push(newFactor);
  saveCustomFactors(customFactors);
  return newFactor;
}

export function updateCustomFactor(id: string, updates: Partial<FactorOption>): FactorOption | null {
  const customFactors = getCustomFactors();
  const index = customFactors.findIndex(f => f.id === id);
  if (index < 0) return null;
  
  customFactors[index] = { ...customFactors[index], ...updates };
  saveCustomFactors(customFactors);
  return customFactors[index];
}

export function deleteCustomFactor(id: string): boolean {
  const customFactors = getCustomFactors();
  const filtered = customFactors.filter(f => f.id !== id);
  if (filtered.length === customFactors.length) return false;
  saveCustomFactors(filtered);
  return true;
}

export function reorderCustomFactors(factors: FactorOption[]): void {
  saveCustomFactors(factors);
}

// Get all factors (preset + custom)
export function getAllFactors(): FactorOption[] {
  const { FACTOR_OPTIONS } = require('./types');
  const customFactors = getCustomFactors();
  return [...FACTOR_OPTIONS, ...customFactors];
}
