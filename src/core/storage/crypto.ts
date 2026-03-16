/**
 * 加密/解密工具模块
 * 提供数据加密、解密、哈希等功能
 */

import { getSecuritySettings } from '@/core';

/**
 * 简单的字符串哈希函数
 * 用于密码和安全问题答案的哈希存储
 * @param str - 要哈希的字符串
 * @returns 哈希后的字符串（36进制）
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * 获取加密密钥
 * 使用当前密码哈希作为密钥，如果没有设置密码则使用默认密钥
 * @returns 加密密钥字符串
 */
function getEncryptionKey(): string {
  const security = getSecuritySettings();
  return security.passwordHash || 'default-key';
}

/**
 * 将字符串转换为 Uint8Array
 * 使用 TextEncoder 进行 UTF-8 编码
 * @param str - 要转换的字符串
 * @returns Uint8Array 字节数组
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * 将 Uint8Array 转换为字符串
 * 使用 TextDecoder 进行 UTF-8 解码
 * @param bytes - 要转换的字节数组
 * @returns 解码后的字符串
 */
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * 将 Uint8Array 转换为 Base64 字符串
 * @param bytes - 要转换的字节数组
 * @returns Base64 编码的字符串
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

/**
 * 将 Base64 字符串转换为 Uint8Array
 * @param base64 - Base64 编码的字符串
 * @returns 解码后的字节数组
 */
function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
}

/**
 * 使用 XOR 算法加密/解密字节数据
 * 由于 XOR 的特性，对同一数据执行两次相同操作会还原原数据
 * @param data - 要加密/解密的字节数组
 * @param key - 加密密钥
 * @returns 加密/解密后的字节数组
 */
function xorBytes(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = stringToBytes(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

/**
 * 加密数据
 * 将字符串转换为 UTF-8 字节，使用 XOR 加密，然后编码为 Base64
 * @param data - 要加密的明文字符串
 * @returns Base64 编码的加密字符串
 */
export function encryptData(data: string): string {
  const key = getEncryptionKey();
  const dataBytes = stringToBytes(data);
  const encryptedBytes = xorBytes(dataBytes, key);
  return bytesToBase64(encryptedBytes);
}

/**
 * 解密数据
 * 将 Base64 字符串解码，使用 XOR 解密，然后转换为 UTF-8 字符串
 * @param encryptedData - Base64 编码的加密字符串
 * @returns 解密后的明文字符串，解密失败则返回原字符串
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const encryptedBytes = base64ToBytes(encryptedData);
    const decryptedBytes = xorBytes(encryptedBytes, key);
    return bytesToString(decryptedBytes);
  } catch {
    return encryptedData;
  }
}
