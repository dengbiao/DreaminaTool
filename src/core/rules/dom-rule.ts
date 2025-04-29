/**
 * DOM规则引擎
 * 基于DOM元素匹配的规则引擎
 */

import type { Rule, RuleContext, RuleEngine } from './rule-engine';

/**
 * DOM规则特定属性
 */
export interface DOMRule extends Rule {
  /**
   * CSS选择器
   */
  selector: string;
  
  /**
   * 元素数量条件
   * 可以是精确数量或范围
   */
  count?: number | { min?: number; max?: number };
  
  /**
   * 元素属性名
   */
  attribute?: string;
  
  /**
   * 元素属性值匹配
   * 可以是字符串或正则表达式
   */
  attributeValue?: string | RegExp;
  
  /**
   * 自定义条件函数
   */
  condition?: (elements: NodeListOf<Element>, context: RuleContext) => boolean;

  /**
   * 检查周期(ms)
   * 对于特定需要定期检查的规则可以设置此项
   */
  checkInterval?: number;
}

/**
 * DOM规则引擎
 */
export default class DOMRuleEngine implements RuleEngine {
  private intervalTimers: Map<string, number> = new Map();

  /**
   * 评估DOM规则
   */
  evaluate(rule: Rule, context: RuleContext): boolean {
    const domRule = rule as DOMRule;
    const { selector, count, condition, attribute, attributeValue, checkInterval } = domRule;
    
    // 实现周期性检查逻辑
    if (checkInterval && !this.intervalTimers.has(rule.type + selector)) {
      // 设置一个定时器，定期重新评估规则
      const timerId = window.setInterval(() => {
        // 重新触发DOM变化检查
        document.dispatchEvent(new CustomEvent('dreamina-dom-check'));
      }, checkInterval);
      
      this.intervalTimers.set(rule.type + selector, timerId);
    }
    
    // 检查DOM元素是否存在
    const elements = document.querySelectorAll(selector);
    
    // 验证元素数量
    if (count !== undefined) {
      if (typeof count === 'number' && elements.length !== count) {
        return false;
      } else if (typeof count === 'object') {
        if (count.min !== undefined && elements.length < count.min) return false;
        if (count.max !== undefined && elements.length > count.max) return false;
      }
    }
    
    // 如果只需要检查元素存在性
    if (!condition && !attribute) {
      return elements.length > 0;
    }
    
    // 验证属性
    if (attribute) {
      return Array.from(elements).some(el => {
        const attrVal = el.getAttribute(attribute);
        if (attributeValue instanceof RegExp) {
          return attrVal !== null && attributeValue.test(attrVal);
        }
        return attrVal === attributeValue;
      });
    }
    
    // 验证自定义条件
    if (condition && typeof condition === 'function') {
      return condition(elements, context);
    }
    
    return elements.length > 0;
  }

  /**
   * 清理所有定时器
   */
  cleanup(): void {
    this.intervalTimers.forEach((timerId) => {
      window.clearInterval(timerId);
    });
    this.intervalTimers.clear();
  }
} 