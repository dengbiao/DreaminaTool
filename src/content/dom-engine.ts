/**
 * DOM引擎入口文件
 * 初始化引擎和注册所有功能
 */

import DreaminaDOMEngine from '../core/engine';
import { registerRuleEngines } from '../core/rules';
import FeatureFactory from '../core/feature-factory';
import { registerFeatureTypes, defaultFeatures } from '../features';

/**
 * 初始化DOM引擎
 * @param config 引擎配置
 * @returns 引擎实例和API
 */
export function initDOMEngine(config = { debugMode: true }) {
  // 初始化引擎
  const engine = new DreaminaDOMEngine(config);

  // 注册规则引擎
  registerRuleEngines(engine);

  // 初始化特性工厂
  const featureFactory = new FeatureFactory(engine);

  // 注册特性类型
  registerFeatureTypes(featureFactory);

  // 从配置加载初始特性
  featureFactory.createFeaturesFromConfig(defaultFeatures);

  // 启动引擎
  engine.start();

  // 创建全局API
  const api = {
    engine,
    featureFactory,
    registerFeature: (type: string, options = {}) => {
      return featureFactory.createFeature(type, options);
    },
    unregisterFeature: (featureId: string) => {
      return engine.unregisterFeature(featureId);
    }
  };

  return api;
}

/**
 * 暴露全局API
 */
export function exposeGlobalAPI() {
  const api = initDOMEngine({
    debugMode: true,
    // @ts-ignore - 我们知道引擎支持这些配置项
    observeTarget: 'document',
    observeConfig: {
      childList: true,
      subtree: true,
      attributes: true
    }
  });
  
  // 导出全局API
  // @ts-ignore - 全局扩展
  window.__DreaminaTool = api;
  
  // 特别为特定功能创建实例
  api.featureFactory.createFeature('imageMattingButton', {
    buttonText: '抠图',
    onClick: (e: MouseEvent) => {
      console.log('抠图按钮被点击', e);
      alert('抠图功能已启动！');
    }
  });
  
  return api;
} 