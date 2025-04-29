/**
 * DOM规则引擎测试
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import DOMRuleEngine from '../../../src/core/rules/dom-rule';
import type { DOMRule } from '../../../src/core/rules/dom-rule';

describe('DOMRuleEngine', () => {
  let engine: DOMRuleEngine;
  
  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = `
      <div class="container">
        <div class="button-area">
          <button class="btn btn-primary">按钮1</button>
          <button class="btn btn-secondary" data-id="test">按钮2</button>
        </div>
      </div>
    `;
    
    engine = new DOMRuleEngine();
  });
  
  test('选择器匹配', () => {
    // 简单存在性检查
    const rule: DOMRule = { 
      type: 'dom',
      selector: '.btn' 
    };
    expect(engine.evaluate(rule, { trigger: 'dom' })).toBe(true);
    
    // 不存在的元素
    const notExistRule: DOMRule = { 
      type: 'dom',
      selector: '.not-exist' 
    };
    expect(engine.evaluate(notExistRule, { trigger: 'dom' })).toBe(false);
  });
  
  test('元素数量检查', () => {
    // 精确数量匹配
    const exactCountRule: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      count: 2
    };
    expect(engine.evaluate(exactCountRule, { trigger: 'dom' })).toBe(true);
    
    // 数量范围匹配
    const rangeCountRule: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      count: { min: 1, max: 3 }
    };
    expect(engine.evaluate(rangeCountRule, { trigger: 'dom' })).toBe(true);
    
    // 超出范围
    const outOfRangeRule: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      count: { min: 3 }
    };
    expect(engine.evaluate(outOfRangeRule, { trigger: 'dom' })).toBe(false);
  });
  
  test('属性检查', () => {
    // 属性值检查
    const attrRule: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      attribute: 'data-id',
      attributeValue: 'test'
    };
    expect(engine.evaluate(attrRule, { trigger: 'dom' })).toBe(true);
    
    // 正则属性检查
    const regexAttrRule: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      attribute: 'class',
      attributeValue: /secondary/
    };
    expect(engine.evaluate(regexAttrRule, { trigger: 'dom' })).toBe(true);
    
    // 不匹配的属性
    const nonMatchingAttrRule: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      attribute: 'data-id',
      attributeValue: 'wrong'
    };
    expect(engine.evaluate(nonMatchingAttrRule, { trigger: 'dom' })).toBe(false);
  });
  
  test('自定义条件检查', () => {
    // 自定义函数条件
    const conditionRule: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      condition: (elements) => {
        return Array.from(elements).some(el => el.textContent?.includes('按钮'));
      }
    };
    expect(engine.evaluate(conditionRule, { trigger: 'dom' })).toBe(true);
    
    // 不满足的自定义条件
    const notMatchingCondition: DOMRule = { 
      type: 'dom',
      selector: '.btn',
      condition: (elements) => {
        return Array.from(elements).some(el => el.textContent === '不存在的文本');
      }
    };
    expect(engine.evaluate(notMatchingCondition, { trigger: 'dom' })).toBe(false);
  });
}); 