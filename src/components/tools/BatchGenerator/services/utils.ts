/**
 * 从cookie中读取web_id
 */
export function getCookieValue(name: string): string {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成随机种子
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 4294967295);
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 随机延迟
 */
export function randomDelay(min: number, max: number): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return delay(ms);
} 