/**
 * 存储管理类型定义
 * 定义存储相关的接口和类型
 */

import { MoodEntry, FactorOption } from '@/types';

/**
 * 应用设置接口
 */
export interface AppSettings {
  /** 是否启用数据加密 */
  encrypted: boolean;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 安全设置接口
 */
export interface SecuritySettings {
  /** 是否启用密码保护 */
  passwordEnabled: boolean;
  /** 密码哈希值 */
  passwordHash: string;
  /** 安全问题列表 */
  securityQuestions: SecurityQuestion[];
  /** 密码错误尝试次数 */
  lockoutAttempts: number;
  /** 锁定截止时间 */
  lockoutUntil: string | null;
}

/**
 * 安全问题接口
 */
export interface SecurityQuestion {
  /** 问题唯一标识 */
  id: string;
  /** 问题内容 */
  question: string;
  /** 答案哈希值 */
  answerHash: string;
}

/**
 * 暂存数据信息接口
 */
export interface DraftDataInfo {
  /** 数据大小（字节） */
  size: number;
  /** 格式化后的大小字符串 */
  formattedSize: string;
  /** 暂存条目数量 */
  count: number;
}

/**
 * 密码重置结果接口
 */
export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

/**
 * 锁定状态接口
 */
export interface LockoutStatus {
  isLocked: boolean;
  remainingMinutes: number;
}

/**
 * 安全问题选项接口
 */
export interface SecurityQuestionOption {
  id: string;
  questionKey: string;
  defaultQuestion: string;
}

/**
 * 安全问题答案接口
 */
export interface SecurityQuestionAnswer {
  question: string;
  answer: string;
}
