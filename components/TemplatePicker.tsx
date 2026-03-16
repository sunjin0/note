'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { JournalTemplate, TemplateCategory } from '@/lib/types';
import { 
  TEMPLATE_CATEGORY_ORDER, 
  CATEGORY_ICONS, 
  getTemplatesByCategory,
  toggleFavorite,
  isFavorite,
  addToRecent,
  processTemplateContent,
  getFavoriteTemplates,
  getRecentTemplates,
} from '@/lib/templates';
import { useTranslation } from '@/lib/i18n';
import { 
  X, 
  Star, 
  Clock, 
  FileText, 
  Plus,
  ChevronRight,
  Heart,
  Trash2,
  Edit3,
} from 'lucide-react';
import CustomTemplateEditor from './CustomTemplateEditor';
import ConfirmDialog from './ConfirmDialog';
import { Button } from '@/components/ui/button';
import { 
  saveCustomTemplate, 
  deleteCustomTemplate as deleteCustomTemplateFromStorage,
  getCustomTemplates,
} from '@/lib/templates';

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onSelectTemplate: (content: string) => void;
}

export default function TemplatePicker({
  isOpen,
  onClose,
  date,
  onSelectTemplate,
}: TemplatePickerProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = React.useState<TemplateCategory>('work');
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [templates, setTemplates] = React.useState<JournalTemplate[]>([]);
  const [recentTemplates, setRecentTemplates] = React.useState<JournalTemplate[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = React.useState<JournalTemplate[]>([]);
  const [isCustomEditorOpen, setIsCustomEditorOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<JournalTemplate | null>(null);
  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [templateToDelete, setTemplateToDelete] = React.useState<string | null>(null);

  // Load favorites and templates when opened
  React.useEffect(() => {
    if (isOpen) {
      const favIds = new Set<string>();
      getTemplatesByCategory('work').forEach(t => {
        if (isFavorite(t.id)) favIds.add(t.id);
      });
      setFavorites(favIds);
      loadTemplates(activeCategory);
      setRecentTemplates(getRecentTemplates());
      setFavoriteTemplates(getFavoriteTemplates());
    }
  }, [isOpen]);

  // Load templates when category changes
  React.useEffect(() => {
    if (isOpen) {
      loadTemplates(activeCategory);
    }
  }, [activeCategory, isOpen]);

  const loadTemplates = (category: TemplateCategory) => {
    const loaded = getTemplatesByCategory(category);
    setTemplates(loaded);
  };

  // 刷新自定义分类模板列表 - 确保数据同步
  const refreshCustomTemplates = () => {
    // 如果当前正在查看自定义分类，立即刷新列表
    if (activeCategory === 'custom') {
      loadTemplates('custom');
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    const isFav = toggleFavorite(templateId);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) {
        next.add(templateId);
      } else {
        next.delete(templateId);
      }
      return next;
    });
    // Refresh favorites list if viewing favorites
    if (activeCategory === 'favorites') {
      setFavoriteTemplates(getFavoriteTemplates());
      setTemplates(getFavoriteTemplates());
    }
  };

  const handleSelectTemplate = (template: JournalTemplate) => {
    // Get content from i18n or use custom content
    let content: string;
    if (template.isCustom && template.content) {
      content = template.content;
    } else {
      content = t(template.contentKey);
    }
    // Process variables
    const processedContent = processTemplateContent(content, date);
    // Add to recent
    addToRecent(template.id);
    // Apply template
    onSelectTemplate(processedContent);
    onClose();
  };

  const handleCreateCustom = () => {
    setEditingTemplate(null);
    setIsCustomEditorOpen(true);
  };

  const handleEditCustom = (template: JournalTemplate) => {
    setEditingTemplate(template);
    setIsCustomEditorOpen(true);
  };

  // 处理保存自定义模板 - 创建或编辑后刷新列表
  const handleSaveCustom = (templateData: { title: string; content: string; category: Exclude<TemplateCategory, 'favorites' | 'recent' | 'custom'> }) => {
    if (editingTemplate && editingTemplate.isCustom) {
      // 编辑模式：删除旧模板并创建新模板
      deleteCustomTemplateFromStorage(editingTemplate.id);
    }
    // 保存新模板到本地存储
    saveCustomTemplate({
      category: templateData.category,
      titleKey: templateData.title,
      contentKey: templateData.content,
    });
    // 立即刷新自定义分类列表，显示新创建或更新的模板
    loadTemplates('custom');
    // 如果当前不在自定义分类，同时刷新当前分类的列表
    if (activeCategory !== 'custom') {
      loadTemplates(activeCategory);
    }
    // 刷新收藏列表，确保数据一致性
    setFavoriteTemplates(getFavoriteTemplates());
  };

  // 打开删除确认对话框
  const openDeleteDialog = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  // 执行删除操作 - 确认后从列表中移除模板
  const executeDelete = () => {
    if (!templateToDelete) return;
    
    // 从本地存储删除模板
    deleteCustomTemplateFromStorage(templateToDelete);
    
    // 如果该模板已被收藏，从收藏状态中移除
    if (favorites.has(templateToDelete)) {
      const newFavorites = new Set(favorites);
      newFavorites.delete(templateToDelete);
      setFavorites(newFavorites);
    }
    
    // 立即刷新自定义分类列表，移除被删除的模板
    loadTemplates('custom');
    // 如果当前不在自定义分类，同时刷新当前分类的列表
    if (activeCategory !== 'custom') {
      loadTemplates(activeCategory);
    }
    // 刷新收藏列表，确保数据一致性
    setFavoriteTemplates(getFavoriteTemplates());
    
    // 关闭确认对话框
    closeDeleteDialog();
  };

  const getCategoryLabel = (category: TemplateCategory): string => {
    return t(`templates.categories.${category}`);
  };

  const getTemplateTitle = (template: JournalTemplate): string => {
    return t(template.titleKey);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden bg-card rounded-2xl shadow-elevated border border-border animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-card">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('templates.title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('templates.subtitle')}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex h-[60vh]">
          {/* Sidebar - Categories */}
          <div className="w-48 border-r border-border bg-secondary/30 overflow-y-auto">
            {/* Recent */}
            <button
              onClick={() => setActiveCategory('recent')}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors',
                activeCategory === 'recent'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-accent'
              )}
            >
              <Clock className="h-4 w-4" />
              {getCategoryLabel('recent')}
            </button>
            
            {/* Favorites */}
            <button
              onClick={() => setActiveCategory('favorites')}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors',
                activeCategory === 'favorites'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-accent'
              )}
            >
              <Heart className="h-4 w-4" />
              {getCategoryLabel('favorites')}
            </button>

            <div className="h-px bg-border my-2" />

            {/* Categories */}
            {TEMPLATE_CATEGORY_ORDER.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors',
                  activeCategory === category
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <span>{CATEGORY_ICONS[category]}</span>
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>

          {/* Content - Templates */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeCategory === 'recent' && recentTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">{t('templates.noRecent')}</p>
              </div>
            )}

            {activeCategory === 'favorites' && favoriteTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Heart className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">{t('templates.noFavorites')}</p>
              </div>
            )}

            {activeCategory === 'custom' && templates.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm mb-4">{t('templates.noCustom')}</p>
                <Button variant="outline" size="sm" onClick={handleCreateCustom}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('templates.createCustom')}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group relative flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CATEGORY_ICONS[template.category]}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm text-foreground truncate">
                          {getTemplateTitle(template)}
                        </span>
                        {template.isCustom && template.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(template.createdAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Favorite button */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, template.id)}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        favorites.has(template.id)
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title={favorites.has(template.id) ? t('templates.removeFavorite') : t('templates.addFavorite')}
                    >
                      <Star className={cn('h-4 w-4', favorites.has(template.id) && 'fill-current')} />
                    </button>

                    {/* Edit button for custom templates */}
                    {template.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustom(template);
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title={t('templates.edit')}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Delete button for custom templates */}
                    {template.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 打开删除确认对话框
                          openDeleteDialog(template.id);
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title={t('templates.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>

            {/* Create custom template button for custom category */}
            {activeCategory === 'custom' && templates.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={handleCreateCustom}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('templates.createCustom')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between p-4 border-t border-border bg-card">
          <span className="text-xs text-muted-foreground">
            {t('templates.clickToApply')}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('templates.close')}
          </Button>
        </div>
      </div>
      </div>

      {/* Custom Template Editor */}
      <CustomTemplateEditor
        isOpen={isCustomEditorOpen}
        onClose={() => setIsCustomEditorOpen(false)}
        onSave={handleSaveCustom}
        editingTemplate={editingTemplate}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t('templates.delete')}
        message={t('templates.deleteConfirm')}
        confirmText={t('templates.delete')}
        cancelText={t('templates.cancel')}
        confirmVariant="destructive"
        onConfirm={executeDelete}
        onCancel={closeDeleteDialog}
      />
    </>
  );
}
