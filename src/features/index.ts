/**
 * 特性注册中心
 * 用于注册和管理所有特性
 */

import type FeatureFactory from '../core/feature-factory';
import ImageMattingButtonFeature from './image-matting-button';
import HideReferenceTextFeature from './hide-reference-text';
import BatchModeButtonFeature from './batch-mode-button';

/**
 * 注册所有特性类型
 * @param factory 特性工厂实例
 */
export function registerFeatureTypes(factory: FeatureFactory): void {
  
  // 注册抠图按钮特性
  factory.registerFeatureType('imageMattingButton', ImageMattingButtonFeature);
  
  // 注册隐藏参考图文本特性
  factory.registerFeatureType('hideReferenceText', HideReferenceTextFeature);
  
  // 注册批量模式按钮特性
  factory.registerFeatureType('batchModeButton', BatchModeButtonFeature);
  
  // 在此注册其他特性类型...
}

/**
 * 默认特性配置列表
 */
export const defaultFeatures = [
  {
    type: 'imageMattingButton',
  },
  {
    type: 'hideReferenceText',
  },
  {
    type: 'batchModeButton',
  },
  // 其他特性配置...
];

// 重新导出特性类
export { 
  ImageMattingButtonFeature,
  HideReferenceTextFeature,
  BatchModeButtonFeature
}; 