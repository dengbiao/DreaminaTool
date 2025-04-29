/**
 * 路由规则引擎
 * 基于URL路径匹配的规则引擎
 */

import type { Rule, RuleContext, RuleEngine } from './rule-engine';

/**
 * 路由规则特定属性
 */
export interface RouteRule extends Rule {
  /**
   * 匹配模式
   * 可以是字符串或正则表达式，也可以是数组
   */
  pattern: string | RegExp | (string | RegExp)[];
  
  /**
   * 是否精确匹配
   * 仅对字符串模式有效
   */
  exact?: boolean;
  
  /**
   * 排除模式
   * 可以是字符串或正则表达式，也可以是数组
   */
  exclude?: string | RegExp | (string | RegExp)[];
}

/**
 * 路由规则引擎
 */
export default class RouteRuleEngine implements RuleEngine {
  /**
   * 评估路由规则
   */
  evaluate(rule: Rule, context: RuleContext): boolean {
    const routeRule = rule as RouteRule;
    const { pattern, exact, exclude } = routeRule;
    const currentPath = window.location.pathname;
    const currentUrl = window.location.href;
    
    // 处理排除规则
    if (exclude) {
      if (Array.isArray(exclude)) {
        for (const exPath of exclude) {
          if (this._matchPath(currentPath, currentUrl, exPath, exact)) {
            return false;
          }
        }
      } else if (this._matchPath(currentPath, currentUrl, exclude, exact)) {
        return false;
      }
    }
    
    // 处理包含规则
    if (Array.isArray(pattern)) {
      return pattern.some(path => this._matchPath(currentPath, currentUrl, path, exact));
    }
    
    return this._matchPath(currentPath, currentUrl, pattern, exact);
  }
  
  /**
   * 路径匹配判断
   */
  private _matchPath(
    currentPath: string, 
    currentUrl: string, 
    pattern: string | RegExp, 
    exact?: boolean
  ): boolean {
    // 处理正则表达式
    if (pattern instanceof RegExp) {
      return pattern.test(currentUrl);
    }
    
    // 处理精确匹配
    if (exact) {
      return currentPath === pattern;
    }
    
    // 处理前缀匹配
    return currentPath.startsWith(pattern);
  }
} 