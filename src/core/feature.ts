/**
 * 功能模块接口
 * 定义了所有功能模块必须实现的方法和属性
 */

import type DreaminaDOMEngine from './engine';
import type { Rule } from './rules/rule-engine';

export interface Feature {
  /**
   * 功能唯一标识符
   */
  id: string;
  
  /**
   * 功能名称
   */
  name: string;
  
  /**
   * 功能描述
   */
  description?: string;
  
  /**
   * 是否启用
   */
  enabled: boolean;
  
  /**
   * 是否已应用
   */
  applied: boolean;
  
  /**
   * 激活规则
   */
  rules?: Rule[];
  
  /**
   * 初始化功能
   * @param engine 引擎实例
   */
  init?(engine: DreaminaDOMEngine): void;
  
  /**
   * 检查功能是否应该被应用
   */
  shouldApply?(): boolean;
  
  /**
   * 应用功能
   */
  apply(): boolean;
  
  /**
   * 销毁功能
   */
  destroy?(): void;
  
  /**
   * 启用功能
   */
  enable?(): void;
  
  /**
   * 禁用功能
   */
  disable?(): void;
} 