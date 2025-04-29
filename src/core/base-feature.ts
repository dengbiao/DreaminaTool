/**
 * 功能模块基类
 * 提供通用的功能模块实现
 */

import type DreaminaDOMEngine from './engine';
import type { Feature } from './feature';
import type { Rule } from './rules/rule-engine';

export interface FeatureOptions {
  id?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  rules?: Rule[];
}

/**
 * 功能模块基类
 */
export default class BaseFeature implements Feature {
  public id: string;
  public name: string;
  public description: string;
  public enabled: boolean;
  public applied: boolean;
  public rules: Rule[];
  protected engine: DreaminaDOMEngine | null;

  /**
   * 创建功能模块实例
   * @param options 功能模块选项
   */
  constructor(options: FeatureOptions = {}) {
    this.id = options.id || this.constructor.name;
    this.name = options.name || this.id;
    this.description = options.description || '';
    this.rules = options.rules || [];
    this.engine = null;
    this.applied = false;
    this.enabled = options.enabled !== false; // 默认启用
  }
  
  /**
   * 初始化方法
   * @param engine 引擎实例
   */
  init(engine: DreaminaDOMEngine): void {
    this.engine = engine;
  }
  
  /**
   * 销毁方法
   */
  destroy(): void {
    // 清理特性创建的资源
    // 由子类实现具体逻辑
    this.applied = false;
  }
  
  /**
   * 是否应用特性的判断方法
   */
  shouldApply(): boolean {
    return this.enabled && !this.applied;
  }
  
  /**
   * 应用特性
   * 必须由子类实现
   */
  apply(): boolean {
    // 由子类实现具体逻辑
    if (!this.shouldApply()) return false;
    this.applied = true;
    return true;
  }
  
  /**
   * 启用特性
   */
  enable(): void {
    this.enabled = true;
  }
  
  /**
   * 禁用特性
   */
  disable(): void {
    this.enabled = false;
  }
} 