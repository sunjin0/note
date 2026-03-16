/**
 * 国际化模块类型定义
 */

import { ReactNode } from 'react';

/** 支持的语言类型 */
export type Locale = 'zh-CN' | 'en-US';

/** 翻译函数类型 */
export type TranslateFunction = <T = string>(key: string, params?: Record<string, string | number>) => T;

/** i18n Context 类型 */
export interface I18nContextType {
  /** 当前语言 */
  locale: Locale;
  /** 设置语言 */
  setLocale: (locale: Locale) => void;
  /** 翻译函数 */
  t: TranslateFunction;
}

/** i18n Provider 属性 */
export interface I18nProviderProps {
  children: ReactNode;
}

/** 语言资源对象类型 */
export type Resources = {
  'zh-CN': typeof import('./locales/zh-CN.json');
  'en-US': typeof import('./locales/en-US.json');
};
