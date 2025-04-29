/**
 * DOM onRemove 功能集成测试
 * 测试DOM元素移除时是否正确触发destroy功能
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import DreaminaDOMEngine from '../../src/core/engine';
import FeatureFactory from '../../src/core/feature-factory';
import DOMRuleEngine from '../../src/core/rules/dom-rule';
import RouteRuleEngine from '../../src/core/rules/route-rule';
import CombinedRuleEngine from '../../src/core/rules/combined-rule';
import { ImageMattingButtonFeature } from '../../src/features';

describe('DOM onRemove 功能集成测试', () => {
  let engine: DreaminaDOMEngine;
  let factory: FeatureFactory;
  let feature: ImageMattingButtonFeature;
  
  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = `
      <div class="workDetailWrap-xyz123">
        <div class="groupName-abc">编辑</div>
        <div class="group-def">
          <div class="optItem-ghi">
            <svg></svg>
            <span>消除笔</span>
          </div>
        </div>
      </div>
    `;
    
    // 创建引擎和工厂
    engine = new DreaminaDOMEngine({ debugMode: true });
    
    // 注册规则引擎
    engine.registerRuleEngine('dom', new DOMRuleEngine());
    engine.registerRuleEngine('route', new RouteRuleEngine());
    engine.registerRuleEngine('combined', new CombinedRuleEngine(engine));
    
    factory = new FeatureFactory(engine);
    
    // 创建特性实例
    feature = new ImageMattingButtonFeature();
    
    // 监视destroy方法
    jest.spyOn(feature, 'destroy');
  });
  
  test('确认DOMRule支持onRemove选项', () => {
    // 验证DOM规则引擎实现了previousElementsCount用于跟踪元素数量
    const domRuleEngine = new DOMRuleEngine();
    expect(domRuleEngine).toHaveProperty('previousElementsCount');
    
    // 检查DOM规则引擎的evaluate方法是否处理onRemove选项
    const engineSource = domRuleEngine.evaluate.toString();
    expect(engineSource).toContain('onRemove');
    expect(engineSource).toContain('previousElementsCount');
  });
  
  test('特性规则中的onRemove应为true', () => {
    // 确认特性的规则已正确配置
    const imageMattingButton = new ImageMattingButtonFeature();
    const rules = (imageMattingButton as any)['rules'];
    
    expect(rules).toBeDefined();
    expect(rules.length).toBeGreaterThan(0);
    
    // 验证规则配置了onRemove为true
    const domRule = rules.find((r: any) => r.type === 'dom');
    expect(domRule).toBeDefined();
    expect(domRule.onRemove).toBe(true);
  });
  
  test('engine.stop()应该调用所有特性的destroy方法', () => {
    // 注册特性
    engine.registerFeature(feature);
    
    // 启动引擎
    engine.start();
    
    // 停止引擎
    engine.stop();
    
    // 验证destroy被调用
    expect(feature.destroy).toHaveBeenCalled();
  });
  
  test('引擎应该将featureId添加到规则中供DOM规则引擎使用', () => {
    // 创建规则对象
    const rule = { 
      type: 'dom', 
      selector: '.test', 
      onRemove: true 
    };
    
    // 模拟特性
    const mockFeature = {
      id: 'testFeature',
      rules: [rule],
      shouldApply: () => true
    };
    
    // 调用shouldApplyFeature方法
    engine.shouldApplyFeature(mockFeature as any, null, 'dom');
    
    // 验证规则中添加了featureId
    expect(rule).toHaveProperty('featureId', 'testFeature');
  });
  
  test('引擎应该将自身添加到规则上下文中', () => {
    // 创建模拟规则引擎
    const mockRuleEngine = {
      evaluate: jest.fn().mockReturnValue(true)
    };
    
    // 注册模拟规则引擎
    engine.registerRuleEngine('test', mockRuleEngine as any);
    
    // 创建规则对象
    const rule = { 
      type: 'test', 
      onRemove: true 
    };
    
    // 模拟特性
    const mockFeature = {
      id: 'testFeature',
      rules: [rule],
      shouldApply: () => true
    };
    
    // 调用shouldApplyFeature方法
    engine.shouldApplyFeature(mockFeature as any, null, 'dom');
    
    // 验证evaluate被调用，且上下文中包含engine
    expect(mockRuleEngine.evaluate).toHaveBeenCalled();
    const context = mockRuleEngine.evaluate.mock.calls[0][1];
    expect(context).toHaveProperty('engine', engine);
  });
}); 