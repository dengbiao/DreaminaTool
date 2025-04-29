// @ts-nocheck
/**
 * DOM工具函数测试
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { waitForElement, createButton, createSiteStyledButton } from '../../src/utils/dom-utils';

describe('DOM工具函数', () => {
  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = '';
    
    // 重置计时器
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('waitForElement - 元素已存在', async () => {
    // 创建测试元素
    const testElement = document.createElement('div');
    testElement.id = 'test-element';
    document.body.appendChild(testElement);
    
    // 等待元素
    const result = await waitForElement('#test-element');
    
    // 断言
    expect(result).toBe(testElement);
  });
  
  test.skip('waitForElement - 等待元素出现', async () => {
    // 开始等待元素
    const waitPromise = waitForElement('#test-element');
    
    // 创建并添加元素
    setTimeout(() => {
      const testElement = document.createElement('div');
      testElement.id = 'test-element';
      document.body.appendChild(testElement);
    }, 100);
    
    // 快进时间
    jest.advanceTimersByTime(200);
    
    // 让其他异步操作完成
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // 获取结果
    const result = await waitPromise;
    
    // 断言
    expect(result).toBeTruthy();
    expect(result.id).toBe('test-element');
  }, 15000);
  
  test.skip('waitForElement - 超时', async () => {
    // 使用Promise捕获异步结果
    const waitPromise = waitForElement('#non-existent', 500);
    
    // 快进超时时间
    jest.advanceTimersByTime(600);
    
    // 让其他异步操作完成
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // 获取结果
    const result = await waitPromise;
    
    // 断言
    expect(result).toBeNull();
  }, 15000);
  
  test('createButton - 基本功能', () => {
    // 创建按钮
    const button = createButton({
      text: '测试按钮',
      className: 'test-btn',
      style: { color: 'red' }
    });
    
    // 断言
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent).toBe('测试按钮');
    expect(button.className).toBe('test-btn');
    expect(button.style.color).toBe('red');
  });
  
  test('createButton - 点击事件', () => {
    // 创建模拟点击处理器
    const mockClickHandler = jest.fn();
    
    // 创建按钮
    const button = createButton({
      text: '测试按钮',
      onClick: mockClickHandler
    });
    
    // 模拟点击
    button.click();
    
    // 断言
    expect(mockClickHandler).toHaveBeenCalled();
  });
  
  test('createSiteStyledButton - 复制现有按钮样式', () => {
    // 创建现有按钮
    const existingButton = document.createElement('button');
    existingButton.className = 'btn btn-primary disabled';
    document.body.innerHTML = `
      <div class="operation-buttons-area">
        ${existingButton.outerHTML}
      </div>
    `;
    
    // 创建站点风格按钮
    const button = createSiteStyledButton('测试按钮', jest.fn());
    
    // 断言
    expect(button.textContent).toBe('测试按钮');
    expect(button.className).toContain('btn');
    expect(button.className).toContain('btn-primary');
    expect(button.className).toContain('dreamina-custom-btn');
    expect(button.className).not.toContain('disabled');
  });
}); 