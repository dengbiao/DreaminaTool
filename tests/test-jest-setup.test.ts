/**
 * 测试Jest设置
 */

import { describe, test, expect } from '@jest/globals';

describe('基础测试', () => {
  test('2 + 2 = 4', () => {
    expect(2 + 2).toBe(4);
  });
}); 