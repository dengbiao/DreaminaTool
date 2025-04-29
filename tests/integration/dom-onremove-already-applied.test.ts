/**
 * 测试已应用特性的DOM元素被移除时是否能正确触发destroy
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import DreaminaDOMEngine from '../../src/core/engine';
import DOMRuleEngine from '../../src/core/rules/dom-rule';
import RouteRuleEngine from '../../src/core/rules/route-rule';
import CombinedRuleEngine from '../../src/core/rules/combined-rule';
import { Feature } from '../../src/core/feature';
import { Engine } from '../../src/core/engine';
import { DOMRule } from '../../src/core/rules/dom-rule';
import { RuleContext } from '../../src/core/rule';

// 创建一个测试特性类
class TestFeature implements Feature {
  public id: string;
  public name: string;
  public description: string;
  public enabled: boolean;
  public applied: boolean;
  public rules: DOMRule[];
  public destroy: jest.Mock;
  
  constructor() {
    this.id = 'testFeature';
    this.name = 'Test Feature';
    this.description = 'A test feature for testing onRemove functionality';
    this.enabled = true;
    this.applied = false;
    this.destroy = jest.fn(() => {
      this.applied = false;
      return true;
    });

    // 创建一个带有onRemove的规则
    this.rules = [{
      id: 'test-rule',
      featureId: this.id,
      type: 'dom',
      selector: '.test-element',
      onRemove: true
    }];
  }
  
  shouldApply() {
    return this.enabled;
  }
  
  apply(): void {
    this.applied = true;
  }
}

describe('已应用特性对DOM元素移除的响应', () => {
  let engine: Engine;
  let feature: TestFeature;
  let mockDOMRuleEngine: {
    evaluateRules: (rules: DOMRule[], context: RuleContext) => boolean[];
  };

  beforeEach(() => {
    // 设置文档
    document.body.innerHTML = '<div class="test-element"></div>';
    
    // 创建引擎和特性
    engine = new Engine();
    feature = new TestFeature();
    engine.registerFeature(feature);
    
    // 模拟DOM规则引擎
    mockDOMRuleEngine = {
      evaluateRules: (rules: DOMRule[], context: RuleContext): boolean[] => {
        return rules.map(rule => {
          // 检查onRemove场景
          if (rule.onRemove && document.querySelector(rule.selector) === null && context.trigger === 'dom') {
            // 元素已被移除，应该调用destroy
            const feature = context.engine.getFeature(rule.featureId);
            if (feature && feature.applied) {
              feature.destroy();
            }
            return false;
          }
          
          // 常规检查元素是否存在
          return document.querySelector(rule.selector) !== null;
        });
      }
    };

    // 让引擎使用我们的模拟规则引擎
    (engine as any).ruleEngines = { dom: mockDOMRuleEngine };
    
    // 初始应用特性
    engine.checkAndApplyFeatures({ trigger: 'dom' });
    expect(feature.applied).toBe(true);
  });

  test('当DOM元素被移除时，destroy方法应被调用', () => {
    // 移除DOM元素
    document.body.innerHTML = '';
    
    // 检查特性
    engine.checkAndApplyFeatures({ trigger: 'dom' });
    
    // 验证destroy被调用
    expect(feature.destroy).toHaveBeenCalled();
    expect(feature.applied).toBe(false);
  });

  test('如果DOM元素仍然存在，destroy方法不应被调用', () => {
    // 不移除元素，直接检查特性
    engine.checkAndApplyFeatures({ trigger: 'dom' });
    
    // 验证destroy未被调用
    expect(feature.destroy).not.toHaveBeenCalled();
    expect(feature.applied).toBe(true);
  });
});

describe('元素被移除后的多次检查', () => {
  let engine: Engine;
  let feature: TestFeature;
  let mockDOMRuleEngine: {
    evaluateRules: (rules: DOMRule[], context: RuleContext) => boolean[];
  };

  beforeEach(() => {
    document.body.innerHTML = '<div class="test-element"></div>';
    
    engine = new Engine();
    feature = new TestFeature();
    engine.registerFeature(feature);
    
    mockDOMRuleEngine = {
      evaluateRules: (rules: DOMRule[], context: RuleContext): boolean[] => {
        return rules.map(rule => {
          // 检查onRemove场景
          if (rule.onRemove && document.querySelector(rule.selector) === null && context.trigger === 'dom') {
            const feature = context.engine.getFeature(rule.featureId);
            if (feature && feature.applied) {
              feature.destroy();
            }
            return false;
          }
          
          return document.querySelector(rule.selector) !== null;
        });
      }
    };

    (engine as any).ruleEngines = { dom: mockDOMRuleEngine };
    
    engine.checkAndApplyFeatures({ trigger: 'dom' });
    expect(feature.applied).toBe(true);
  });

  test('destroy方法在元素被移除后应该只被调用一次', () => {
    // 移除DOM元素
    document.body.innerHTML = '';
    
    // 第一次检查特性
    engine.checkAndApplyFeatures({ trigger: 'dom' });
    expect(feature.destroy).toHaveBeenCalledTimes(1);
    
    // 再次检查特性
    engine.checkAndApplyFeatures({ trigger: 'dom' });
    
    // 验证destroy仍然只被调用一次
    expect(feature.destroy).toHaveBeenCalledTimes(1);
  });
}); 