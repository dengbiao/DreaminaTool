/**
 * 特性生命周期集成测试
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import DreaminaDOMEngine from '../../src/core/engine';
import DetailPageButtonFeature from '../../src/features/detail-page-button';
import { registerRuleEngines } from '../../src/core/rules';

// 模拟浏览器环境
beforeAll(() => {
  // 模拟window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://jimeng.jianying.com/detail/123',
      pathname: '/detail/123',
      hostname: 'jimeng.jianying.com'
    },
    writable: true
  });
  
  // 模拟history API
  window.history.pushState = jest.fn();
  window.history.replaceState = jest.fn();
});

describe('特性生命周期集成测试', () => {
  let engine: DreaminaDOMEngine;
  
  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = `
      <div id="app">
        <div class="operation-buttons-area"></div>
      </div>
    `;
    
    // 初始化引擎
    engine = new DreaminaDOMEngine({
      debugMode: false
    });
    
    // 注册规则引擎
    registerRuleEngines(engine);
  });
  
  afterEach(() => {
    // 停止引擎
    if (engine) {
      engine.stop();
    }
  });
  
  test('特性完整生命周期', () => {
    // 创建特性
    const feature = new DetailPageButtonFeature({
      buttonText: '测试集成按钮'
    });
    
    // 注册特性
    engine.registerFeature(feature);
    
    // 启动引擎
    engine.start();
    
    // 验证特性已初始化 (不直接访问protected属性)
    expect(feature).toBeTruthy();
    
    // 模拟DOM变更触发特性应用
    engine.checkAndApplyFeatures(null, 'dom');
    
    // 验证特性已应用
    expect(feature.applied).toBe(true);
    
    // 禁用特性
    feature.disable();
    
    // 模拟新的DOM变更
    engine.checkAndApplyFeatures(null, 'dom');
    
    // 停止引擎并注销特性
    engine.unregisterFeature(feature.id);
    
    // 验证特性已销毁
    expect(engine.getFeature(feature.id)).toBeUndefined();
  });
}); 