// @ts-nocheck
/**
 * 引擎单元测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import DreaminaDOMEngine from '../../src/core/engine';
import type { Feature } from '../../src/core/feature';
import type { RuleEngine } from '../../src/core/rules/rule-engine';

// 模拟DOM环境
document.body.innerHTML = '<div id="app"></div>';

// 定义MutationObserver模拟类型
interface MockMutationObserver {
  observe: jest.Mock;
  disconnect: jest.Mock;
  trigger: (mutations: MutationRecord[]) => void;
}

describe('DreaminaDOMEngine', () => {
  let engine: DreaminaDOMEngine;
  
  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = '<div id="app"></div>';
    
    // 创建引擎实例
    engine = new DreaminaDOMEngine({
      debugMode: false,
      observeTarget: 'body'
    });
    
    // 模拟MutationObserver
    global.MutationObserver = jest.fn(function(this: MockMutationObserver, callback) {
      this.observe = jest.fn();
      this.disconnect = jest.fn();
      this.trigger = (mutations: MutationRecord[]) => callback(mutations, this);
    } as any);
  });
  
  test('引擎初始化', () => {
    expect(engine.ruleEngines.size).toBe(0);
  });
  
  test('注册特性', () => {
    const mockFeature: Feature = {
      id: 'testFeature',
      name: 'Test Feature',
      enabled: true,
      applied: false,
      init: jest.fn(),
      shouldApply: jest.fn().mockReturnValue(true),
      apply: jest.fn().mockReturnValue(true)
    };
    
    engine.registerFeature(mockFeature);
    
    const feature = engine.getFeature('testFeature');
    expect(feature).toBe(mockFeature);
  });
  
  test('注册规则引擎', () => {
    const mockRuleEngine: RuleEngine = {
      evaluate: jest.fn().mockReturnValue(true)
    };
    
    engine.registerRuleEngine('test', mockRuleEngine);
    expect(engine.ruleEngines.size).toBe(1);
    expect(engine.ruleEngines.get('test')).toBe(mockRuleEngine);
  });
  
  test('启动引擎初始化特性', () => {
    const mockFeature: Feature = {
      id: 'testFeature',
      name: 'Test Feature',
      enabled: true,
      applied: false,
      init: jest.fn(),
      shouldApply: jest.fn().mockReturnValue(true),
      apply: jest.fn().mockReturnValue(true)
    };
    
    engine.registerFeature(mockFeature);
    engine.start();
    
    expect(mockFeature.init).toHaveBeenCalledWith(engine);
  });
  
  test('DOM变化时应用特性', () => {
    const mockFeature: Feature = {
      id: 'testFeature',
      name: 'Test Feature',
      enabled: true,
      applied: false,
      shouldApply: jest.fn().mockReturnValue(true),
      apply: jest.fn().mockReturnValue(true)
    };
    
    engine.registerFeature(mockFeature);
    engine.start();
    
    // 获取MutationObserver实例
    const observer = (MutationObserver as jest.Mock).mock.instances[0];
    
    // 触发DOM变化
    const mutations = [{ type: 'childList' }] as MutationRecord[];
    observer.trigger(mutations);
    
    expect(mockFeature.shouldApply).toHaveBeenCalled();
    expect(mockFeature.apply).toHaveBeenCalled();
  });
  
  test('注销特性', () => {
    const mockFeature: Feature = {
      id: 'testFeature',
      name: 'Test Feature',
      enabled: true,
      applied: false,
      destroy: jest.fn(),
      apply: jest.fn().mockReturnValue(true)
    };
    
    engine.registerFeature(mockFeature);
    engine.unregisterFeature('testFeature');
    
    expect(engine.getFeature('testFeature')).toBeUndefined();
    expect(mockFeature.destroy).toHaveBeenCalled();
  });
}); 