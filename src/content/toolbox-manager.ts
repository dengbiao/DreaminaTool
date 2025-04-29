/**
 * 即梦工具箱 - 管理器类
 * 用于管理所有工具和功能
 */

import { IDOMEngine, IToolboxManager, IUIManager, ToolboxOptions } from './interfaces';

export class ToolboxManager implements IToolboxManager {
  private static instance: ToolboxManager;
  private isActive: boolean = false;
  private domEngine: IDOMEngine;
  private uiManager: IUIManager;
  private options: ToolboxOptions;

  /**
   * 获取单例实例
   */
  public static getInstance(
    uiManager: IUIManager,
    domEngine: IDOMEngine,
    options: ToolboxOptions = { debugMode: true }
  ): ToolboxManager {
    if (!ToolboxManager.instance) {
      ToolboxManager.instance = new ToolboxManager(uiManager, domEngine, options);
    }
    return ToolboxManager.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor(
    uiManager: IUIManager,
    domEngine: IDOMEngine,
    options: ToolboxOptions = { debugMode: true }
  ) {
    this.uiManager = uiManager;
    this.domEngine = domEngine;
    this.options = options;
    // 初始化时从UIManager获取显示状态
    this.isActive = uiManager.getVisibility();
  }

  /**
   * 初始化工具
   */
  public initialize(): void {
    console.log('正在初始化即梦工具箱...');
    
    // 启动DOM引擎
    this.domEngine.start();
    
    const container = this.uiManager.getContainer();
    console.log('即梦工具箱初始化完成', container ? '找到UI容器' : '未找到UI容器');
  }

  /**
   * 切换工具箱的显示状态
   * @returns 切换后的状态(是否活跃)
   */
  public toggle(): boolean {
    const prevState = this.isActive;
    this.isActive = !this.isActive;
    console.log(`工具箱状态切换: ${prevState ? '激活' : '隐藏'} -> ${this.isActive ? '激活' : '隐藏'}`);
    
    // 更新工具箱容器的显示状态
    console.log(`调用 UIManager.updateVisibility(${this.isActive})`);
    this.uiManager.updateVisibility(this.isActive);
    
    // 触发自定义DOM检查事件
    document.dispatchEvent(new CustomEvent('dreamina-dom-check'));
    
    return this.isActive;
  }

  /**
   * 获取工具箱状态
   */
  public getStatus(): { active: boolean } {
    // 从UIManager获取最新的显示状态
    this.isActive = this.uiManager.getVisibility();
    return { active: this.isActive };
  }
} 