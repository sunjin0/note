'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoodEntry, MOOD_CONFIG, FACTOR_OPTIONS } from '@/lib/types';
import { deleteEntry } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n';
import { Search, Plus, Trash2, Edit3, X, Image as ImageIcon } from 'lucide-react';

interface JournalListProps {
  entries: MoodEntry[];
  onNewEntry: (date?: string) => void;
  onEditEntry: (date: string) => void;
  onDataChange: () => void;
}

export default function JournalList({ entries, onNewEntry, onEditEntry, onDataChange }: JournalListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e => {
      const plainText = e.journal.replace(/<[^>]*>/g, '').toLowerCase();
      const moodLabel = MOOD_CONFIG[e.mood].label;
      const factorLabels = e.factors.map(f => FACTOR_OPTIONS.find(o => o.id === f)?.label || '').join(' ');
      return plainText.includes(q) || moodLabel.includes(q) || factorLabels.includes(q) || e.date.includes(q);
    });
  }, [entries, search]);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setConfirmDelete(null);
    setExpandedId(null);
    onDataChange();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
    if (dateStr === today) return t('journal.today');
    if (dateStr === yesterday) return t('journal.yesterday');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const weekDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const weekDays = t('calendar.weekDays', {}) as unknown as string[];
    return weekDays[d.getDay()];
  };



  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('journal.title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('journal.recordCount', { count: entries.length })}</p>
        </div>
        <Button onClick={() => onNewEntry()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('journal.newEntry')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('journal.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-3xl mb-2">📖</p>
            <p className="text-sm text-muted-foreground">
              {search ? t('journal.noResults') : t('journal.noEntries')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => {
            const config = MOOD_CONFIG[entry.mood];
            const plainText = entry.journal.replace(/<[^>]*>/g, '');
            const isExpanded = expandedId === entry.id;
            const entryFactors = entry.factors.map(f => FACTOR_OPTIONS.find(o => o.id === f)).filter(Boolean);

            return (
              <Card
                key={entry.id}
                className={cn('cursor-pointer transition-all duration-200', isExpanded && 'shadow-elevated')}
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Mood emoji */}
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', config.bgClass)}>
                      <span className="text-xl">{config.emoji}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Date and mood */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{formatDate(entry.date)}</span>
                        <span className="text-xs text-muted-foreground">{weekDay(entry.date)}</span>
                        <span className={cn('text-xs font-medium', config.color)}>{t(`mood.${entry.mood}`)}</span>

                      </div>

                      {/* Content preview or full */}
                      {plainText && (
                        isExpanded ? (
                          <div
                            className="text-sm text-foreground leading-relaxed mb-2 prose-sm"
                            dangerouslySetInnerHTML={{ __html: entry.journal }}
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground truncate">{plainText}</p>
                        )
                      )}

                      {/* Factors */}
                      {entryFactors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entryFactors.map(f => (
                            <span key={f!.id} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                              {f!.emoji} {t(`factors.${f!.id}`)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Photos */}
                      {isExpanded && entry.photos.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {entry.photos.map((p, i) => (
                            <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                              <img src={p} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      {isExpanded && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onEditEntry(entry.date); }}
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                            {t('journal.edit')}
                          </Button>
                          {confirmDelete === entry.id ? (
                            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(entry.id)}>
                                {t('journal.confirmDelete')}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
                                {t('journal.cancel')}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete(entry.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              {t('journal.delete')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Photo indicator */}
                    {!isExpanded && entry.photos.length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="text-[10px]">{entry.photos.length}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
