/**
 * 特性工厂
 * 用于动态创建和注册特性
 */

import type DreaminaDOMEngine from './engine';
import type { Feature } from './feature';
import type { Constructor } from '../types/index';

export interface FeatureConfig {
  type: string;
  options?: Record<string, any>;
}

/**
 * 特性工厂类
 */
export default class FeatureFactory {
  private engine: DreaminaDOMEngine;
  private featureConstructors: Map<string, Constructor<Feature>>;

  /**
   * 创建特性工厂
   * @param engine 引擎实例
   */
  constructor(engine: DreaminaDOMEngine) {
    this.engine = engine;
    this.featureConstructors = new Map();
  }

  /**
   * 注册特性类型
   * @param type 特性类型标识
   * @param constructor 特性构造函数
   */
  registerFeatureType(type: string, constructor: Constructor<Feature>): this {
    this.featureConstructors.set(type, constructor);
    return this;
  }

  /**
   * 创建并注册特性实例
   * @param type 特性类型
   * @param options 特性配置选项
   */
  createFeature(type: string, options: Record<string, any> = {}): Feature | null {
    const Constructor = this.featureConstructors.get(type);
    
    if (!Constructor) {
      this.engine.logger.error(`未知的特性类型: ${type}`);
      return null;
    }
    
    try {
      const instance = new Constructor(options);
      this.engine.registerFeature(instance);
      return instance;
    } catch (err) {
      this.engine.logger.error(`创建特性[${type}]失败:`, err);
      return null;
    }
  }

  /**
   * 批量创建特性
   * @param configs 特性配置列表
   */
  createFeaturesFromConfig(configs: FeatureConfig[]): Feature[] {
    const features: Feature[] = [];
    
    for (const config of configs) {
      const { type, options } = config;
      const feature = this.createFeature(type, options);
      
      if (feature) {
        features.push(feature);
      }
    }
    
    return features;
  }
} 