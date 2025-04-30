/**
 * 隐藏参考图按钮文本特性
 * 监听到界面上如果出现了 referenceButton-xxx 的div，则给它的子节点 <span>导入参考图</span> 增加 display:none 样式
 */

import BaseFeature from '../core/base-feature';
import type { FeatureOptions } from '../core/base-feature';
import type { Rule } from '../core/rules/rule-engine';

export interface HideReferenceTextOptions extends FeatureOptions {
  /**
   * 是否启用调试日志
   */
  debug?: boolean;
}

/**
 * 隐藏参考图按钮文本特性
 */
export default class HideReferenceTextFeature extends BaseFeature {
  private debug: boolean;
  private modifiedElements: Set<HTMLElement> = new Set();

  /**
   * 创建隐藏参考图按钮文本特性
   * @param options 特性配置选项
   */
  constructor(options: HideReferenceTextOptions = {}) {
    // 定义规则
    const rules: Rule[] = [
      {
        type: 'dom',
        selector: '.referenceButton-\\w+', // 匹配 referenceButton-xxx 类
        triggerOn: ['dom', 'route', 'custom'],
        checkInterval: 1000, // 每1秒检查一次
        onRemove: true // 当匹配的DOM元素被移除时触发destroy
      }
    ];
    
    super({
      id: 'hideReferenceText',
      name: '隐藏参考图按钮文本',
      description: '隐藏"导入参考图"按钮文本，保留图标',
      rules,
      ...options
    });
    
    this.debug = options.debug || false;
  }

  /**
   * 应用特性
   */
  apply(): boolean {
    if (!super.apply()) return false;
    
    try {
      // 查找目标元素
      const referenceButtons = document.querySelectorAll('[class*="referenceButton-"]');
      
      if (referenceButtons.length === 0) {
        if (this.debug) {
          console.log('未找到参考图按钮');
        }
        return false;
      }
      
      // 遍历每个参考图按钮，找到并隐藏其中的 span 元素
      let modifiedCount = 0;
      referenceButtons.forEach((button) => {
        const spans = button.querySelectorAll('span');
        spans.forEach((span) => {
          if (span.textContent?.includes('导入参考图') && span.style.display !== 'none') {
            // 保存原始样式，方便之后恢复
            if (!span.hasAttribute('data-original-display')) {
              span.setAttribute('data-original-display', span.style.display || '');
            }
            
            // 设置为隐藏
            span.style.display = 'none';
            
            // 添加到已修改元素集合中
            this.modifiedElements.add(span as HTMLElement);
            modifiedCount++;
          }
        });
      });
      
      if (this.debug) {
        console.log(`已隐藏 ${modifiedCount} 个参考图按钮文本元素`);
      }
      
      return modifiedCount > 0;
    } catch (error) {
      if (this.engine?.logger) {
        this.engine.logger.error('隐藏参考图按钮文本失败:', error);
      }
      return false;
    }
  }
  
  /**
   * 销毁特性
   */
  destroy(): void {
    // 恢复所有已修改的元素样式
    this.modifiedElements.forEach((element) => {
      // 获取原始样式
      const originalDisplay = element.getAttribute('data-original-display') || '';
      
      // 恢复原始样式
      element.style.display = originalDisplay;
      
      // 移除自定义属性
      element.removeAttribute('data-original-display');
    });
    
    // 清空已修改元素集合
    this.modifiedElements.clear();
    
    if (this.debug) {
      console.log('参考图按钮文本样式已恢复');
    }
    
    super.destroy();
  }
} 