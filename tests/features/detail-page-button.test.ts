// @ts-nocheck
/**
 * 详情页按钮特性测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import DetailPageButtonFeature from '../../src/features/detail-page-button';
import * as domUtils from '../../src/utils/dom-utils';
import DreaminaDOMEngine from '../../src/core/engine';

// 模拟DOM工具函数
jest.mock('../../src/utils/dom-utils', () => ({
  waitForElement: jest.fn(),
  createSiteStyledButton: jest.fn()
}));

describe('DetailPageButtonFeature', () => {
  let feature: DetailPageButtonFeature;
  let mockEngine: DreaminaDOMEngine;
  let mockButton: HTMLButtonElement;
  let mockContainer: HTMLDivElement;
  
  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = '';
    
    // 模拟引擎
    mockEngine = {
      logger: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      }
    } as any;
    
    // 模拟按钮和容器
    mockButton = document.createElement('button');
    mockButton.textContent = '自定义按钮';
    mockButton.className = 'test-button';
    
    mockContainer = document.createElement('div');
    mockContainer.className = 'operation-buttons-area';
    
    // 设置domUtils模拟
    (domUtils.createSiteStyledButton as jest.Mock).mockReturnValue(mockButton);
    (domUtils.waitForElement as jest.Mock).mockResolvedValue(mockContainer);
    
    // 创建特性实例
    feature = new DetailPageButtonFeature({
      buttonText: '测试按钮',
      onClick: jest.fn()
    });
    
    // 初始化特性
    feature.init(mockEngine);
  });
  
  test('特性初始化', () => {
    expect(feature.id).toBe('detailPageButton');
    expect(feature.name).toBe('详情页添加按钮');
    expect(feature.applied).toBe(false);
  });
  
  test('shouldApply条件检查', () => {
    // 默认启用
    expect(feature.shouldApply()).toBe(true);
    
    // 禁用后
    feature.disable();
    expect(feature.shouldApply()).toBe(false);
    
    // 已应用后
    feature.enable();
    feature.apply();
    expect(feature.shouldApply()).toBe(false);
  });
  
  test('apply添加按钮', async () => {
    // 应用特性
    const result = feature.apply();
    expect(result).toBe(true);
    
    // 检查waitForElement是否被调用
    expect(domUtils.waitForElement).toHaveBeenCalledWith('.operation-buttons-area');
    
    // 等待Promise解析
    await Promise.resolve();
    
    // 检查createSiteStyledButton是否被调用
    expect(domUtils.createSiteStyledButton).toHaveBeenCalledWith(
      '测试按钮',
      expect.any(Function)
    );
  });
  
  test('destroy移除按钮', async () => {
    // 先应用特性添加按钮
    feature.apply();
    await Promise.resolve();
    
    // 将按钮添加到DOM
    document.body.appendChild(mockContainer);
    mockContainer.appendChild(mockButton);
    mockButton.className = 'dreamina-custom-button';
    
    // 销毁特性
    feature.destroy();
    
    // 检查按钮是否被移除
    expect(mockContainer.contains(mockButton)).toBe(false);
  });
}); 