/**
 * 规则引擎接口
 * 定义了所有规则引擎必须实现的方法
 */

/**
 * 规则上下文
 */
export interface RuleContext {
  mutations?: MutationRecord[] | null;
  trigger: string;
  [key: string]: any;
}

/**
 * 规则基础接口
 */
export interface Rule {
  /**
   * 规则类型
   */
  type: string;

  /**
   * 触发条件
   */
  triggerOn?: string[];

  /**
   * 其他规则特定属性
   */
  [key: string]: any;
}

/**
 * 规则引擎接口
 */
export interface RuleEngine {
  /**
   * 评估规则
   * @param rule 规则对象
   * @param context 规则上下文
   * @returns 规则是否满足
   */
  evaluate(rule: Rule, context: RuleContext): boolean;
} 