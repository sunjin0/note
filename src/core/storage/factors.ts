/**
 * 自定义因素管理
 * 提供自定义心情影响因素的增删改查功能
 */

import { FactorOption } from '@/types';
import { CUSTOM_FACTORS_KEY } from './constants';
import { FACTOR_OPTIONS } from '@/core/config/mood';

/**
 * 获取所有自定义因素
 * @returns 自定义因素数组，如果读取失败则返回空数组
 * @remarks 在服务端渲染（SSR）环境下返回空数组
 */
export function getCustomFactors(): FactorOption[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CUSTOM_FACTORS_KEY);
    if (!data) return [];
    return JSON.parse(data) as FactorOption[];
  } catch {
    return [];
  }
}

/**
 * 保存自定义因素列表
 * @param factors - 要保存的自定义因素数组
 * @remarks 在服务端渲染（SSR）环境下不执行任何操作
 */
export function saveCustomFactors(factors: FactorOption[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_FACTORS_KEY, JSON.stringify(factors));
}

/**
 * 添加自定义因素
 * @param factor - 要添加的因素数据（不含 isCustom 字段）
 * @returns 添加后的完整因素对象（包含 isCustom=true）
 */
export function addCustomFactor(factor: Omit<FactorOption, 'isCustom'>): FactorOption {
  const customFactors = getCustomFactors();
  const newFactor: FactorOption = {
    ...factor,
    isCustom: true,
  };
  customFactors.push(newFactor);
  saveCustomFactors(customFactors);
  return newFactor;
}

/**
 * 更新自定义因素
 * @param id - 要更新的因素 id
 * @param updates - 要更新的字段部分数据
 * @returns 更新后的完整因素对象，如果未找到则返回 null
 */
export function updateCustomFactor(id: string, updates: Partial<FactorOption>): FactorOption | null {
  const customFactors = getCustomFactors();
  const index = customFactors.findIndex(f => f.id === id);
  if (index < 0) return null;

  customFactors[index] = { ...customFactors[index], ...updates };
  saveCustomFactors(customFactors);
  return customFactors[index];
}

/**
 * 删除自定义因素
 * @param id - 要删除的因素 id
 * @returns 是否成功删除（找到并删除了因素返回 true，未找到返回 false）
 */
export function deleteCustomFactor(id: string): boolean {
  const customFactors = getCustomFactors();
  const filtered = customFactors.filter(f => f.id !== id);
  if (filtered.length === customFactors.length) return false;
  saveCustomFactors(filtered);
  return true;
}

/**
 * 重新排序自定义因素
 * @param factors - 排序后的因素数组
 * @remarks 直接替换整个因素列表，用于拖拽排序后保存
 */
export function reorderCustomFactors(factors: FactorOption[]): void {
  saveCustomFactors(factors);
}

/**
 * 获取所有因素（预设 + 自定义）
 * @returns 包含预设因素和自定义因素的完整数组
 */
export function getAllFactors(): FactorOption[] {
  const customFactors = getCustomFactors();
  return [...FACTOR_OPTIONS, ...customFactors];
}
