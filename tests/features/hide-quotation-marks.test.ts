/**
 * 隐藏引号按钮特性测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import HideQuotationMarksFeature from '../../src/features/hide-quotation-marks';

describe('HideQuotationMarksFeature', () => {
  let feature: HideQuotationMarksFeature;
  
  beforeEach(() => {
    // 清理之前的测试DOM
    document.body.innerHTML = '';
    
    // 创建特性实例
    feature = new HideQuotationMarksFeature({ debug: true });
    
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
  
  test('应该正确创建隐藏引号按钮特性实例', () => {
    expect(feature).toBeInstanceOf(HideQuotationMarksFeature);
    expect(feature.id).toBe('hideQuotationMarks');
  });
  
  test('当没有引号按钮时，apply应该返回false', () => {
    const result = feature.apply();
    expect(result).toBe(false);
  });
  
  test('当有引号按钮时，应该隐藏元素', () => {
    // 创建模拟引号按钮元素
    const element = document.createElement('div');
    element.className = 'insertQuotationMarksWrap-abc123';
    element.style.display = 'block';
    document.body.appendChild(element);
    
    // 应用特性
    const result = feature.apply();
    
    // 验证结果
    expect(result).toBe(true);
    
    // 验证元素已被隐藏
    expect(element.style.display).toBe('none');
    
    // 检查是否保存了原始样式
    expect(element.getAttribute('data-original-display')).toBe('block');
  });
  
  test('已经隐藏的元素不会被重复处理', () => {
    // 创建模拟引号按钮元素，已经处于隐藏状态
    const element = document.createElement('div');
    element.className = 'insertQuotationMarksWrap-abc123';
    element.style.display = 'none';
    document.body.appendChild(element);
    
    // 应用特性
    const result = feature.apply();
    
    // 验证结果（已隐藏的元素不会被计入修改数量）
    expect(result).toBe(false);
    
    // 验证没有添加数据属性
    expect(element.hasAttribute('data-original-display')).toBe(false);
  });
  
  test('destroy应该恢复元素原始样式', () => {
    // 创建模拟引号按钮元素
    const element1 = document.createElement('div');
    element1.className = 'insertQuotationMarksWrap-abc123';
    element1.style.display = 'flex';
    
    const element2 = document.createElement('div');
    element2.className = 'insertQuotationMarksWrap-def456';
    element2.style.display = 'inline-block';
    
    document.body.appendChild(element1);
    document.body.appendChild(element2);
    
    // 应用特性
    feature.apply();
    
    // 验证元素已被隐藏
    expect(element1.style.display).toBe('none');
    expect(element2.style.display).toBe('none');
    
    // 验证原始样式被保存
    expect(element1.getAttribute('data-original-display')).toBe('flex');
    expect(element2.getAttribute('data-original-display')).toBe('inline-block');
    
    // 销毁特性
    feature.destroy();
    
    // 验证原始样式已被恢复
    expect(element1.style.display).toBe('flex');
    expect(element2.style.display).toBe('inline-block');
    
    // 验证自定义属性已被移除
    expect(element1.hasAttribute('data-original-display')).toBe(false);
    expect(element2.hasAttribute('data-original-display')).toBe(false);
  });
  
  test('使用带通配符的选择器能正确查找元素', () => {
    // 创建两个不同类名的引号按钮元素
    const element1 = document.createElement('div');
    element1.className = 'insertQuotationMarksWrap-abc123';
    
    const element2 = document.createElement('div');
    element2.className = 'insertQuotationMarksWrap-def456';
    
    document.body.appendChild(element1);
    document.body.appendChild(element2);
    
    // 应用特性
    const result = feature.apply();
    
    // 验证结果
    expect(result).toBe(true);
    
    // 验证两个元素都被隐藏
    expect(element1.style.display).toBe('none');
    expect(element2.style.display).toBe('none');
  });
}); 