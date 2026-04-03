'use client';

import React, { useState } from 'react';
import { cn } from '@/core/utils';
import { useTranslation } from '@/core/i18n';
import { Button } from '@/core/ui/button';
import type { MoodEntry } from '@/types';
import {removeConflict, resolveConflict} from '@/core/storage';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export interface ConflictEntry {
  id: string;
  clientUpdatedAt: string;
  serverUpdatedAt: string;
  clientEntry: MoodEntry;
  serverEntry: MoodEntry;
  autoResolution: 'server' | 'client';
}

interface ConflictResolutionProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictEntry[];
  onResolved: () => void;
}

export default function ConflictResolution({
  isOpen,
  onClose,
  conflicts,
  onResolved,
}: ConflictResolutionProps) {
  const { t } = useTranslation();
  const [selectedResolution, setSelectedResolution] = useState<Record<string, 'server' | 'client'>>({});
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || conflicts.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString() + ' ' + date.toLocaleTimeString();
  };

  const handleResolve = async (conflictId: string) => {
    const resolution = selectedResolution[conflictId] || 'server';
    const conflict = conflicts.find(c => c.id === conflictId);
    
    if (!conflict) return;

    setResolving(conflictId);
    setError(null);

    try {
      const entry = resolution === 'client' ? conflict.clientEntry : conflict.serverEntry;
      const result = await resolveConflict(conflictId, resolution, entry);
      
      if (result.success) {
        onResolved();
        removeConflict(conflictId);
      } else {
        setError(result.error || t('sync.resolveFailed'));
      }
    } finally {
      setResolving(null);
    }
  };


  const handleResolveAll = async () => {
    for (const conflict of conflicts) {
      await handleResolve(conflict.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-2xl animate-in fade-in duration-200">
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-foreground">
              {t('sync.conflictTitle', { count: conflicts.length })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            {t('sync.conflictDescription')}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="border border-border rounded-xl overflow-hidden"
              >
                <div className="bg-muted/30 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{conflict.clientEntry.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t('sync.autoResolved')}: {t(`sync.${conflict.autoResolution}`)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        selectedResolution[conflict.id] === 'client' ? 'bg-primary' : 'bg-muted-foreground/30'
                      )} />
                      <span className="text-sm font-medium text-foreground">
                        {t('sync.yourVersion')}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(conflict.clientUpdatedAt)}
                      </span>
                    </div>
                    <div
                      onClick={() => setSelectedResolution(prev => ({ ...prev, [conflict.id]: 'client' }))}
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-colors',
                        selectedResolution[conflict.id] === 'client'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <EntryPreview entry={conflict.clientEntry} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        selectedResolution[conflict.id] === 'server' ? 'bg-primary' : 'bg-muted-foreground/30'
                      )} />
                      <span className="text-sm font-medium text-foreground">
                        {t('sync.serverVersion')}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(conflict.serverUpdatedAt)}
                      </span>
                    </div>
                    <div
                      onClick={() => setSelectedResolution(prev => ({ ...prev, [conflict.id]: 'server' }))}
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-colors',
                        selectedResolution[conflict.id] === 'server'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <EntryPreview entry={conflict.serverEntry} />
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict.id)}
                    disabled={resolving === conflict.id}
                  >
                    {resolving === conflict.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    {t('sync.resolveThis')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 bg-background border-t border-border p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleResolveAll} disabled={resolving !== null}>
            {resolving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            {t('sync.resolveAll', { count: conflicts.length })}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EntryPreview({ entry }: { entry: MoodEntry }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          typeof entry.mood === 'number' && entry.mood >= 4 ? 'bg-green-100 text-green-700' :
          typeof entry.mood === 'number' && entry.mood >= 3 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        )}>
          {t('mood.value', { value: typeof entry.mood === 'number' ? entry.mood : entry.mood })}
        </span>
      </div>
      
      {entry.factors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.factors.map(factor => (
            <span key={factor} className="px-2 py-0.5 bg-secondary rounded text-xs text-secondary-foreground">
              {factor}
            </span>
          ))}
        </div>
      )}
      
      {entry.journal && (
        <p className="text-muted-foreground line-clamp-3 text-xs">
          {entry.journal.substring(0, 100)}
          {entry.journal.length > 100 && '...'}
        </p>
      )}
      
      {entry.photos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('sync.photosCount', { count: entry.photos.length })}
        </p>
      )}
    </div>
  );
}
