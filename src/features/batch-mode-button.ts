/**
 * 批量模式按钮特性
 * 在 inputContainer-xxx 下面的 operationWrap 元素中添加"批量模式"开关按钮
 */

import BaseFeature from '../core/base-feature';
import type { FeatureOptions } from '../core/base-feature';
import type { Rule } from '../core/rules/rule-engine';

export interface BatchModeButtonOptions extends FeatureOptions {
  /**
   * 按钮文本
   */
  buttonText?: string;
  
  /**
   * 是否启用调试日志
   */
  debug?: boolean;
  
  /**
   * 按钮点击处理函数
   */
  onClick?: (e: MouseEvent, isActive: boolean) => void;

  /**
   * 是否默认开启
   */
  defaultActive?: boolean;
}

/**
 * 批量模式按钮特性
 */
export default class BatchModeButtonFeature extends BaseFeature {
  private debug: boolean;
  private buttonConfig: {
    text: string;
    onClick: (e: MouseEvent, isActive: boolean) => void;
    defaultActive: boolean;
  };
  private addedButtons: Map<string, HTMLElement> = new Map();

  /**
   * 创建批量模式按钮特性
   * @param options 特性配置选项
   */
  constructor(options: BatchModeButtonOptions = {}) {
    // 定义规则
    const rules: Rule[] = [
      {
        type: 'dom',
        selector: '.inputContainer-\\w+', // 匹配 inputContainer-xxx 类
        triggerOn: ['dom', 'route', 'custom'],
        checkInterval: 1000, // 每1秒检查一次
        onRemove: true // 当匹配的DOM元素被移除时触发destroy
      }
    ];
    
    super({
      id: 'batchModeButton',
      name: '添加批量模式按钮',
      description: '在操作区域添加批量模式开关按钮',
      rules,
      ...options
    });
    
    this.debug = options.debug || false;
    this.buttonConfig = {
      text: options.buttonText || '批量',
      onClick: options.onClick || this.handleButtonClick.bind(this),
      defaultActive: options.defaultActive || false
    };
  }

  /**
   * 应用特性
   */
  apply(): boolean {
    if (!super.apply()) return false;
    
    try {
      // 查找目标容器元素
      const inputContainers = document.querySelectorAll('[class*="inputContainer-"]');
      
      if (inputContainers.length === 0) {
        if (this.debug) {
          console.log('未找到输入容器');
        }
        return false;
      }
      
      let addedCount = 0;
      
      // 遍历每个输入容器，查找操作区域并添加按钮
      inputContainers.forEach((container, idx) => {
        // 查找操作区域
        const operationWrap = container.querySelector('[class*="operationWrap-"]');
        if (!operationWrap) {
          if (this.debug) {
            console.log(`容器 #${idx} 中未找到操作区域`);
          }
          return;
        }
        
        // 检查是否已经添加过按钮
        const containerId = `container_${idx}`;
        if (this.addedButtons.has(containerId)) {
          if (this.debug) {
            console.log(`容器 #${idx} 已添加批量模式按钮`);
          }
          return;
        }
        
        // 创建批量模式按钮
        const button = this.createBatchModeSwitch();
        
        // 添加到操作区域
        operationWrap.appendChild(button);
        
        // 记录已添加的按钮
        this.addedButtons.set(containerId, button);
        addedCount++;
        
        if (this.debug) {
          console.log(`在容器 #${idx} 中添加了批量模式开关`);
        }
      });
      
      if (this.debug) {
        console.log(`总共添加了 ${addedCount} 个批量模式开关`);
      }
      
      return addedCount > 0;
    } catch (error) {
      if (this.engine?.logger) {
        this.engine.logger.error('添加批量模式开关失败:', error);
      }
      return false;
    }
  }
  
  /**
   * 创建批量模式开关元素
   */
  private createBatchModeSwitch(): HTMLElement {
    // 创建开关容器元素
    const switchContainer = document.createElement('div');
    switchContainer.className = 'dreamina-batch-mode-container mweb-button-tertiary mwebButton-vwzuXc';
    switchContainer.style.height = '30px';
    switchContainer.style.padding = '0 8px';
    
    // 创建开关标签
    const label = document.createElement('span');
    label.textContent = this.buttonConfig.text;
    label.style.marginLeft = '4px';
    label.style.fontSize = '12px';
    
    // 创建开关元素
    const switchEl = document.createElement('div');
    switchEl.className = 'dreamina-switch';
    switchEl.style.position = 'relative';
    switchEl.style.width = '40px';
    switchEl.style.height = '20px';
    switchEl.style.borderRadius = '10px';
    switchEl.style.backgroundColor = this.buttonConfig.defaultActive ? '#1677ff' : '#ccc';
    switchEl.style.transition = 'background-color 0.3s';
    
    // 创建开关滑块
    const slider = document.createElement('div');
    slider.className = 'dreamina-switch-slider';
    slider.style.position = 'absolute';
    slider.style.top = '2px';
    slider.style.left = this.buttonConfig.defaultActive ? '22px' : '2px';
    slider.style.width = '16px';
    slider.style.height = '16px';
    slider.style.borderRadius = '50%';
    slider.style.backgroundColor = '#fff';
    slider.style.transition = 'left 0.3s';
    
    // 将滑块添加到开关中
    switchEl.appendChild(slider);
    
    // 组装开关组件
    switchContainer.appendChild(switchEl);
    switchContainer.appendChild(label);
    
    // 添加点击事件
    switchContainer.addEventListener('click', (e) => {
      // 获取当前开关状态
      const isActive = switchEl.classList.contains('active');
      const newState = !isActive;
      
      // 更新开关状态
      if (newState) {
        switchEl.classList.add('active');
        switchEl.style.backgroundColor = '#1677ff';
        slider.style.left = '22px';
      } else {
        switchEl.classList.remove('active');
        switchEl.style.backgroundColor = '#ccc';
        slider.style.left = '2px';
      }
      
      // 调用回调函数
      this.buttonConfig.onClick(e, newState);
    });
    
    // 设置初始状态
    if (this.buttonConfig.defaultActive) {
      switchEl.classList.add('active');
    }
    
    return switchContainer;
  }
  
  /**
   * 开关点击处理
   */
  private handleButtonClick(e: MouseEvent, isActive: boolean): void {
    console.log('批量模式开关被点击', e, '当前状态:', isActive);
    
    if (isActive) {
      // alert('批量模式已开启！');
    } else {
      // alert('批量模式已关闭！');
    }
  }
  
  /**
   * 销毁特性
   */
  destroy(): void {
    // 移除所有添加的开关
    this.addedButtons.forEach((button) => {
      button.remove();
    });
    
    // 清空开关记录
    this.addedButtons.clear();
    
    if (this.debug) {
      console.log('所有批量模式开关已移除');
    }
    
    super.destroy();
  }
} 