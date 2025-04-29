/**
 * 即梦工具箱 - 主类
 * 用于管理所有工具和功能
 */

import { initDOMEngine } from './dom-engine';

export class JimengTools {
  private static instance: JimengTools;
  private isActive: boolean = false;
  private domEngine: any;
  private toolboxContainer: HTMLElement | null = null;

  /**
   * 获取单例实例
   */
  public static getInstance(): JimengTools {
    if (!JimengTools.instance) {
      JimengTools.instance = new JimengTools();
    }
    return JimengTools.instance;
  }

  private constructor() {
    this.isActive = false;
  }

  /**
   * 初始化工具
   */
  public initialize(): void {
    console.log('正在初始化即梦工具箱...');
    // 初始化DOM引擎
    this.domEngine = initDOMEngine({ debugMode: true });
    
    // 查找工具箱容器
    this.toolboxContainer = document.getElementById('jimeng-toolbox-root');
    console.log('即梦工具箱初始化完成', this.toolboxContainer ? '找到UI容器' : '未找到UI容器');
  }

  /**
   * 切换工具箱的显示状态
   */
  public toggle(): void {
    this.isActive = !this.isActive;
    console.log(`工具箱状态: ${this.isActive ? '激活' : '隐藏'}`);
    
    // 更新工具箱容器的显示状态
    this.updateVisibility();
    
    // 触发自定义DOM检查事件
    document.dispatchEvent(new CustomEvent('dreamina-dom-check'));
  }

  /**
   * 更新工具箱显示状态
   */
  private updateVisibility(): void {
    // 如果找不到容器，再次尝试查找（可能是延迟加载）
    if (!this.toolboxContainer) {
      this.toolboxContainer = document.getElementById('jimeng-toolbox-root');
    }
    
    if (this.toolboxContainer) {
      if (this.isActive) {
        this.toolboxContainer.style.display = 'block';
      } else {
        this.toolboxContainer.style.display = 'none';
      }
      console.log(`工具箱UI显示状态已更新: ${this.isActive ? '显示' : '隐藏'}`);
    } else {
      console.error('无法找到工具箱UI容器元素');
    }
  }

  /**
   * 获取工具箱状态
   */
  public getStatus(): { active: boolean } {
    return { active: this.isActive };
  }
} 