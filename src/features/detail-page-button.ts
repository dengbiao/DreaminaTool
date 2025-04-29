/**
 * 详情页按钮特性
 * 在详情页的操作区域添加自定义按钮
 */

import BaseFeature from '../core/base-feature';
import type { FeatureOptions } from '../core/base-feature';
import { waitForElement, createSiteStyledButton } from '../utils/dom-utils';
import type { Rule } from '../core/rules/rule-engine';

export interface DetailPageButtonOptions extends FeatureOptions {
  /**
   * 按钮文本
   */
  buttonText?: string;
  
  /**
   * 按钮样式类
   */
  buttonClass?: string;
  
  /**
   * 按钮点击处理函数
   */
  onClick?: (e: MouseEvent) => void;
}

/**
 * 详情页按钮特性
 */
export default class DetailPageButtonFeature extends BaseFeature {
  private buttonAdded: boolean;
  private buttonConfig: {
    text: string;
    className: string;
    onClick: (e: MouseEvent) => void;
  };

  /**
   * 创建详情页按钮特性
   * @param options 特性配置选项
   */
  constructor(options: DetailPageButtonOptions = {}) {
    // 定义详情页规则
    const rules: Rule[] = [
      {
        type: 'combined',
        operator: 'AND',
        triggerOn: ['dom', 'route'],
        rules: [
          {
            type: 'route',
            pattern: /\/detail\/\d+/,  // 匹配详情页路由
          },
          {
            type: 'dom',
            selector: '.operation-buttons-area',  // 确保按钮容器存在
          }
        ]
      }
    ];
    
    super({
      id: 'detailPageButton',
      name: '详情页添加按钮',
      description: '在详情页的操作区域添加自定义按钮',
      rules,
      ...options
    });
    
    this.buttonAdded = false;
    this.buttonConfig = {
      text: options.buttonText || '自定义功能',
      className: options.buttonClass || 'dreamina-custom-button',
      onClick: options.onClick || this.handleButtonClick.bind(this)
    };
  }

  /**
   * 应用特性
   */
  apply(): boolean {
    if (!super.apply()) return false;
    
    // 等待按钮容器元素出现
    waitForElement('.operation-buttons-area').then(container => {
      if (container && !this.buttonAdded) {
        // 创建新按钮
        const button = createSiteStyledButton(
          this.buttonConfig.text, 
          this.buttonConfig.onClick
        );
        
        // 添加按钮到容器
        container.appendChild(button);
        this.buttonAdded = true;
        
        if (this.engine && this.engine.logger) {
          this.engine.logger.log('已添加自定义按钮到详情页');
        }
      }
    });
    
    return true;
  }

  /**
   * 按钮点击处理
   */
  private handleButtonClick(e: MouseEvent): void {
    console.log('自定义按钮被点击', e);
    // 实现按钮点击后的业务逻辑
  }
  
  /**
   * 销毁特性
   */
  destroy(): void {
    // 移除已添加的按钮
    if (this.buttonAdded) {
      const button = document.querySelector(`.${this.buttonConfig.className}`);
      if (button) {
        button.remove();
      }
      this.buttonAdded = false;
    }
    
    super.destroy();
  }
} 