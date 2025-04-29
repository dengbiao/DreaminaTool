/**
 * 即梦工具箱 - 接口定义
 * 定义所有相关接口和类型
 */

/**
 * 工具箱管理器接口
 * 定义工具箱核心功能
 */
export interface IToolboxManager {
  /**
   * 初始化工具箱
   */
  initialize(): void;
  
  /**
   * 切换工具箱的显示状态
   * @returns 切换后的状态
   */
  toggle(): boolean;
  
  /**
   * 获取工具箱状态
   */
  getStatus(): { active: boolean };
}

/**
 * DOM 引擎接口
 */
export interface IDOMEngine {
  /**
   * 启动引擎
   */
  start(): any;
}

/**
 * 工具箱 UI 管理器接口
 */
export interface IUIManager {
  /**
   * 更新 UI 可见性
   * @param isVisible 是否可见
   */
  updateVisibility(isVisible: boolean): void;
  
  /**
   * 查找并获取工具箱容器
   */
  getContainer(): HTMLElement | null;
  
  /**
   * 创建工具箱容器(如果不存在)
   * @returns 容器元素
   */
  createContainerIfNotExists(): HTMLElement;
  
  /**
   * 获取当前可见性状态
   * @returns 是否可见
   */
  getVisibility(): boolean;
}

/**
 * 工具箱配置选项
 */
export interface ToolboxOptions {
  /**
   * 调试模式
   */
  debugMode?: boolean;
} 