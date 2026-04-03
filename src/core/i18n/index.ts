/**
 * 国际化模块
 * 提供多语言支持和翻译功能
 *
 * @module i18n
 */

// 类型导出
export type {
  Locale,
  I18nContextType,
  I18nProviderProps,
  TranslateFunction,
  Resources,
} from '@/core/i18n/types';

// Provider 和 Hooks 导出
export {
  I18nProvider,
  useTranslation,
  useLocale,
  useMoodLabel,
  useFactorLabel,
} from '@/core/i18n/provider';

// 语言资源导出（用于类型推断）
export { default as zhCN } from '@/core/i18n/locales/zh-CN.json';
export { default as enUS } from '@/core/i18n/locales/en-US.json';
