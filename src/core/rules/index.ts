/**
 * 规则引擎注册中心
 * 用于注册和管理所有规则引擎
 */

import type DreaminaDOMEngine from '../engine';
import { RuleEngine } from './rule-engine';
import RouteRuleEngine from './route-rule';
import DOMRuleEngine from './dom-rule';
import CombinedRuleEngine from './combined-rule';

/**
 * 注册所有规则引擎
 * @param engine 引擎实例
 */
export function registerRuleEngines(engine: DreaminaDOMEngine): void {
  engine.registerRuleEngine('route', new RouteRuleEngine());
  engine.registerRuleEngine('dom', new DOMRuleEngine());
  engine.registerRuleEngine('combined', new CombinedRuleEngine(engine));
}

// 重新导出规则类型和引擎接口
export * from './rule-engine';
export * from './route-rule';
export * from './dom-rule';
export * from './combined-rule'; 