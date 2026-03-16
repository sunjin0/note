/**
 * 存储管理常量定义
 * 定义 localStorage 键名、默认安全问题等常量
 */

import { SecurityQuestionOption } from '@/core';

/** 日记条目存储键名 */
export const STORAGE_KEY = 'mood_journal_entries';

/** 应用设置存储键名 */
export const SETTINGS_KEY = 'mood_journal_settings';

/** 安全设置存储键名 */
export const SECURITY_KEY = 'mood_journal_security';

/** 会话信息存储键名 */
export const SESSION_KEY = 'mood_journal_session';

/** 自定义因素存储键名 */
export const CUSTOM_FACTORS_KEY = 'mood_journal_custom_factors';

/** 暂存数据键名前缀 */
export const DRAFT_KEY_PREFIX = 'mood_draft_';

/** 最小安全问题数量 */
export const MIN_SECURITY_QUESTIONS = 1;

/** 最大安全问题数量 */
export const MAX_SECURITY_QUESTIONS = 5;

/** 默认安全问题列表 */
export const DEFAULT_SECURITY_QUESTIONS: SecurityQuestionOption[] = [
  { id: 'q1', questionKey: 'security.questions.pet', defaultQuestion: '你童年宠物的名字是什么？' },
  { id: 'q2', questionKey: 'security.questions.school', defaultQuestion: '你小学的名字是什么？' },
  { id: 'q3', questionKey: 'security.questions.city', defaultQuestion: '你出生的城市是哪里？' },
  { id: 'q4', questionKey: 'security.questions.mother', defaultQuestion: '你母亲的娘家姓是什么？' },
  { id: 'q5', questionKey: 'security.questions.book', defaultQuestion: '你最喜欢的书是什么？' },
];

/** 默认应用设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  encrypted: false,
  createdAt: new Date().toISOString(),
};

/** 默认安全设置 */
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  passwordEnabled: false,
  passwordHash: '',
  securityQuestions: [],
  lockoutAttempts: 0,
  lockoutUntil: null,
};

// 导入类型用于默认设置
import { AppSettings, SecuritySettings } from '@/core';
