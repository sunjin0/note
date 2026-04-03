/**
 * 通用工具函数
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 进行条件类名合并，使用 tailwind-merge 解决类名冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
