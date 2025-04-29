/**
 * DOM引擎适配器
 * 将现有DOM引擎适配到新接口
 */

import { IDOMEngine } from './interfaces';
import { initDOMEngine } from './dom-engine';

export class DOMEngineAdapter implements IDOMEngine {
  private engine: any;
  private debugMode: boolean;

  /**
   * 构造函数
   * @param debugMode 调试模式
   */
  constructor(debugMode: boolean = true) {
    this.debugMode = debugMode;
    this.engine = null;
  }

  /**
   * 启动引擎
   * @returns 引擎API
   */
  public start(): any {
    if (!this.engine) {
      this.engine = initDOMEngine({ debugMode: this.debugMode });
    }
    return this.engine;
  }

  /**
   * 获取引擎实例
   */
  public getEngine(): any {
    return this.engine;
  }
} 