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

  /**
   * 是否在元素移除时触发销毁
   * 当设置为true时，元素从DOM中移除会触发功能的destroy方法
   */
  onRemove?: boolean;
}

/**
 * DOM规则引擎
 */
export default class DOMRuleEngine implements RuleEngine {
  private intervalTimers: Map<string, number> = new Map();
  private previousElementsCount: Map<string, number> = new Map();

  /**
   * 评估DOM规则
   */
  evaluate(rule: Rule, context: RuleContext): boolean {
    const domRule = rule as DOMRule;
    const { selector, count, condition, attribute, attributeValue, checkInterval, onRemove } = domRule;
    const ruleKey = rule.type + selector;
    
    // 实现周期性检查逻辑
    if (checkInterval && !this.intervalTimers.has(ruleKey)) {
      // 设置一个定时器，定期重新评估规则
      const timerId = window.setInterval(() => {
        // 重新触发DOM变化检查
        document.dispatchEvent(new CustomEvent('dreamina-dom-check'));
      }, checkInterval);
      
      this.intervalTimers.set(ruleKey, timerId);
    }
    
    // 检查是否包含通配符选择器
    const elements = this.querySelectorWithWildcard(selector);
    
    // 处理元素移除逻辑
    if (onRemove === true) {
      const currentCount = elements.length;
      const previousCount = this.previousElementsCount.get(ruleKey) || 0;
      
      // 更新元素计数
      this.previousElementsCount.set(ruleKey, currentCount);
      
      // 如果元素数量减少为0，可能是元素被移除
      if (previousCount > 0 && currentCount === 0 && context.trigger === 'dom') {
        // 查找对应的功能实例并调用其destroy方法
        if (context.engine && typeof context.engine.getFeature === 'function') {
          const featureId = rule.featureId || '';
          const feature = context.engine.getFeature(featureId);
          
          if (feature && typeof feature.destroy === 'function') {
            // 获取特性的应用状态 - 只有已应用的特性才需要销毁
            const isApplied = feature.applied === true;
            
            if (isApplied) {
              console.log(`检测到DOM元素 ${selector} 已移除，销毁特性 ${featureId}`);
              setTimeout(() => feature.destroy(), 0); // 异步调用destroy，避免冲突
            }
          }
        }
        
        // 元素移除时返回false，表示不应该应用特性
        return false;
      }
    }
    
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
   * 使用通配符查询选择器
   * 支持类似 .className-\\w+ 的选择器模式
   */
  private querySelectorWithWildcard(selector: string): NodeListOf<Element> {
    // 检查选择器是否包含通配符
    if (selector.includes('\\w+') || selector.includes('\\d+') || selector.includes('\\w*')) {
      try {
        // 提取基础类名前缀
        const match = selector.match(/\.([^-\s]+)-/);
        if (match && match[1]) {
          const prefix = match[1];
          // 使用属性选择器模式查找元素
          const attrSelector = `[class*="${prefix}-"]`;
          return document.querySelectorAll(attrSelector);
        }
      } catch (error) {
        console.error('通配符选择器解析失败:', error);
      }
    }
    
    // 回退到标准查询
    try {
      return document.querySelectorAll(selector);
    } catch (error) {
      console.error('选择器查询失败:', selector, error);
      return document.querySelectorAll('body'); // 返回空结果集
    }
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