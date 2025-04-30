/**
 * 隐藏参考图按钮文本特性测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import HideReferenceTextFeature from '../../src/features/hide-reference-text';

describe('HideReferenceTextFeature', () => {
  let feature: HideReferenceTextFeature;
  
  beforeEach(() => {
    // 清理之前的测试DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // 创建特性实例
    feature = new HideReferenceTextFeature({ debug: true });
    
    // 模拟引擎
    feature['engine'] = {
      logger: {
        log: jest.fn(),
        error: jest.fn()
      }
    } as any;
  });
  
  afterEach(() => {
    // 销毁特性
    feature.destroy();
  });
  
  test('应该正确创建隐藏参考图按钮文本特性实例', () => {
    expect(feature).toBeInstanceOf(HideReferenceTextFeature);
    expect(feature.id).toBe('hideReferenceText');
  });
  
  test('当没有参考图按钮时，apply应该返回false', () => {
    const result = feature.apply();
    expect(result).toBe(false);
  });
  
  test('当有参考图按钮时，应该隐藏其中的文本', () => {
    // 创建模拟参考图按钮
    const button = document.createElement('div');
    button.className = 'referenceButton-abc123';
    
    const span = document.createElement('span');
    span.textContent = '导入参考图';
    span.style.width = 'inherit';
    
    button.appendChild(span);
    document.body.appendChild(button);
    
    // 应用特性
    const result = feature.apply();
    
    // 验证结果
    expect(result).toBe(true);
    
    // 验证文本已被隐藏
    expect(span.style.display).toBe('none');
    
    // 检查是否保存了原始样式
    expect(span.getAttribute('data-original-display')).toBe('');
  });
  
  test('destroy应该恢复原始样式', () => {
    // 创建模拟参考图按钮和两个不同的文本元素
    const button = document.createElement('div');
    button.className = 'referenceButton-abc123';
    
    const span1 = document.createElement('span');
    span1.textContent = '导入参考图';
    span1.style.display = 'inline-block';
    
    const span2 = document.createElement('span');
    span2.textContent = '导入参考图';
    span2.style.display = 'flex';
    
    button.appendChild(span1);
    button.appendChild(span2);
    document.body.appendChild(button);
    
    // 应用特性
    feature.apply();
    
    // 验证文本已被隐藏
    expect(span1.style.display).toBe('none');
    expect(span2.style.display).toBe('none');
    
    // 验证原始样式被保存
    expect(span1.getAttribute('data-original-display')).toBe('inline-block');
    expect(span2.getAttribute('data-original-display')).toBe('flex');
    
    // 销毁特性
    feature.destroy();
    
    // 验证原始样式已被恢复
    expect(span1.style.display).toBe('inline-block');
    expect(span2.style.display).toBe('flex');
    
    // 验证自定义属性已被移除
    expect(span1.hasAttribute('data-original-display')).toBe(false);
    expect(span2.hasAttribute('data-original-display')).toBe(false);
  });
  
  test('应该只隐藏包含"导入参考图"文本的span', () => {
    // 创建模拟参考图按钮
    const button = document.createElement('div');
    button.className = 'referenceButton-abc123';
    
    // 创建包含目标文本的span
    const targetSpan = document.createElement('span');
    targetSpan.textContent = '导入参考图';
    
    // 创建不包含目标文本的span
    const otherSpan = document.createElement('span');
    otherSpan.textContent = '其他文本';
    
    button.appendChild(targetSpan);
    button.appendChild(otherSpan);
    document.body.appendChild(button);
    
    // 应用特性
    feature.apply();
    
    // 验证只有目标文本被隐藏
    expect(targetSpan.style.display).toBe('none');
    expect(otherSpan.style.display).not.toBe('none');
  });
}); 