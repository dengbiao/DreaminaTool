/**
 * 特性注册中心
 * 用于注册和管理所有特性
 */

import type FeatureFactory from '../core/feature-factory';
import DetailPageButtonFeature from './detail-page-button';
import ImageMattingButtonFeature from './image-matting-button';

/**
 * 注册所有特性类型
 * @param factory 特性工厂实例
 */
export function registerFeatureTypes(factory: FeatureFactory): void {
  // 注册详情页按钮特性
  factory.registerFeatureType('detailPageButton', DetailPageButtonFeature);
  
  // 注册抠图按钮特性
  factory.registerFeatureType('imageMattingButton', ImageMattingButtonFeature);
  
  // 在此注册其他特性类型...
}

/**
 * 默认特性配置列表
 */
export const defaultFeatures = [
  {
    type: 'detailPageButton',
    options: { 
      buttonText: '自定义导出',
      onClick: () => { alert('导出功能'); }
    }
  },
  {
    type: 'imageMattingButton',
    options: {
      buttonText: '抠图',
      onClick: (e: MouseEvent) => { 
        console.log('抠图功能被触发');
        alert('抠图功能已启动！'); 
      }
    }
  },
  // 其他特性配置...
];

// 重新导出特性类
export { DetailPageButtonFeature, ImageMattingButtonFeature }; 