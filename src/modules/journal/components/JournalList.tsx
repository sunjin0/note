'use client';

import React, {useEffect, useMemo, useState} from 'react';
import {cn} from '@/core/utils';
import {Card, CardContent} from '@/core/ui/card';
import {Button} from '@/core/ui/button';
import {FactorOption, Mood, MoodEntry} from '@/types';
import {FACTOR_OPTIONS, MOOD_CONFIG} from '@/core/config/mood';
import {deleteEntry, getCustomFactors} from '@/core/storage';
import {useTranslation} from '@/core/i18n';
import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Filter,
  Image as ImageIcon,
  Plus,
  Search,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {ConfirmDialog, ExportFormatDialog, useToast} from '@/modules/common/components';
import jsPDF from "jspdf";

interface JournalListProps {
  entries: MoodEntry[];
  onNewEntry: (date?: string) => void;
  onEditEntry: (date: string) => void;
  onDataChange: () => void;
}

interface FilterState {
  search: string;
  startDate: string;
  endDate: string;
  selectedMoods: Mood[];
  selectedFactors: string[];
}

interface PaginationState {
  pageSize: number;
  currentPage: number;
}

type SortField = 'date' | 'mood' | 'wordCount';
type SortOrder = 'asc' | 'desc';

interface SortState {
  field: SortField;
  order: SortOrder;
}

const moodScore: Record<Mood, number> = {
  great: 5,
  good: 4,
  okay: 3,
  sad: 2,
  angry: 1,
};

// 获取周数
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// 判断是否为一周内
function isWithinWeek(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
}

// 获取时间分组键
function getTimeGroupKey(dateStr: string): { year: number; month: number; week: number } {
  const date = new Date(dateStr + 'T00:00:00');
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    week: getWeekNumber(date),
  };
}



export default function JournalList({
  entries,
  onNewEntry,
  onEditEntry,
  onDataChange,
}: JournalListProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [exportFormatDialogOpen, setExportFormatDialogOpen] = useState(false);

  // Get all factors (preset + custom)
  const [allFactors, setAllFactors] = useState<FactorOption[]>(FACTOR_OPTIONS);

  // Reload custom factors when entries change (for real-time sync with settings)
  useEffect(() => {
    const customFactors = getCustomFactors();
    setAllFactors([...FACTOR_OPTIONS, ...customFactors]);
  }, [entries]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    startDate: '',
    endDate: '',
    selectedMoods: [],
    selectedFactors: [],
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageSize: 10,
    currentPage: 1,
  });

  const [sort, setSort] = useState<SortState>({
    field: 'date',
    order: 'desc',
  });

  // 过滤和排序条目
  const filteredEntries = useMemo(() => {
    const filtered = entries.filter((entry) => {
      // 全文搜索
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const plainText = entry.journal.replace(/<[^>]*>/g, '').toLowerCase();
        const moodLabel = t(`mood.${entry.mood}`) as string;
        const factorLabels = entry.factors
          .map((f) => allFactors.find((o) => o.id === f)?.label || '')
          .join(' ');
        if (
          !plainText.includes(q) &&
          !moodLabel.includes(q) &&
          !factorLabels.includes(q) &&
          !entry.date.includes(q)
        ) {
          return false;
        }
      }

      // 日期范围筛选
      if (filters.startDate && entry.date < filters.startDate) return false;
      if (filters.endDate && entry.date > filters.endDate) return false;

      // 心情筛选
      if (filters.selectedMoods.length > 0 && !filters.selectedMoods.includes(entry.mood)) {
        return false;
      }

      // 因素筛选
      if (filters.selectedFactors.length > 0) {
        const hasSelectedFactor = filters.selectedFactors.some((f) => entry.factors.includes(f));
        if (!hasSelectedFactor) return false;
      }

      return true;
    });

    // 排序
    return filtered.sort((a, b) => {
      let compareResult = 0;

      switch (sort.field) {
        case 'date':
          compareResult = a.date.localeCompare(b.date);
          break;
        case 'mood':
          compareResult = moodScore[a.mood] - moodScore[b.mood];
          break;
        case 'wordCount':
          const aLength = a.journal.replace(/<[^>]*>/g, '').length;
          const bLength = b.journal.replace(/<[^>]*>/g, '').length;
          compareResult = aLength - bLength;
          break;
      }

      return sort.order === 'asc' ? compareResult : -compareResult;
    });
  }, [entries, filters, sort, allFactors, t]);

  // 分页计算
  const totalPages = Math.ceil(filteredEntries.length / pagination.pageSize);
  const currentPageEntries = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredEntries.slice(start, end);
  }, [filteredEntries, pagination]);

  // 当筛选条件变更时重置到第一页
  useMemo(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    filters.startDate,
    filters.endDate,
    filters.selectedMoods.join(','),
    filters.selectedFactors.join(','),
  ]);

  // 判断是否有筛选条件（包括文本搜索）
  const hasFilters =
    filters.search ||
    filters.startDate ||
    filters.endDate ||
    filters.selectedMoods.length > 0 ||
    filters.selectedFactors.length > 0;

  // 分组条目（仅在查询时使用分页）
  const groupedEntries = useMemo(() => {
    // 有筛选条件时（包括文本搜索），直接平铺显示分页结果，不分组
    if (hasFilters) {
      return { recent: currentPageEntries, archived: new Map() };
    }

    // 正常浏览时不分页，显示所有条目
    const recent: MoodEntry[] = [];
    const archived: Map<string, Map<string, Map<string, MoodEntry[]>>> = new Map();

    filteredEntries.forEach((entry) => {
      if (isWithinWeek(entry.date)) {
        recent.push(entry);
      } else {
        const { year, month, week } = getTimeGroupKey(entry.date);
        const yearKey = `${year}年`;
        const monthKey = `${month}月`;
        const weekKey = `第${week}周`;

        if (!archived.has(yearKey)) {
          archived.set(yearKey, new Map());
        }
        const yearGroup = archived.get(yearKey)!;

        if (!yearGroup.has(monthKey)) {
          yearGroup.set(monthKey, new Map());
        }
        const monthGroup = yearGroup.get(monthKey)!;

        if (!monthGroup.has(weekKey)) {
          monthGroup.set(weekKey, []);
        }
        monthGroup.get(weekKey)!.push(entry);
      }
    });

    return { recent, archived };
  }, [filteredEntries, currentPageEntries, hasFilters]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
    setExpandedId(null);
    onDataChange();
  };

  const openDeleteDialog = (id: string) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedIds(new Set());
  };

  const toggleSelectEntry = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (isAllSelected) {
      clearSelection();
      return;
    }
    const allIds = filteredEntries.map((e) => e.id);
    setSelectedIds(new Set(allIds));
  };

  const isAllSelected = filteredEntries.length > 0 && selectedIds.size === filteredEntries.length;

  // 获取特定分组的条目ID列表
  const getGroupEntryIds = (year?: string, month?: string, week?: string): string[] => {
    if (!year) return [];
    
    if (!month && !week) {
      // 选择整个年份
      const yearData = groupedEntries.archived.get(year);
      if (!yearData) return [];
      const ids: string[] = [];
      yearData.forEach((weeks:any) => {
        weeks.forEach((entries: MoodEntry[]) => {
          entries.forEach((entry:MoodEntry) => ids.push(entry.id));
        });
      });
      return ids;
    }
    
    if (year && month && !week) {
      // 选择整个月份
      const yearData = groupedEntries.archived.get(year);
      if (!yearData) return [];
      const monthData = yearData.get(month);
      if (!monthData) return [];
      const ids: string[] = [];
      monthData.forEach((entries: MoodEntry[]) => {
        entries.forEach((entry: MoodEntry) => ids.push(entry.id));
      });
      return ids;
    }
    
    if (year && month && week) {
      // 选择整个周
      const yearData = groupedEntries.archived.get(year);
      if (!yearData) return [];
      const monthData = yearData.get(month);
      if (!monthData) return [];
      const weekData = monthData.get(week);
      if (!weekData) return [];
      return weekData.map((entry: MoodEntry) => entry.id);
    }
    
    return [];
  };

  // 检查分组是否全部选中
  const isGroupFullySelected = (year?: string, month?: string, week?: string): boolean => {
    const groupIds = getGroupEntryIds(year, month, week);
    if (groupIds.length === 0) return false;
    return groupIds.every((id) => selectedIds.has(id));
  };

  // 检查分组是否部分选中
  const isGroupPartiallySelected = (year?: string, month?: string, week?: string): boolean => {
    const groupIds = getGroupEntryIds(year, month, week);
    if (groupIds.length === 0) return false;
    const selectedCount = groupIds.filter((id) => selectedIds.has(id)).length;
    return selectedCount > 0 && selectedCount < groupIds.length;
  };

  // 切换分组选择状态
  const toggleGroupSelection = (year?: string, month?: string, week?: string) => {
    const groupIds = getGroupEntryIds(year, month, week);
    if (groupIds.length === 0) return;
    
    const allSelected = isGroupFullySelected(year, month, week);
    const newSelected = new Set(selectedIds);
    
    if (allSelected) {
      // 取消全选
      groupIds.forEach((id) => newSelected.delete(id));
    } else {
      // 全选
      groupIds.forEach((id) => newSelected.add(id));
    }
    
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => deleteEntry(id));
    setBatchDeleteDialogOpen(false);
    setSelectedIds(new Set());
    setIsBatchMode(false);
    onDataChange();
  };

  const handleBatchExport = () => {
    if (selectedIds.size === 0) return;
    setExportFormatDialogOpen(true);
  };
  function getPlainText(entry: MoodEntry) {
    return entry.journal
        // 换行标签
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<br>/gi, '\n')
        // 段落标签
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        // div 标签
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        // 标题标签
        .replace(/<h1[^>]*>/gi, '\n')
        .replace(/<\/h1>/gi, '\n\n')
        .replace(/<h2[^>]*>/gi, '\n')
        .replace(/<\/h2>/gi, '\n\n')
        .replace(/<h3[^>]*>/gi, '\n')
        .replace(/<\/h3>/gi, '\n\n')
        .replace(/<h4[^>]*>/gi, '\n')
        .replace(/<\/h4>/gi, '\n\n')
        .replace(/<h5[^>]*>/gi, '\n')
        .replace(/<\/h5>/gi, '\n\n')
        .replace(/<h6[^>]*>/gi, '\n')
        .replace(/<\/h6>/gi, '\n\n')
        // 列表标签
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/li>/gi, '')
        .replace(/<ul[^>]*>/gi, '\n')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<ol[^>]*>/gi, '\n')
        .replace(/<\/ol>/gi, '\n')
        // 表格标签
        .replace(/<tr[^>]*>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<td[^>]*>/gi, ' ')
        .replace(/<\/td>/gi, ' ')
        .replace(/<th[^>]*>/gi, '\n')
        .replace(/<\/th>/gi, '\n')
        .replace(/<table[^>]*>/gi, '\n')
        .replace(/<\/table>/gi, '\n')
        // 格式化标签
        .replace(/<b[^>]*>/gi, '')
        .replace(/<\/b>/gi, '')
        .replace(/<strong[^>]*>/gi, '')
        .replace(/<\/strong>/gi, '')
        .replace(/<i[^>]*>/gi, '')
        .replace(/<\/i>/gi, '')
        .replace(/<em[^>]*>/gi, '')
        .replace(/<\/em>/gi, '')
        .replace(/<u[^>]*>/gi, '')
        .replace(/<\/u>/gi, '')
        .replace(/<s[^>]*>/gi, '')
        .replace(/<\/s>/gi, '')
        .replace(/<del[^>]*>/gi, '')
        .replace(/<\/del>/gi, '')
        .replace(/<mark[^>]*>/gi, '')
        .replace(/<\/mark>/gi, '')
        .replace(/<code[^>]*>/gi, '')
        .replace(/<\/code>/gi, '')
        .replace(/<pre[^>]*>/gi, '\n')
        .replace(/<\/pre>/gi, '\n')
        // 引用标签
        .replace(/<blockquote[^>]*>/gi, '\n「')
        .replace(/<\/blockquote>/gi, '」\n')
        // 链接和图片
        .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi, '链接: $1 ')
        .replace(/<\/a>/gi, '')
        .replace(/<img[^>]*>/gi, '[图片]')
        // 水平线
        .replace(/<hr[^>]*>/gi, '\n---\n')
        // 其他所有 HTML 标签
        .replace(/<[^>]*>/g, '')
        // HTML 实体转换
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™')
        .replace(/&hellip;/g, '…')
        .replace(/&bull;/g, '•')
        // 限制连续换行
        .replace(/\n{3,}/g, '\n\n')
        // 去除首尾空格
        .trim();
  }
  // PDF 导出
  const handleExportPDF = async () => {
    const selectedEntries = entries.filter((e) => selectedIds.has(e.id));
    if (selectedEntries.length === 0) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25; // 页边距
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // 辅助函数: 检测文本是否包含中文
      const hasChinese = (text: string) => /[一-龥]/.test(text);


      // 辅助函数: 将中文文本转换为图片并添加到 PDF
      const addTextWithFallback = async (
        text: string,
        x: number,
        y: number,
        fontSize: number,
        options: { bold?: boolean; color?: [number, number, number]; maxWidth?: number } = {}
      ): Promise<number> => {
        if (!hasChinese(text)) {
          // 纯英文/数字,直接使用 jsPDF
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
          if (options.color) {
            doc.setTextColor(options.color[0], options.color[1], options.color[2]);
          }
          
          // 自动换行处理
          if (options.maxWidth) {
            const lines = doc.splitTextToSize(text, options.maxWidth);
            let totalHeight = 0;
            lines.forEach((line: string, index: number) => {
              if (yPos + totalHeight + fontSize * 0.5 > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
                totalHeight = 0;
              }
              doc.text(line, x, yPos + totalHeight);
              totalHeight += fontSize * 0.5;
            });
            return totalHeight;
          } else {
            doc.text(text, x, y);
            return fontSize * 0.5;
          }
        }

        // 包含中文,使用 Canvas 渲染为图片
        const scale = 2; // 提高清晰度
        const lineHeight = fontSize * 1.35; // 行高 1.35 倍，更紧凑
        const maxWidthPx = options.maxWidth ? options.maxWidth / 0.352778 : 10000;
        const topPadding = fontSize * 0.25; // 增加顶部内边距防止遮挡
        
        // 使用传入的 y 参数，而不是全局 yPos
        const renderY = y;
        
        // 先计算需要的行数和每行内容
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', 'normal');
          doc.text('[Chinese Text]', x, y);
          return fontSize * 0.5;
        }

        ctx.scale(scale, scale);
        ctx.font = `${options.bold ? 'bold' : 'normal'} ${fontSize}px "Microsoft YaHei", "SimHei", sans-serif`;
        ctx.textBaseline = 'top'; // 使用 top 基线，配合顶部内边距
        
        // 计算每行应该包含的字符
        const lines: string[] = [];
        let currentLine = '';
        
        for (const char of text) {
          const testLine = currentLine + char;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidthPx && currentLine) {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // 如果没有内容,添加空行
        if (lines.length === 0) {
          lines.push('');
        }
        
        // 分批渲染(避免单页内容过多)
        let totalHeight = 0;
        let currentLineIndex = 0;
        let currentRenderY = renderY; // 使用局部变量追踪当前 Y 位置
        
        while (currentLineIndex < lines.length) {
          // 计算当前批次可以渲染的行数
          const remainingHeight = pageHeight - margin - currentRenderY;
          const maxLinesInBatch = Math.floor(remainingHeight / (lineHeight * 0.352778));
          const linesInBatch = Math.min(maxLinesInBatch, lines.length - currentLineIndex);
          
          if (linesInBatch <= 0) {
            doc.addPage();
            currentRenderY = margin;
            continue;
          }
          
          // 创建临时 Canvas 渲染当前批次
          const batchCanvas = document.createElement('canvas');
          const batchCtx = batchCanvas.getContext('2d');
          if (!batchCtx) break;
          
          const batchCanvasWidth = (options.maxWidth || 1000) / 0.352778 * scale;
          const batchCanvasHeight = (topPadding + lineHeight * linesInBatch) * scale;
          
          batchCanvas.width = batchCanvasWidth;
          batchCanvas.height = batchCanvasHeight;
          
          batchCtx.scale(scale, scale);
          batchCtx.font = `${options.bold ? 'bold' : 'normal'} ${fontSize}px "Microsoft YaHei", "SimHei", sans-serif`;
          batchCtx.fillStyle = options.color 
            ? `rgb(${options.color[0]}, ${options.color[1]}, ${options.color[2]})`
            : 'rgb(0, 0, 0)';
          batchCtx.textBaseline = 'top'; // 使用 top 基线
          
          // 渲染当前批次的行(从 topPadding 开始)
          for (let i = 0; i < linesInBatch; i++) {
            batchCtx.fillText(lines[currentLineIndex + i], 0, topPadding + i * lineHeight);
          }
          
          // 添加到 PDF（使用 currentRenderY）
          const imgData = batchCanvas.toDataURL('image/png');
          const imgWidth = (batchCanvasWidth / scale) * 0.352778;
          const imgHeight = (batchCanvasHeight / scale) * 0.352778;
          doc.addImage(imgData, 'PNG', x, currentRenderY, imgWidth, imgHeight);
          
          totalHeight += imgHeight;
          currentRenderY += imgHeight;
          currentLineIndex += linesInBatch;
          
          // 如果还有更多行,创建新页面
          if (currentLineIndex < lines.length) {
            doc.addPage();
            currentRenderY = margin;
          }
        }
        
        return totalHeight;
      };

      // 标题
      const titleHeight = await addTextWithFallback(t('journal.title') as string, margin, yPos, 20, { 
        bold: true,
        maxWidth: contentWidth 
      });
      yPos += titleHeight + 4;

      // 导出信息
      const exportInfo = `${t('journal.exporting') || '导出日期'}: ${new Date().toLocaleString('zh-CN')}`;
      const infoHeight = await addTextWithFallback(exportInfo, margin, yPos, 9, { 
        color: [100, 100, 100],
        maxWidth: contentWidth
      });
      yPos += infoHeight + 2;
      
      const countText = t('journal.selectedCount', { count: selectedEntries.length });
      const countHeight = await addTextWithFallback(countText, margin, yPos, 9, { 
        color: [100, 100, 100],
        maxWidth: contentWidth
      });
      yPos += countHeight + 5;

      // 分隔线
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // 导出每条日记
      for (let index = 0; index < selectedEntries.length; index++) {
        const entry = selectedEntries[index];
        const config = MOOD_CONFIG[entry.mood as Mood];
        // 处理 HTML 内容：保留换行和段落
        const plainText = getPlainText(entry);

        const moodLabel = t(`mood.${entry.mood}`) as string;
        const factorLabels = entry.factors
          .map((f: string) => {
            const factor = allFactors.find((o) => o.id === f);
            return factor ? (factor.isCustom ? factor.label : t(`factors.${factor.id}`)) : '';
          })
          .filter(Boolean)
          .join(', ');

        // 检查是否需要新页面
        if (yPos > pageHeight - margin - 15) {
          doc.addPage();
          yPos = margin;
        }

        // 日期和心情
        const headerText = `${entry.date} - ${config.emoji} ${moodLabel}`;
        const headerHeight = await addTextWithFallback(headerText, margin, yPos, 13, { 
          bold: true,
          maxWidth: contentWidth
        });
        yPos += headerHeight + 3;

        // 因素（带图标）
        if (factorLabels) {
          const factorsWithIcons = entry.factors
            .map((f: string) => {
              const factor = allFactors.find((o) => o.id === f);
              if (factor) {
                const label = factor.isCustom ? factor.label : t(`factors.${factor.id}`);
                const emoji = factor.emoji || '📌';
                return `${emoji} ${label}`;
              }
              return '';
            })
            .filter(Boolean)
            .join('，');
          
          const factorText = `${t('editor.factors')}: ${factorsWithIcons}`;
          const factorHeight = await addTextWithFallback(factorText, margin, yPos, 9, { 
            color: [80, 80, 80],
            maxWidth: contentWidth
          });
          yPos += factorHeight + 2;
        }

        // 照片信息
        if (entry.photos && entry.photos.length > 0) {
          const photoText = `📷 ${entry.photos.length} ${t('calendar.photos')}`;
          const photoHeight = await addTextWithFallback(photoText, margin, yPos, 8, { 
            color: [100, 100, 100],
            maxWidth: contentWidth
          });
          yPos += photoHeight + 2;
        }

        // 时间戳
        const timestampY = yPos;
        
        // 日记内容(处理换行和段落)
        const contentText = plainText || '(无内容)';
        // 按行分割内容，保留空行作为段落间隔
        const lines = contentText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // 跳过空行，但保留段落间距
          if (!line) {
            yPos += 3; // 空行间距
            continue;
          }
          
          const lineHeight = await addTextWithFallback(line, margin, yPos, 10, { 
            color: [40, 40, 40],
            maxWidth: contentWidth
          });
          yPos += lineHeight + 2; // 行间距 2mm
          
          // 检查是否需要换页
          if (yPos > pageHeight - margin - 15) {
            doc.addPage();
            yPos = margin;
          }
        }
        
        // 时间戳位置在内容之后
        const timestampFinalY = yPos;
        
        if (entry.createdAt || entry.updatedAt) {
          // 左侧：创建日期
          let leftHeight = 0;
          if (entry.createdAt) {
            const createdDate = new Date(entry.createdAt).toLocaleDateString('zh-CN');
            leftHeight = await addTextWithFallback(
              `${t('journal.createdAt')}: ${createdDate}`,
              margin, 
              timestampFinalY,
              8, 
              { 
                color: [150, 150, 150],
                maxWidth: contentWidth / 2 - 2
              }
            );
          }
          
          // 右侧：更新日期
          let rightHeight = 0;
          if (entry.updatedAt) {
            const updatedDate = new Date(entry.updatedAt).toLocaleDateString('zh-CN');
            rightHeight = await addTextWithFallback(
              `${t('journal.updatedAt')}: ${updatedDate}`,
              margin + contentWidth / 2, 
              timestampFinalY, 
              8, 
              { 
                color: [150, 150, 150],
                maxWidth: contentWidth / 2 - 2
              }
            );
          }
          
          // 计算总高度（取两者中较高的）
          yPos = timestampFinalY + Math.max(leftHeight, rightHeight) + 4;
        }

        // 条目分隔线
        if (index < selectedEntries.length - 1) {
          if (yPos > pageHeight - margin - 15) {
            doc.addPage();
            yPos = margin;
          }
          doc.setDrawColor(220);
          doc.setLineWidth(0.3);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
        }
      }

      // 保存 PDF
      doc.save(`日记导出-${new Date().toISOString().split('T')[0]}.pdf`);
      setExportFormatDialogOpen(false);
      toast.success(t('journal.exportSuccess') || '导出成功');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.warning(t('journal.pdfExportFailed') || 'PDF 导出失败,已自动切换为 JSON 格式导出');
      handleExportJSON();
    }
  };

  // JSON 导出
  const handleExportJSON = () => {
    const selectedEntries = entries.filter((e) => selectedIds.has(e.id));
    if (selectedEntries.length === 0) return;

    const exportData = {
      exportDate: new Date().toISOString(),
      count: selectedEntries.length,
      entries: selectedEntries.map((entry) => {
        const config = MOOD_CONFIG[entry.mood];
        const plainText = entry.journal.replace(/<[^>]*>/g, '');
        const moodLabel = t(`mood.${entry.mood}`);
        const factorLabels = entry.factors
          .map((f) => {
            const factor = allFactors.find((o) => o.id === f);
            return factor ? (factor.isCustom ? factor.label : t(`factors.${factor.id}`)) : '';
          })
          .filter(Boolean)
          .join(', ');

        return {
          date: entry.date,
          mood: entry.mood,
          moodLabel: moodLabel,
          moodEmoji: config.emoji,
          factors: factorLabels,
          journal: entry.journal,
          journalPlainText: plainText,
          photos: entry.photos,
          photoCount: entry.photos?.length || 0,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          deletedAt: entry.deletedAt,
          id: entry.id,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportFormatDialogOpen(false);
  };

  const formatDate = (dateStr: string, showFullDate?: string | boolean) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];

    // 筛选模式下显示完整日期
    if (showFullDate || hasFilters) {
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    }

    if (dateStr === today) return t('journal.today');
    if (dateStr === yesterday) return t('journal.yesterday');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const weekDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const weekDays = t<string[]>('calendar.weekDays', {});
    return weekDays[d.getDay()];
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      selectedMoods: [],
      selectedFactors: [],
    });
    setPagination({ pageSize: 10, currentPage: 1 });
  };

  const handlePageSizeChange = (size: number) => {
    setPagination({ pageSize: size, currentPage: 1 });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const getPageRangeText = () => {
    const start = (pagination.currentPage - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.currentPage * pagination.pageSize, filteredEntries.length);
    return { start, end };
  };

  const hasActiveFilters =
    filters.search ||
    filters.startDate ||
    filters.endDate ||
    filters.selectedMoods.length > 0 ||
    filters.selectedFactors.length > 0;

  // 高亮搜索关键词
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const renderEntryCard = (entry: MoodEntry) => {
    const config = MOOD_CONFIG[entry.mood];
    const plainText = entry.journal.replace(/<[^>]*>/g, '');
    const isExpanded = expandedId === entry.id;
    const isSelected = selectedIds.has(entry.id);
    const entryFactors = entry.factors
      .map((f) => allFactors.find((o) => o.id === f))
      .filter(Boolean);
    const searchQuery = filters.search;

    return (
      <Card
        key={entry.id}
        className={cn(
          'cursor-pointer transition-all duration-200',
          isExpanded && 'shadow-elevated',
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={() => {
          if (isBatchMode) {
            toggleSelectEntry(entry.id);
          } else {
            setExpandedId(isExpanded ? null : entry.id);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {isBatchMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectEntry(entry.id);
                }}
                className="flex-shrink-0 mt-1"
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            )}

            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                config.bgClass
              )}
            >
              <span className="text-xl">{config.emoji}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">
                  {formatDate(entry.date, hasFilters)}
                </span>
                {!hasFilters && (
                  <span className="text-xs text-muted-foreground">{weekDay(entry.date)}</span>
                )}
                <span className={cn('text-xs font-medium', config.color)}>
                  {searchQuery
                    ? highlightText(t(`mood.${entry.mood}`), searchQuery)
                    : t(`mood.${entry.mood}`)}
                </span>
              </div>

              {plainText &&
                (isExpanded ? (
                  <div
                    className="text-sm text-foreground leading-relaxed mb-2 prose-sm"
                    dangerouslySetInnerHTML={{
                      __html: searchQuery
                        ? entry.journal.replace(
                            new RegExp(
                              `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
                              'gi'
                            ),
                            '<mark style="background-color: hsl(48 100% 50% / 0.4); border-radius: 2px; padding: 0 2px;">$1</mark>'
                          )
                        : entry.journal,
                    }}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground truncate">
                    {searchQuery ? highlightText(plainText, searchQuery) : plainText}
                  </p>
                ))}

              {entryFactors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entryFactors.map((f) => {
                    const factorLabel = f!.isCustom ? f!.label : t(`factors.${f!.id}`);
                    return (
                      <span
                        key={f!.id}
                        className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground"
                      >
                        {f!.emoji}{' '}
                        {searchQuery ? highlightText(factorLabel, searchQuery) : factorLabel}
                      </span>
                    );
                  })}
                </div>
              )}

              {isExpanded && entry.photos.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {entry.photos.map((p, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 rounded-lg overflow-hidden border border-border"
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEntry(entry.date);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                    {t('journal.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(entry.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    {t('journal.delete')}
                  </Button>
                </div>
              )}
            </div>

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
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('journal.title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('journal.recordCount', { count: filteredEntries.length })}
            {hasActiveFilters && ` (${t('journal.filtered')})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredEntries.length > 0 && (
            <Button
              variant={isBatchMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleBatchMode}
            >
              {isBatchMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('journal.exitBatchMode') || '退出批量'}
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {t('journal.batchMode') || '批量操作'}
                </>
              )}
            </Button>
          )}
          <Button onClick={() => onNewEntry()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('journal.newEntry')}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('journal.search')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-accent')}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('journal.filters')}
            {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-primary" />}
          </Button>

          {/* Sort Options */}
          <div className="flex items-center gap-1">
            {(['date', 'mood', 'wordCount'] as SortField[]).map((field) => (
              <button
                key={field}
                onClick={() => setSort((prev) => ({ ...prev, field }))}
                className={cn(
                  'h-8 px-3 text-xs rounded-lg border transition-colors',
                  sort.field === field
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input bg-background hover:bg-accent text-foreground'
                )}
              >
                {field === 'date' && t('journal.sortByDate')}
                {field === 'mood' && t('journal.sortByMood')}
                {field === 'wordCount' && t('journal.sortByWordCount')}
              </button>
            ))}
            <button
              onClick={() =>
                setSort((prev) => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))
              }
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-lg border transition-colors',
                sort.order === 'asc' ? 'rotate-0' : 'rotate-180'
              )}
              title={sort.order === 'asc' ? t('journal.ascending') : t('journal.descending')}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              {t('journal.clearFilters')}
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {t('journal.dateRange')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
              </div>

              {/* Mood Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('journal.filterByMood')}</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MOOD_CONFIG) as unknown as Mood[]).map((mood) => (
                    <button
                      key={mood}
                      onClick={() => {
                        const newMoods = filters.selectedMoods.includes(mood)
                          ? filters.selectedMoods.filter((m) => m !== mood)
                          : [...filters.selectedMoods, mood];
                        setFilters({ ...filters, selectedMoods: newMoods });
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5',
                        filters.selectedMoods.includes(mood)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border border-input hover:bg-accent'
                      )}
                    >
                      <span>{MOOD_CONFIG[mood].emoji}</span>
                      <span>{t(`mood.${mood}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Factor Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('journal.filterByFactor')}</label>
                <div className="flex flex-wrap gap-2">
                  {allFactors.map((factor) => (
                    <button
                      key={factor.id}
                      onClick={() => {
                        const newFactors = filters.selectedFactors.includes(factor.id)
                          ? filters.selectedFactors.filter((f) => f !== factor.id)
                          : [...filters.selectedFactors, factor.id];
                        setFilters({ ...filters, selectedFactors: newFactors });
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5',
                        filters.selectedFactors.includes(factor.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border border-input hover:bg-accent'
                      )}
                    >
                      <span>{factor.emoji}</span>
                      <span>{factor.isCustom ? factor.label : t(`factors.${factor.id}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Batch Operations Toolbar */}
      {isBatchMode && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  {t('journal.selectedCount', { count: selectedIds.size }) ||
                    `已选择 ${selectedIds.size} 条`}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {isAllSelected
                      ? t('journal.deselectAll') || '取消全选'
                      : t('journal.selectAll') || '全选所有'}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchExport}
                  disabled={selectedIds.size === 0}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {t('journal.batchExport') || '批量导出'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  disabled={selectedIds.size === 0}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {t('journal.batchDelete') || '批量删除'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-3xl mb-2">📖</p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? t('journal.noResultsWithFilters') : t('journal.noEntries')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Recent Entries (Within a week) - Hidden when filters are active */}
          {!hasFilters && groupedEntries.recent.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">
                {t('journal.recent')} ({t('journal.withinWeek')})
              </h3>
              <div className="space-y-2">{groupedEntries.recent.map(renderEntryCard)}</div>
            </div>
          )}

          {/* Filtered Results - Flat List with Pagination */}
          {hasFilters && groupedEntries.recent.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-1 flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                {t('journal.filteredResults') || '筛选结果'}
                <span className="text-xs font-normal">
                  ({getPageRangeText().start}-{getPageRangeText().end} / {filteredEntries.length}{' '}
                  {t('journal.entries')})
                </span>
              </h3>
              <div className="space-y-2">{groupedEntries.recent.map(renderEntryCard)}</div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 pt-4 pb-2">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t('journal.pageSize') || '每页'}
                    </span>
                    <div className="flex gap-1">
                      {[10, 20, 50].map((size) => (
                        <button
                          key={size}
                          onClick={() => handlePageSizeChange(size)}
                          className={cn(
                            'px-2 py-1 rounded text-xs transition-colors',
                            pagination.pageSize === size
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border border-input hover:bg-accent'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{t('journal.entries')}</span>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronFirst className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm text-muted-foreground">
                        {t('journal.page') || '页'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pagination.currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (!isNaN(page)) handlePageChange(page);
                        }}
                        className="w-12 h-8 text-center text-sm border border-input rounded-md bg-background"
                      />
                      <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={pagination.currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLast className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Archived Entries (Grouped by Year/Month/Week) */}
          {!hasFilters &&
            Array.from(
              (
                groupedEntries.archived as Map<string, Map<string, Map<string, MoodEntry[]>>>
              ).entries()
            ).map(([year, months]) => (
              <div key={year} className="space-y-2">
                {/* Year Header */}
                <button
                  onClick={() => toggleGroup(year)}
                  className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-md transition-transform duration-200',
                      expandedGroups.has(year) ? 'bg-primary/10 rotate-0' : 'bg-muted'
                    )}
                  >
                    {expandedGroups.has(year) ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {year}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {(() => {
                      let count = 0;
                      months.forEach((weeks: Map<string, MoodEntry[]>) => {
                        weeks.forEach((entries: MoodEntry[]) => {
                          count += entries.length;
                        });
                      });
                      return count;
                    })()}{' '}
                    {t('journal.entries')}
                  </span>
                  {isBatchMode && (<button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupSelection(year);
                      }}
                      className="ml-auto flex-shrink-0"
                    >
                      {isGroupFullySelected(year) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : isGroupPartiallySelected(year) ? (
                        <div className="h-5 w-5 rounded border-2 border-primary flex items-center justify-center">
                          <div className="h-2 w-2 bg-primary rounded-sm" />
                        </div>
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>)}
                </button>

                {expandedGroups.has(year) && (
                  <div className="space-y-2 pl-4 border-l-2 border-border/50 ml-5">
                    {Array.from(months.entries()).map(([month, weeks]) => (
                      <div key={`${year}-${month}`} className="space-y-2">
                        {/* Month Header */}
                        <button
                          onClick={() => toggleGroup(`${year}-${month}`)}
                          className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-accent/40 transition-all duration-200 group"
                        >
                          <div
                            className={cn(
                              'flex items-center justify-center w-5 h-5 rounded transition-transform duration-200',
                              expandedGroups.has(`${year}-${month}`)
                                ? 'bg-primary/10'
                                : 'bg-muted/60'
                            )}
                          >
                            {expandedGroups.has(`${year}-${month}`) ? (
                              <ChevronDown className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {month}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                            {Array.from(weeks.values()).reduce(
                              (acc, entries) => acc + entries.length,
                              0
                            )}{' '}
                            {t('journal.entries')}
                          </span>
                          {isBatchMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupSelection(year, month);
                              }}
                              className="ml-auto flex-shrink-0"
                            >
                              {isGroupFullySelected(year, month) ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : isGroupPartiallySelected(year, month) ? (
                                <div className="h-4 w-4 rounded border-2 border-primary flex items-center justify-center">
                                  <div className="h-1.5 w-1.5 bg-primary rounded-sm" />
                                </div>
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </button>

                        {expandedGroups.has(`${year}-${month}`) && (
                          <div className="space-y-2 pl-4 border-l-2 border-border/30 ml-4">
                            {Array.from(weeks.entries()).map(([week, weekEntries]) => (
                              <div key={`${year}-${month}-${week}`} className="space-y-2">
                                {/* Week Header */}
                                <button
                                  onClick={() => toggleGroup(`${year}-${month}-${week}`)}
                                  className="flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg hover:bg-accent/30 transition-all duration-200 group"
                                >
                                  <div
                                    className={cn(
                                      'flex items-center justify-center w-4 h-4 rounded transition-transform duration-200',
                                      expandedGroups.has(`${year}-${month}-${week}`)
                                        ? 'bg-primary/10'
                                        : 'bg-muted/40'
                                    )}
                                  >
                                    {expandedGroups.has(`${year}-${month}-${week}`) ? (
                                      <ChevronDown className="h-3 w-3 text-primary" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    {week}
                                  </span>
                                  <span className="text-xs text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded-full">
                                    {weekEntries.length} {t('journal.entries')}
                                  </span>
                                  {isBatchMode && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroupSelection(year, month, week);
                                      }}
                                      className="ml-auto flex-shrink-0"
                                    >
                                      {isGroupFullySelected(year, month, week) ? (
                                        <CheckSquare className="h-4 w-4 text-primary" />
                                      ) : isGroupPartiallySelected(year, month, week) ? (
                                        <div className="h-4 w-4 rounded border-2 border-primary flex items-center justify-center">
                                          <div className="h-1.5 w-1.5 bg-primary rounded-sm" />
                                        </div>
                                      ) : (
                                        <Square className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </button>
                                  )}
                                </button>

                                {expandedGroups.has(`${year}-${month}-${week}`) && (
                                  <div className="space-y-2 pl-3">
                                    {weekEntries.map(renderEntryCard)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t('journal.confirmDelete')}
        message={t('journal.deleteConfirmMessage') || '确定要删除这条日记吗？此操作无法撤销。'}
        confirmText={t('journal.delete')}
        cancelText={t('journal.cancel')}
        confirmVariant="destructive"
        onConfirm={() => entryToDelete && handleDelete(entryToDelete)}
        onCancel={closeDeleteDialog}
      />

      {/* Batch Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={batchDeleteDialogOpen}
        title={t('journal.confirmBatchDelete') || '确认批量删除'}
        message={
          t('journal.batchDeleteConfirmMessage', { count: selectedIds.size }) ||
          `确定要删除选中的 ${selectedIds.size} 条日记吗？此操作无法撤销。`
        }
        confirmText={t('journal.batchDelete') || '批量删除'}
        cancelText={t('journal.cancel')}
        confirmVariant="destructive"
        onConfirm={handleBatchDelete}
        onCancel={() => setBatchDeleteDialogOpen(false)}
      />

      {/* Export Format Selection Dialog */}
      <ExportFormatDialog
        isOpen={exportFormatDialogOpen}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onCancel={() => setExportFormatDialogOpen(false)}
      />
    </div>
  );
}
