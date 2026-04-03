/**
 * 配置模块
 * 提供应用所需的配置数据和常量
 *
 * @module config
 */

export {
  MOOD_CONFIG,
  FACTOR_OPTIONS,
  COMMON_EMOJIS,
  CALENDAR_COLORS,
  DASHBOARD_CHART,
  HEATMAP_VALUE,
} from '@/core/config/mood';
export {
  PRESET_TEMPLATES,
  TEMPLATE_CATEGORY_ORDER,
  CATEGORY_ICONS,
  getAllTemplates,
  getTemplatesByCategory,
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  getFavoriteTemplateIds,
  getFavoriteTemplates,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  isFavorite,
  getRecentTemplateIds,
  getRecentTemplates,
  addToRecent,
  removeFromRecent,
  processTemplateContent,
} from '@/core/config/templates';
