/**
 * 抠图按钮特性
 * 在消除笔按钮后面添加抠图按钮
 */

import BaseFeature from '../core/base-feature';
import type { FeatureOptions } from '../core/base-feature';
import { waitForElement, createSiteStyledButton } from '../utils/dom-utils';
import type { Rule } from '../core/rules/rule-engine';

export interface ImageMattingButtonOptions extends FeatureOptions {
  /**
   * 按钮文本
   */
  buttonText?: string;
  
  /**
   * 按钮点击处理函数
   */
  onClick?: (e: MouseEvent) => void;
}

/**
 * 抠图按钮特性
 */
export default class ImageMattingButtonFeature extends BaseFeature {
  private buttonAdded: boolean;
  private buttonConfig: {
    text: string;
    onClick: (e: MouseEvent) => void;
  };

  /**
   * 创建抠图按钮特性
   * @param options 特性配置选项
   */
  constructor(options: ImageMattingButtonOptions = {}) {
    // 定义规则
    const rules: Rule[] = [
      {
        type: 'dom',
        selector: '.group-I9vSBL',  // 查找包含所有按钮的容器
        triggerOn: ['dom', 'route', 'custom'],
        checkInterval: 2000 // 每2秒检查一次
      }
    ];
    
    super({
      id: 'imageMattingButton',
      name: '添加抠图按钮',
      description: '在消除笔按钮后面添加抠图按钮',
      rules,
      ...options
    });
    
    this.buttonAdded = false;
    this.buttonConfig = {
      text: options.buttonText || '抠图',
      onClick: options.onClick || this.handleButtonClick.bind(this)
    };
  }

  /**
   * 查找消除笔按钮的元素
   * @returns 消除笔按钮元素
   */
  private findEraserButtonElement(): HTMLElement | null {
    // 查找所有有消除笔文本的按钮
    const allSpans = document.querySelectorAll('span');
    for (const span of Array.from(allSpans)) {
      if (span.textContent === '消除笔') {
        // 找到消除笔按钮的父元素
        return span.closest('.optItem-CQDvy5') as HTMLElement;
      }
    }
    return null;
  }

  /**
   * 检查是否已经添加了抠图按钮
   */
  private hasImageMattingButton(): boolean {
    const allSpans = document.querySelectorAll('span');
    for (const span of Array.from(allSpans)) {
      if (span.textContent === this.buttonConfig.text && 
          span.closest('.dreamina-matting-button')) {
        return true;
      }
    }
    return false;
  }

  /**
   * 应用特性
   */
  apply(): boolean {
    if (!super.apply()) return false;
    
    // 如果已经添加了按钮，不重复添加
    if (this.buttonAdded || this.hasImageMattingButton()) {
      this.buttonAdded = true;
      return true; 
    }
    
    try {
      // 查找消除笔按钮
      const eraserButton = this.findEraserButtonElement();
      if (!eraserButton) {
        if (this.engine?.logger) {
          this.engine.logger.error('未找到消除笔按钮');
        }
        return false;
      }
      
      // 获取消除笔按钮的父元素容器
      const buttonContainer = eraserButton.parentElement;
      if (!buttonContainer) {
        if (this.engine?.logger) {
          this.engine.logger.error('未找到按钮容器');
        }
        return false;
      }
      
      // 创建抠图按钮元素
      const buttonElement = document.createElement('div');
      buttonElement.className = eraserButton.className; // 复制同样的类名保持样式一致
      buttonElement.classList.add('dreamina-matting-button');
      
      // 复制SVG图标样式，创建一个新的SVG图标
      const svgIcon = `
        <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="">
          <g>
            <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M19.5 3C20.75 3 21.5 4 21.5 5V19C21.5 20 20.5 21 19.5 21H4.5C3.5 21 2.5 20 2.5 19V5C2.5 4 3.25 3 4.5 3H19.5ZM10.5 6H4.5V18H10.5V6ZM19.5 6H13.5V18H19.5V6Z" fill="currentColor"></path>
          </g>
        </svg>
      `;
      
      // 设置按钮的HTML内容
      buttonElement.innerHTML = `${svgIcon}<span>${this.buttonConfig.text}</span>`;
      
      // 为按钮添加点击事件
      buttonElement.addEventListener('click', this.buttonConfig.onClick);
      
      // 将按钮添加到消除笔按钮后面
      buttonContainer.insertBefore(buttonElement, eraserButton.nextSibling);
      
      this.buttonAdded = true;
      
      if (this.engine?.logger) {
        this.engine.logger.log('已添加抠图按钮');
      }
      
      return true;
    } catch (error) {
      if (this.engine?.logger) {
        this.engine.logger.error('添加抠图按钮失败:', error);
      }
      return false;
    }
  }

  /**
   * 按钮点击处理
   */
  private handleButtonClick(e: MouseEvent): void {
    // 默认的抠图功能实现
    console.log('抠图按钮被点击', e);
    alert('抠图功能已启动！这里可以实现自定义的抠图逻辑。');
  }
  
  /**
   * 销毁特性
   */
  destroy(): void {
    // 移除已添加的按钮
    if (this.buttonAdded) {
      const button = document.querySelector('.dreamina-matting-button');
      if (button) {
        button.remove();
      }
      this.buttonAdded = false;
    }
    
    super.destroy();
  }
} 