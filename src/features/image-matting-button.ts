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
        selector: '.workDetailWrap-\\w+', // 匹配 .workDetailWrap-xxxx 类
        triggerOn: ['dom', 'route', 'custom'],
        checkInterval: 2000, // 每2秒检查一次
        onRemove: true // 当匹配的DOM元素被移除时触发destroy
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
   * 查找编辑组和消除笔按钮
   * @returns 消除笔按钮元素和编辑组元素
   */
  private findTargetElements(): { eraserButton: HTMLElement | null, editGroup: HTMLElement | null } {
    try {
      // 1. 找到 .workDetailWrap-xxxx 容器
      const workDetailWrap = document.querySelector('[class^="workDetailWrap-"]') as HTMLElement;
      if (!workDetailWrap) {
        console.log('未找到工作详情包装器');
        return { eraserButton: null, editGroup: null };
      }
      
      // 2. 找到包含"编辑"文本的 groupName 元素
      const groupNames = workDetailWrap.querySelectorAll('[class^="groupName-"]');
      let editGroupName = null;
      for (const element of Array.from(groupNames)) {
        if (element.textContent === '编辑') {
          editGroupName = element;
          break;
        }
      }
      
      if (!editGroupName) {
        console.log('未找到编辑组名称');
        return { eraserButton: null, editGroup: null };
      }
      
      // 3. 找到编辑组名称后面的 group 元素
      const editGroup = editGroupName.nextElementSibling as HTMLElement;
      if (!editGroup || !editGroup.className.includes('group-')) {
        console.log('未找到编辑组元素');
        return { eraserButton: null, editGroup: null };
      }
      
      // 4. 找到编辑组中的所有操作项
      const optItems = editGroup.querySelectorAll('[class^="optItem-"]');
      if (!optItems.length) {
        console.log('未找到操作项');
        return { eraserButton: null, editGroup: null };
      }
      
      // 5. 找到最后一个操作项，应该是消除笔
      const lastOptItem = optItems[optItems.length - 1] as HTMLElement;
      
      // 验证是否是消除笔按钮
      const svgElement = lastOptItem.querySelector('svg');
      const spanElement = lastOptItem.querySelector('span');
      
      if (spanElement && spanElement.textContent === '消除笔') {
        return { eraserButton: lastOptItem, editGroup: editGroup };
      } else {
        // 如果最后一个不是消除笔，尝试找到文本为"消除笔"的按钮
        for (const item of Array.from(optItems)) {
          const span = item.querySelector('span');
          if (span && span.textContent === '消除笔') {
            return { eraserButton: item as HTMLElement, editGroup: editGroup };
          }
        }
        console.log('未找到消除笔按钮');
        return { eraserButton: null, editGroup: editGroup };
      }
    } catch (error) {
      console.error('查找目标元素时出错:', error);
      return { eraserButton: null, editGroup: null };
    }
  }

  /**
   * 检查是否已经添加了抠图按钮
   */
  private hasImageMattingButton(): boolean {
    const allButtons = document.querySelectorAll('[class^="optItem-"]');
    for (const button of Array.from(allButtons)) {
      const span = button.querySelector('span');
      if (span && span.textContent === this.buttonConfig.text && 
          button.classList.contains('dreamina-matting-button')) {
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
      // 查找目标元素
      const { eraserButton, editGroup } = this.findTargetElements();
      
      if (!editGroup) {
        if (this.engine?.logger) {
          this.engine.logger.error('未找到编辑组');
        }
        return false;
      }
      
      // 创建抠图按钮元素
      const buttonElement = document.createElement('div');
      
      // 如果找到了消除笔按钮，复制它的类名
      if (eraserButton) {
        buttonElement.className = eraserButton.className;
      } else {
        // 否则，尝试从编辑组中找一个操作项作为模板
        const optItems = editGroup.querySelectorAll('[class^="optItem-"]');
        if (optItems.length > 0) {
          buttonElement.className = optItems[0].className;
        } else {
          // 如果找不到任何模板，使用一个通用类名
          buttonElement.className = 'optItem-common';
        }
      }
      
      // 添加自定义类名，方便识别
      buttonElement.classList.add('dreamina-matting-button');
      
      // 创建SVG图标
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
      
      // 将按钮添加到编辑组的末尾
      editGroup.appendChild(buttonElement);
      
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
      console.log('抠图按钮特性正在销毁...');
      
      // 查找并移除所有抠图按钮
      const buttons = document.querySelectorAll('.dreamina-matting-button');
      buttons.forEach(button => {
        button.remove();
      });
      
      this.buttonAdded = false;
      
      this.engine?.logger.log('抠图按钮已被移除');
    }
    
    // 重置状态，以便下次可以重新添加
    this.buttonAdded = false;
    
    super.destroy();
  }
} 