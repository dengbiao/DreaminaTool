/**
 * 示例注册中心
 */

import type FeatureFactory from '../core/feature-factory';
import ExportButtonFeature from './add-export-button';

/**
 * 注册示例特性
 * @param factory 特性工厂
 */
export function registerExamples(factory: FeatureFactory): void {
  // 注册导出按钮特性
  factory.registerFeatureType('exportButton', ExportButtonFeature);
}

/**
 * 示例特性配置
 */
export const exampleFeatures = [
  {
    type: 'exportButton',
    options: {
      format: 'json',
      buttonText: '导出JSON'
    }
  },
  {
    type: 'exportButton',
    options: {
      format: 'csv',
      buttonText: '导出CSV',
      id: 'exportCsvButton' // 自定义ID避免冲突
    }
  }
];

// 重新导出示例特性
export { ExportButtonFeature }; 