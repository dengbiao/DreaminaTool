/**
 * 组合规则引擎
 * 用于组合多个规则形成复杂的判断逻辑
 */

import type DreaminaDOMEngine from '../engine';
import type { Rule, RuleContext, RuleEngine } from './rule-engine';

/**
 * 组合操作符
 */
export type Operator = 'AND' | 'OR' | 'NOT';

/**
 * 组合规则特定属性
 */
export interface CombinedRule extends Rule {
  /**
   * 组合操作符
   */
  operator: Operator;
  
  /**
   * 子规则列表
   */
  rules: Rule[];
}

/**
 * 组合规则引擎
 */
export default class CombinedRuleEngine implements RuleEngine {
  private engine: DreaminaDOMEngine;
  
  /**
   * 创建组合规则引擎
   * @param engine 核心引擎引用
   */
  constructor(engine: DreaminaDOMEngine) {
    this.engine = engine;
  }
  
  /**
   * 评估组合规则
   */
  evaluate(rule: Rule, context: RuleContext): boolean {
    const combinedRule = rule as CombinedRule;
    const { operator, rules } = combinedRule;
    
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return false;
    }
    
    // 获取各子规则的评估结果
    const results = rules.map(subRule => {
      const ruleEngine = this.engine.ruleEngines.get(subRule.type);
      if (!ruleEngine) return false;
      return ruleEngine.evaluate(subRule, context);
    });
    
    // 根据操作符组合结果
    switch (operator) {
      case 'AND':
        return results.every(result => result === true);
      case 'OR':
        return results.some(result => result === true);
      case 'NOT':
        // 对于NOT，只考虑第一个规则
        return !results[0];
      default:
        return false;
    }
  }
} 