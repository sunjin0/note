'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Mood, MOOD_CONFIG, FACTOR_OPTIONS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { X, Camera, Bold, Italic, Underline, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  isOpen, onClose, date, initialMood, initialJournal = '', initialFactors = [], initialPhotos = [], onSave,
}: MoodEditorProps) {
  const { t } = useTranslation();
  const [mood, setMood] = React.useState<Mood | undefined>(initialMood);
  const [journal, setJournal] = React.useState(initialJournal ?? '');
  const [factors, setFactors] = React.useState<string[]>(initialFactors ?? []);
  const [photos, setPhotos] = React.useState<string[]>(initialPhotos ?? []);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Reset state when editor opens with a different date
  React.useEffect(() => {
    if (isOpen) {
      setMood(initialMood);
      setJournal(initialJournal ?? '');
      setFactors(initialFactors ?? []);
      setPhotos(initialPhotos ?? []);
    }
  }, [isOpen, date]);

  // Separate effect to handle editor content update
  React.useEffect(() => {
    if (editorRef.current && isOpen) {
      editorRef.current.innerHTML = initialJournal;
    }
  }, [initialJournal, isOpen]);

  const toggleFactor = (id: string) => {
    setFactors(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    if (!mood) return;
    const content = editorRef.current?.innerHTML || journal;
    onSave({ mood, journal: content, factors, photos });
    onClose();
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin bg-card rounded-2xl shadow-elevated border border-border animate-scale-in">
        {/* Header */}
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
          {/* Mood Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">{t('editor.howAreYou')}</label>
            <div className="flex gap-2">
              {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setMood(key)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all duration-200',
                    mood === key
                      ? `${config.bgClass} ${config.ringClass} border-transparent`
                      : 'border-transparent hover:bg-accent'
                  )}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  <span className={cn('text-xs font-medium', mood === key ? config.color : 'text-muted-foreground')}>
                    {t(`mood.${key}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Factor Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">{t('editor.factors')}</label>
            <div className="flex flex-wrap gap-2">
              {FACTOR_OPTIONS.map(factor => (
                <button
                  key={factor.id}
                  onClick={() => toggleFactor(factor.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                    factors.includes(factor.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-transparent hover:border-border'
                  )}
                >
                  <span>{factor.emoji}</span>
                  {t(`factors.${factor.id}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">{t('editor.writeSomething')}</label>
            <div className="border border-input rounded-xl overflow-hidden bg-background">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-secondary/30">
                <button onClick={() => execCommand('bold')} className="p-1.5 rounded-md hover:bg-accent transition-colors" title={t('editor.bold')}>
                  <Bold className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => execCommand('italic')} className="p-1.5 rounded-md hover:bg-accent transition-colors" title={t('editor.italic')}>
                  <Italic className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => execCommand('underline')} className="p-1.5 rounded-md hover:bg-accent transition-colors" title={t('editor.underline')}>
                  <Underline className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[120px] max-h-[200px] overflow-y-auto p-4 text-sm text-foreground focus:outline-none scrollbar-thin"
                onInput={() => setJournal(editorRef.current?.innerHTML || '')}
                suppressContentEditableWarning
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">{t('editor.addPhoto')}</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                  <img 
                    src={photo} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  {/* Hover overlay with preview button in center and delete button in top-right */}
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Preview button - center */}
                    <button
                      onClick={() => openPreview(i)}
                      className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-background/80 hover:bg-background flex items-center justify-center"
                    >
                      <Eye className="h-3 w-3 text-foreground" />
                    </button>
                    {/* Delete button - top right */}
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

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-5 border-t border-border bg-card rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>{t('editor.cancel')}</Button>
          <Button onClick={handleSave} disabled={!mood}>{t('editor.save')}</Button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closePreview}>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {/* Close button */}
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 rounded-full p-2 bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Prev button */}
            {previewIndex > 0 && (
              <button
                onClick={goToPrev}
                className="absolute left-4 rounded-full p-2 bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            )}

            {/* Image */}
            <img
              src={photos[previewIndex]}
              alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next button */}
            {previewIndex < photos.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 rounded-full p-2 bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
              {previewIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
