import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getEntries,
  saveEntry,
  deleteEntry,
  getEntryByDate,
  getEntriesForMonth,
  getSettings,
  saveSettings,
  getStreak,
  getMoodStats,
  clearAllData,
  AppSettings,
} from '../storage'
import { MoodEntry } from '../types'

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('getEntries', () => {
    it('should return empty array when no entries exist', () => {
      const entries = getEntries()
      expect(entries).toEqual([])
    })

    it('should return parsed entries from localStorage', () => {
      const mockEntries: MoodEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          mood: 'great',
          journal: 'Great day!',
          factors: ['work', 'exercise'],
          photos: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      localStorage.setItem('mood_journal_entries', JSON.stringify(mockEntries))
      const entries = getEntries()
      // decryptEntry adds journalEncrypted: false field
      expect(entries).toEqual(mockEntries.map(e => ({ ...e, journalEncrypted: false })))
    })
  })

  describe('saveEntry', () => {
    it('should save new entry to localStorage', () => {
      const entry = saveEntry({
        date: '2024-01-01',
        mood: 'good',
        journal: 'Good day',
        factors: ['family'],
        photos: [],
      })
      expect(entry.mood).toBe('good')
      expect(entry.id).toBeDefined()
      
      const entries = getEntries()
      expect(entries).toHaveLength(1)
      expect(entries[0].mood).toBe('good')
    })

    it('should update existing entry', () => {
      saveEntry({
        date: '2024-01-01',
        mood: 'okay',
        journal: 'Okay day',
        factors: [],
        photos: [],
      })
      
      const updatedEntry = saveEntry({
        date: '2024-01-01',
        mood: 'great',
        journal: 'Actually great!',
        factors: [],
        photos: [],
      })
      
      expect(updatedEntry.mood).toBe('great')
      
      const entries = getEntries()
      expect(entries).toHaveLength(1)
      expect(entries[0].mood).toBe('great')
    })
  })

  describe('deleteEntry', () => {
    it('should remove entry by id', () => {
      const entry = saveEntry({
        date: '2024-01-01',
        mood: 'sad',
        journal: 'Sad day',
        factors: [],
        photos: [],
      })
      
      expect(getEntries()).toHaveLength(1)
      
      const result = deleteEntry(entry.id)
      expect(result).toBe(true)
      expect(getEntries()).toHaveLength(0)
    })

    it('should return false when entry not found', () => {
      const result = deleteEntry('non-existent-id')
      expect(result).toBe(false)
    })
  })

  describe('getEntryByDate', () => {
    it('should return entry for specific date', () => {
      saveEntry({
        date: '2024-01-15',
        mood: 'great',
        journal: 'Test',
        factors: [],
        photos: [],
      })
      
      const found = getEntryByDate('2024-01-15')
      expect(found).toBeDefined()
      expect(found?.mood).toBe('great')
    })

    it('should return undefined for non-existent date', () => {
      const found = getEntryByDate('2024-12-31')
      expect(found).toBeUndefined()
    })
  })

  describe('getEntriesForMonth', () => {
    it('should return entries for specific month', () => {
      saveEntry({ date: '2024-01-01', mood: 'great', journal: '', factors: [], photos: [] })
      saveEntry({ date: '2024-01-15', mood: 'good', journal: '', factors: [], photos: [] })
      saveEntry({ date: '2024-02-01', mood: 'okay', journal: '', factors: [], photos: [] })
      
      const januaryEntries = getEntriesForMonth(2024, 0)
      expect(januaryEntries).toHaveLength(2)
    })
  })

  describe('getSettings and saveSettings', () => {
    it('should return default settings', () => {
      const settings = getSettings()
      expect(settings.encrypted).toBe(false)
      expect(settings.createdAt).toBeDefined()
    })

    it('should save and retrieve settings', () => {
      const newSettings: AppSettings = { encrypted: true, createdAt: '2024-01-01T00:00:00.000Z' }
      saveSettings(newSettings)
      
      const settings = getSettings()
      expect(settings.encrypted).toBe(true)
      expect(settings.createdAt).toBe('2024-01-01T00:00:00.000Z')
    })
  })

  describe('getStreak', () => {
    it('should calculate consecutive days streak', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      saveEntry({
        date: today.toISOString().split('T')[0],
        mood: 'great',
        journal: '',
        factors: [],
        photos: [],
      })
      
      saveEntry({
        date: yesterday.toISOString().split('T')[0],
        mood: 'good',
        journal: '',
        factors: [],
        photos: [],
      })
      
      const streak = getStreak()
      expect(streak).toBeGreaterThanOrEqual(2)
    })

    it('should return 0 when no entries', () => {
      const streak = getStreak()
      expect(streak).toBe(0)
    })
  })

  describe('getMoodStats', () => {
    it('should count moods correctly', () => {
      saveEntry({ date: '2024-01-01', mood: 'great', journal: '', factors: [], photos: [] })
      saveEntry({ date: '2024-01-02', mood: 'great', journal: '', factors: [], photos: [] })
      saveEntry({ date: '2024-01-03', mood: 'sad', journal: '', factors: [], photos: [] })
      
      const stats = getMoodStats()
      expect(stats.great).toBe(2)
      expect(stats.sad).toBe(1)
      expect(stats.good).toBe(0)
    })
  })

  describe('clearAllData', () => {
    it('should remove all data from localStorage', () => {
      saveEntry({ date: '2024-01-01', mood: 'angry', journal: 'Angry day', factors: [], photos: [] })
      saveSettings({ encrypted: true, createdAt: '2024-01-01T00:00:00.000Z' })
      
      expect(getEntries()).toHaveLength(1)
      
      clearAllData()
      
      expect(getEntries()).toEqual([])
      expect(getSettings().encrypted).toBe(false)
    })
  })
})
