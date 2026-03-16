'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { JournalTemplate, TemplateCategory } from '@/lib/types';
import { CATEGORY_ICONS } from '@/lib/templates';
import { useTranslation } from '@/lib/i18n';
import { 
  X, 
  Save,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: { title: string; content: string; category: Exclude<TemplateCategory, 'favorites' | 'recent' | 'custom'> }) => void;
  editingTemplate?: JournalTemplate | null;
}

const AVAILABLE_CATEGORIES: Exclude<TemplateCategory, 'favorites' | 'recent' | 'custom'>[] = [
  'work',
  'study',
  'travel',
  'health',
  'life',
];

export default function CustomTemplateEditor({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
}: CustomTemplateEditorProps) {
  const { t } = useTranslation();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState<Exclude<TemplateCategory, 'favorites' | 'recent' | 'custom'>>('life');

  // Reset form when opened
  React.useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        // 自定义模板的标题和内容存储在 titleKey 和 contentKey 中
        setTitle(editingTemplate.titleKey || '');
        setContent(editingTemplate.contentKey || '');
        setCategory(editingTemplate.category as Exclude<TemplateCategory, 'favorites' | 'recent' | 'custom'>);
      } else {
        setTitle('');
        setContent('');
        setCategory('life');
      }
    }
  }, [isOpen, editingTemplate]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), category });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const getCategoryLabel = (cat: TemplateCategory): string => {
    return t(`templates.categories.${cat}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[56] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden bg-card rounded-2xl shadow-elevated border border-border animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-card">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {editingTemplate ? t('templates.editCustom') : t('templates.createCustom')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('templates.customSubtitle')}
            </p>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Template Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('templates.templateTitle')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('templates.titlePlaceholder')}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('templates.selectCategory')}
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all',
                    category === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-input hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Template Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                {t('templates.templateContent')}
              </label>
              <span className="text-xs text-muted-foreground">
                {t('templates.supportsVariables')}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('templates.contentPlaceholder')}
              className="w-full px-3 py-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              rows={10}
            />
          </div>

          {/* Variable Help */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-foreground mb-2">
              {t('templates.availableVariables')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {['{{date}}', '{{year}}', '{{month}}', '{{day}}', '{{weekday}}', '{{weekdayZh}}'].map(variable => (
                <code
                  key={variable}
                  className="px-2 py-1 text-xs bg-background border border-border rounded"
                >
                  {variable}
                </code>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t border-border bg-card">
          <Button variant="outline" onClick={handleClose}>
            {t('templates.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || !content.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {t('templates.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
