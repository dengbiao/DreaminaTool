/**
 * DOM规则引擎 onRemove 功能测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import DOMRuleEngine from '../../../src/core/rules/dom-rule';
import type { DOMRule } from '../../../src/core/rules/dom-rule';

describe('DOMRuleEngine - onRemove 功能', () => {
  let engine: DOMRuleEngine;
  const mockFeature = {
    destroy: jest.fn()
  };
  const mockEngine = {
    getFeature: jest.fn().mockReturnValue(mockFeature)
  };
  
  beforeEach(() => {
    // 启用假计时器
    jest.useFakeTimers();
    
    // 重置DOM和mock
    document.body.innerHTML = `
      <div class="workDetailWrap-xyz123">
        <div class="edit-area">
          <button class="edit-button">编辑</button>
        </div>
      </div>
    `;
    
    engine = new DOMRuleEngine();
    
    // 重置所有mock
    jest.clearAllMocks();
  });
  
  // 在每个测试后恢复真实计时器
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('元素存在时不调用destroy', () => {
    // 创建带有onRemove的规则
    const rule: DOMRule = { 
      type: 'dom',
      selector: '.workDetailWrap-xyz123',
      onRemove: true,
      featureId: 'testFeature'
    };
    
    // 第一次评估，元素存在
    const result = engine.evaluate(rule, { 
      trigger: 'dom', 
      engine: mockEngine 
    });
    
    expect(result).toBe(true);
    expect(mockEngine.getFeature).not.toHaveBeenCalled();
    expect(mockFeature.destroy).not.toHaveBeenCalled();
  });
  
  test('元素被移除时调用destroy', () => {
    // 创建带有onRemove的规则
    const rule: DOMRule = { 
      type: 'dom',
      selector: '.workDetailWrap-xyz123',
      onRemove: true,
      featureId: 'testFeature'
    };
    
    // 第一次评估，元素存在
    engine.evaluate(rule, { 
      trigger: 'dom', 
      engine: mockEngine 
    });
    
    // 模拟元素被移除
    document.body.innerHTML = `<div class="other-content"></div>`;
    
    // 第二次评估，元素不存在
    const result = engine.evaluate(rule, { 
      trigger: 'dom', 
      engine: mockEngine 
    });
    
    expect(result).toBe(false);
    
    // 运行所有计时器使setTimeout回调执行
    jest.runAllTimers();
    
    // 验证destroy被调用
    expect(mockEngine.getFeature).toHaveBeenCalledWith('testFeature');
    expect(mockFeature.destroy).toHaveBeenCalled();
  });
  
  test('元素变更但非移除时不调用destroy', () => {
    // 创建带有onRemove的规则
    const rule: DOMRule = { 
      type: 'dom',
      selector: '.workDetailWrap-xyz123',
      onRemove: true,
      featureId: 'testFeature'
    };
    
    // 第一次评估，元素存在
    engine.evaluate(rule, { 
      trigger: 'dom', 
      engine: mockEngine 
    });
    
    // 修改元素内容，但不移除
    document.querySelector('.workDetailWrap-xyz123')!.innerHTML = '<div>内容已修改</div>';
    
    // 第二次评估，元素仍然存在
    const result = engine.evaluate(rule, { 
      trigger: 'dom', 
      engine: mockEngine 
    });
    
    expect(result).toBe(true);
    expect(mockEngine.getFeature).not.toHaveBeenCalled();
    expect(mockFeature.destroy).not.toHaveBeenCalled();
  });
  
  test('仅在DOM触发器下才响应onRemove', () => {
    // 创建带有onRemove的规则
    const rule: DOMRule = { 
      type: 'dom',
      selector: '.workDetailWrap-xyz123',
      onRemove: true,
      featureId: 'testFeature'
    };
    
    // 第一次评估，元素存在，使用DOM触发器
    engine.evaluate(rule, { 
      trigger: 'dom', 
      engine: mockEngine 
    });
    
    // 模拟元素被移除
    document.body.innerHTML = `<div class="other-content"></div>`;
    
    // 第二次评估，元素不存在，但使用route触发器
    const result = engine.evaluate(rule, { 
      trigger: 'route', 
      engine: mockEngine 
    });
    
    // 不应调用destroy，因为触发器不是dom
    expect(mockFeature.destroy).not.toHaveBeenCalled();
  });
}); 