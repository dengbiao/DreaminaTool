/**
 * 工具箱 UI 管理器
 * 负责处理工具箱的 DOM 相关操作
 */

import { IUIManager } from './interfaces';

// 本地存储键名常量（匹配原有键名）
const STORAGE_KEYS = {
  TOOL_VISIBLE: "tool_visible",
};

export class UIManager implements IUIManager {
  private readonly containerId: string;
  private container: HTMLElement | null = null;
  private isVisible: boolean = false;

  /**
   * 构造函数
   * @param containerId 工具箱容器ID
   */
  constructor(containerId: string = 'jimeng-toolbox-root') {
    this.containerId = containerId;
    // 初始化时从本地存储读取显示状态
    this.isVisible = this.getSavedVisibility();
  }

  /**
   * 从本地存储获取保存的显示状态
   * @returns 显示状态，默认为隐藏
   */
  private getSavedVisibility(): boolean {
    const savedVisibility = localStorage.getItem(STORAGE_KEYS.TOOL_VISIBLE);
    return savedVisibility === "true";
  }

  /**
   * 保存显示状态到本地存储
   * @param isVisible 是否可见
   */
  private saveVisibility(isVisible: boolean): void {
    localStorage.setItem(STORAGE_KEYS.TOOL_VISIBLE, isVisible.toString());
  }

  /**
   * 查找工具箱容器
   * @returns 容器元素或null
   */
  public getContainer(): HTMLElement | null {
    if (!this.container) {
      this.container = document.getElementById(this.containerId);
    }
    return this.container;
  }

  /**
   * 更新工具箱可见性
   * @param isVisible 是否可见
   */
  public updateVisibility(isVisible: boolean): void {
    this.isVisible = isVisible;
    const container = this.getContainer();
    
    if (container) {
      container.style.display = isVisible ? 'block' : 'none';
      console.log(`工具箱UI显示状态已更新: ${isVisible ? '显示' : '隐藏'}`);
      
      // 保存显示状态到本地存储
      this.saveVisibility(isVisible);
    } else {
      console.error('无法找到工具箱UI容器元素');
    }
  }

  /**
   * 获取当前可见性状态
   * @returns 是否可见
   */
  public getVisibility(): boolean {
    return this.isVisible;
  }

  /**
   * 创建工具箱容器(如果不存在)
   * @returns 容器元素
   */
  public createContainerIfNotExists(): HTMLElement {
    let container = this.getContainer();
    
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      // 根据保存的状态设置初始显示
      container.style.display = this.isVisible ? 'block' : 'none';
      document.body.appendChild(container);
      this.container = container;
    }
    
    return container;
  }
} 