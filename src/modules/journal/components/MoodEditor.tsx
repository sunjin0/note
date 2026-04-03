'use client';

import React from 'react';
import { cn } from '@/core/utils';
import { Mood, FactorOption } from '@/types';
import { MOOD_CONFIG, FACTOR_OPTIONS } from '@/core/config/mood';
import { getCustomFactors } from '@/core/storage';
import { useTranslation } from '@/core/i18n';
import { X, Camera, ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react';
import { Button } from '@/core/ui/button';
import TemplatePicker from '@/modules/journal/components/TemplatePicker';
import RichTextEditor from '@/modules/journal/components/RichTextEditor';

interface MoodEditorProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  initialMood?: Mood;
  initialJournal?: string;
  initialFactors?: string[];
  initialPhotos?: string[];
  onSave: (data: { mood: Mood; journal: string; factors: string[]; photos: string[] }) => void;
}

export default function MoodEditor({
  isOpen,
  onClose,
  date,
  initialMood,
  initialJournal = '',
  initialFactors = [],
  initialPhotos = [],
  onSave,
}: MoodEditorProps) {
  const { t } = useTranslation();
  const [mood, setMood] = React.useState<Mood | undefined>(initialMood);
  const [journal, setJournal] = React.useState(initialJournal ?? '');
  const [factors, setFactors] = React.useState<string[]>(initialFactors ?? []);
  const [photos, setPhotos] = React.useState<string[]>(initialPhotos ?? []);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const [charCount, setCharCount] = React.useState(0);
  const [draftSavedAt, setDraftSavedAt] = React.useState<string | null>(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = React.useState(false);
  const MAX_CHARS = 5000;
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [allFactors, setAllFactors] = React.useState<FactorOption[]>(FACTOR_OPTIONS);

  React.useEffect(() => {
    if (isOpen) {
      const customFactors = getCustomFactors();
      setAllFactors([...FACTOR_OPTIONS, ...customFactors]);

      setMood(initialMood);
      setJournal(initialJournal ?? '');
      setFactors(initialFactors ?? []);
      setPhotos(initialPhotos ?? []);
    }
  }, [isOpen, date]);

  const toggleFactor = (id: string) => {
    setFactors((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const maxSize = 1920;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const compressingFiles = Array.from(files);

    for (const file of compressingFiles) {
      try {
        if (file.size < 500 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              setPhotos((prev) => [...prev, ev.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          const compressed = await compressImage(file);
          setPhotos((prev) => [...prev, compressed]);
        }
      } catch (error) {
        console.error('Image compression failed:', error);
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setPhotos((prev) => [...prev, ev.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex !== null && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex !== null && previewIndex < photos.length - 1) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  const handleSave = () => {
    if (!mood) return;
    onSave({ mood, journal, factors, photos });
    clearDraft();
    onClose();
  };

  const DRAFT_KEY = `mood_draft_${date}`;
  const DRAFT_AUTO_SAVE_INTERVAL = 30000;

  React.useEffect(() => {
    if (isOpen && !initialMood) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.mood) setMood(parsed.mood);
          if (parsed.factors?.length) setFactors(parsed.factors);
          if (parsed.photos?.length) setPhotos(parsed.photos);
          if (parsed.journal) {
            setJournal(parsed.journal);
          }
        }
      } catch {
        // Ignore draft load errors
      }
    }
  }, [isOpen, date, initialMood]);

  React.useEffect(() => {
    if (!isOpen || initialMood) return;

    const timer = setInterval(() => {
      if (mood || journal || factors.length > 0 || photos.length > 0) {
        const draft = {
          mood,
          journal,
          factors,
          photos,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedAt(draft.savedAt);
      }
    }, DRAFT_AUTO_SAVE_INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, mood, journal, factors, photos, date, initialMood]);

  React.useEffect(() => {
    if (!isOpen || initialMood) return;

    const timer = setTimeout(() => {
      if (mood || journal || factors.length > 0 || photos.length > 0) {
        const draft = {
          mood,
          journal,
          factors,
          photos,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedAt(draft.savedAt);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [mood, journal, factors, photos, isOpen, date, initialMood]);

  const formatDraftTime = (savedAt: string): string => {
    const saved = new Date(savedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - saved.getTime()) / 1000);

    if (diff < 60) return t('editor.draftJustNow');
    if (diff < 3600) return t('editor.draftMinutesAgo', { minutes: Math.floor(diff / 60) });
    if (diff < 86400) return t('editor.draftHoursAgo', { hours: Math.floor(diff / 3600) });
    return t('editor.draftDaysAgo', { days: Math.floor(diff / 86400) });
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleClose = () => {
    if (!initialMood && (mood || journal || factors.length > 0 || photos.length > 0)) {
      const draft = {
        mood,
        journal,
        factors,
        photos,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
    onClose();
  };

  const handleApplyTemplate = (content: string) => {
    setJournal(content);
    setCharCount(content.replace(/<[^>]*>/g, '').length);
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />
      <div
        className={`relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-card rounded-2xl shadow-elevated border border-border animate-scale-in`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-card rounded-t-2xl">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('editor.title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(date)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              {t('editor.howAreYou')}
            </label>
            <div className="flex gap-2">
              {Object.keys(MOOD_CONFIG).map((key) => {
                const moodKey = key as Mood;
                const config = MOOD_CONFIG[moodKey];
                return (
                  <button
                    key={key}
                    onClick={() => setMood(moodKey)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all duration-200',
                      mood === moodKey
                        ? `${config.bgClass} ${config.ringClass} border-transparent`
                        : 'border-transparent hover:bg-accent'
                    )}
                  >
                    <span className="text-2xl">{config.emoji}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        mood === moodKey ? config.color : 'text-muted-foreground'
                      )}
                    >
                      {t(`mood.${moodKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              {t('editor.factors')}
            </label>
            <div className="flex flex-wrap gap-2">
              {allFactors.map((factor) => (
                <button
                  key={factor.id}
                  onClick={() => toggleFactor(factor.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                    factors.includes(factor.id)
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                      : 'bg-secondary text-secondary-foreground border-transparent hover:border-border hover:bg-accent'
                  )}
                >
                  <span
                    className={cn(
                      'transition-transform duration-200',
                      factors.includes(factor.id) && 'scale-110'
                    )}
                  >
                    {factor.emoji}
                  </span>
                  {factor.isCustom ? factor.label : t(`factors.${factor.id}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">
                  {t('editor.writeSomething')}
                </label>
                <button
                  onClick={() => setIsTemplatePickerOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                  title={t('editor.useTemplate')}
                >
                  <FileText className="h-3 w-3" />
                  {t('editor.template')}
                </button>
              </div>
              <span
                className={cn(
                  'text-xs transition-colors',
                  charCount > MAX_CHARS * 0.95
                    ? 'text-destructive font-medium'
                    : charCount > MAX_CHARS * 0.8
                      ? 'text-orange-500'
                      : charCount > MAX_CHARS * 0.5
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-muted-foreground'
                )}
              >
                {charCount}/{MAX_CHARS}
                {charCount > MAX_CHARS * 0.9 && (
                  <span className="ml-1 text-[10px]">
                    ({Math.round(((MAX_CHARS - charCount) / MAX_CHARS) * 100)}%)
                  </span>
                )}
              </span>
            </div>
            <RichTextEditor
              content={journal}
              onChange={(html) => setJournal(html)}
              onCharCountChange={(count) => setCharCount(count)}
              placeholder={t('editor.writeSomething')}
              maxHeight={500}
              minHeight={120}
              maxChars={MAX_CHARS}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              {t('editor.addPhoto')}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group"
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openPreview(i)}
                      className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-background/80 hover:bg-background flex items-center justify-center"
                    >
                      <Eye className="h-3 w-3 text-foreground" />
                    </button>
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/80 hover:bg-background flex items-center justify-center"
                    >
                      <X className="h-2.5 w-2.5 text-foreground" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-accent transition-all duration-200"
              >
                <Camera className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between p-5 border-t border-border bg-card rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {draftSavedAt && (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>
                  {t('editor.draftSaved')} · {formatDraftTime(draftSavedAt)}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              {t('editor.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!mood}>
              {t('editor.save')}
            </Button>
          </div>
        </div>
      </div>

      <TemplatePicker
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        date={date}
        onSelectTemplate={handleApplyTemplate}
      />

      {previewIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 rounded-full p-2 bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {previewIndex > 0 && (
              <button
                onClick={goToPrev}
                className="absolute left-4 rounded-full p-2 bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            )}

            <img
              src={photos[previewIndex]}
              alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {previewIndex < photos.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 rounded-full p-2 bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
              {previewIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
