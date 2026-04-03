'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/core/utils';
import { Card, CardContent } from '@/core/ui/card';
import { Button } from '@/core/ui/button';
import { Mood, MoodEntry, FactorOption } from '@/types';
import { MOOD_CONFIG, FACTOR_OPTIONS } from '@/core/config/mood';
import { deleteEntry, getCustomFactors } from '@/core/storage';
import { useTranslation } from '@/core/i18n';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  Image as ImageIcon,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  ChevronLeft,
  ChevronLast,
  ChevronFirst,
} from 'lucide-react';
import { ConfirmDialog } from '@/modules/common/components';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  // 过滤条目
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
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
  }, [entries, filters, allFactors, t]);

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
    const entryFactors = entry.factors
      .map((f) => allFactors.find((o) => o.id === f))
      .filter(Boolean);
    const searchQuery = filters.search;

    return (
      <Card
        key={entry.id}
        className={cn(
          'cursor-pointer transition-all duration-200',
          isExpanded && 'shadow-elevated'
        )}
        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
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
                  {t(`mood.${entry.mood}`)}
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
                  {entryFactors.map((f) => (
                    <span
                      key={f!.id}
                      className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground"
                    >
                      {f!.emoji} {f!.isCustom ? f!.label : t(`factors.${f!.id}`)}
                    </span>
                  ))}
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
        <Button onClick={() => onNewEntry()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('journal.newEntry')}
        </Button>
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
        <div className="flex items-center gap-2">
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
    </div>
  );
}
