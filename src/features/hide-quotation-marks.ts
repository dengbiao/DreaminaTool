/**
 * 隐藏引号按钮特性
 * 监听到界面上如果出现了 insertQuotationMarksWrap-xxx 的节点，则给它增加 display:none 样式
 */

import BaseFeature from '../core/base-feature';
import type { FeatureOptions } from '../core/base-feature';
import type { Rule } from '../core/rules/rule-engine';

export interface HideQuotationMarksOptions extends FeatureOptions {
  /**
   * 是否启用调试日志
   */
  debug?: boolean;
}

/**
 * 隐藏引号按钮特性
 */
export default class HideQuotationMarksFeature extends BaseFeature {
  private debug: boolean;
  private modifiedElements: Set<HTMLElement> = new Set();

  /**
   * 创建隐藏引号按钮特性
   * @param options 特性配置选项
   */
  constructor(options: HideQuotationMarksOptions = {}) {
    // 定义规则
    const rules: Rule[] = [
      {
        type: 'dom',
        selector: '.insertQuotationMarksWrap-\\w+', // 匹配 insertQuotationMarksWrap-xxx 类
        triggerOn: ['dom', 'route', 'custom'],
        checkInterval: 1000, // 每1秒检查一次
        onRemove: true // 当匹配的DOM元素被移除时触发destroy
      }
    ];
    
    super({
      id: 'hideQuotationMarks',
      name: '隐藏引号按钮',
      description: '隐藏引号插入按钮',
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
      const quotationElements = document.querySelectorAll('[class*="insertQuotationMarksWrap-"]');
      
      if (quotationElements.length === 0) {
        if (this.debug) {
          console.log('未找到引号按钮');
        }
        return false;
      }
      
      // 遍历每个引号按钮元素，并隐藏
      let modifiedCount = 0;
      quotationElements.forEach((element) => {
        const el = element as HTMLElement;
        
        // 如果元素已经隐藏，则跳过
        if (el.style.display === 'none') {
          return;
        }
        
        // 保存原始样式，方便之后恢复
        if (!el.hasAttribute('data-original-display')) {
          el.setAttribute('data-original-display', el.style.display || '');
        }
        
        // 设置为隐藏
        el.style.display = 'none';
        
        // 添加到已修改元素集合中
        this.modifiedElements.add(el);
        modifiedCount++;
      });
      
      if (this.debug) {
        console.log(`已隐藏 ${modifiedCount} 个引号按钮元素`);
      }
      
      return modifiedCount > 0;
    } catch (error) {
      if (this.engine?.logger) {
        this.engine.logger.error('隐藏引号按钮失败:', error);
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
      console.log('引号按钮样式已恢复');
    }
    
    super.destroy();
  }
} 