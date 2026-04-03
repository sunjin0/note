'use client';

import React from 'react';
import { ViewType, Mood, MoodEntry } from '@/types';
import { saveEntry } from '@/core/storage';
import { useEntries } from '@/core/context';
import { Sidebar } from '@/modules/common/components';
import { Dashboard } from '@/modules/dashboard';
import { CalendarView } from '@/modules/calendar';
import { JournalList, MoodEditor, SmartReminder } from '@/modules/journal';
import { Settings as SettingsView } from '@/modules/settings';

export default function Home() {
  const [currentView, setCurrentView] = React.useState<ViewType>('dashboard');
  const { entries, refreshEntries } = useEntries();
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editDate, setEditDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [initialMood, setInitialMood] = React.useState<Mood | undefined>(undefined);

  const openEditor = (date?: string, mood?: Mood) => {
    setEditDate(date || new Date().toISOString().split('T')[0]);
    setInitialMood(mood);
    setEditorOpen(true);
  };

  const handleSave = (data: {
    mood: Mood;
    journal: string;
    factors: string[];
    photos: string[];
  }) => {
    saveEntry({
      date: editDate,
      mood: data.mood,
      journal: data.journal,
      factors: data.factors,
      photos: data.photos,
    });
    refreshEntries();
  };

  const existingEntry = React.useMemo(() => {
    return entries.find((e) => e.date === editDate);
  }, [entries, editDate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Smart Reminder */}
      <SmartReminder entries={entries} onRemind={() => openEditor()} />

      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6 pt-16 lg:pt-6">
          {currentView === 'dashboard' && (
            <Dashboard
              entries={entries}
              onNewEntry={openEditor}
              onViewJournal={() => setCurrentView('journal')}
            />
          )}
          {currentView === 'calendar' && (
            <CalendarView entries={entries} onSelectDate={openEditor} />
          )}
          {currentView === 'journal' && (
            <JournalList
              entries={entries}
              onNewEntry={openEditor}
              onEditEntry={openEditor}
              onDataChange={refreshEntries}
            />
          )}
          {currentView === 'settings' && <SettingsView onDataChange={refreshEntries} />}
        </div>
      </main>

      {/* Mood Editor Modal */}
      <MoodEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        date={editDate}
        initialMood={existingEntry?.mood ?? initialMood}
        initialJournal={existingEntry?.journal}
        initialFactors={existingEntry?.factors}
        initialPhotos={existingEntry?.photos}
        onSave={handleSave}
      />
    </div>
  );
}
