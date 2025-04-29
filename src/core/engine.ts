/**
 * 即梦DOM引擎 - 核心类
 * 负责管理所有功能模块和规则引擎
 */

import type { Feature } from './feature';
import type { RuleEngine } from './rules/rule-engine';

export interface EngineConfig {
  debugMode?: boolean;
  observeTarget?: string;
  observeConfig?: MutationObserverInit;
}

export default class DreaminaDOMEngine {
  private config: Required<EngineConfig>;
  private features: Map<string, Feature>;
  public ruleEngines: Map<string, RuleEngine>;
  private observer: MutationObserver | null;
  private initialized: boolean;
  public logger: {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };

  constructor(config: EngineConfig = {}) {
    this.config = {
      debugMode: config.debugMode ?? false,
      observeTarget: config.observeTarget ?? 'body',
      observeConfig: config.observeConfig ?? { childList: true, subtree: true, attributes: true }
    };
    this.features = new Map();
    this.ruleEngines = new Map();
    this.observer = null;
    this.initialized = false;
    this.logger = this._createLogger();
  }

  /**
   * 创建日志记录器
   */
  private _createLogger() {
    return {
      log: (...args: any[]) => this.config.debugMode && console.log('[DreaminaTool]', ...args),
      warn: (...args: any[]) => this.config.debugMode && console.warn('[DreaminaTool]', ...args),
      error: (...args: any[]) => console.error('[DreaminaTool]', ...args)
    };
  }

  /**
   * 动态注册功能模块
   * @param feature 功能模块实例
   */
  registerFeature(feature: Feature): this {
    if (!feature.id) {
      this.logger.error('Feature必须有唯一id', feature);
      return this;
    }

    this.features.set(feature.id, feature);
    
    // 如果已初始化，立即初始化新注册的功能
    if (this.initialized && feature.init) {
      try {
        feature.init(this);
      } catch (err) {
        this.logger.error(`初始化功能[${feature.id}]失败:`, err);
      }
    }
    
    this.logger.log(`功能[${feature.id}]注册成功`);
    return this;
  }

  /**
   * 注销功能模块
   * @param featureId 功能模块ID
   */
  unregisterFeature(featureId: string): this {
    const feature = this.features.get(featureId);
    if (feature && feature.destroy) {
      try {
        feature.destroy();
      } catch (err) {
        this.logger.error(`销毁功能[${featureId}]失败:`, err);
      }
    }
    this.features.delete(featureId);
    this.logger.log(`功能[${featureId}]已注销`);
    return this;
  }

  /**
   * 注册规则引擎
   * @param type 规则类型
   * @param engine 规则引擎实例
   */
  registerRuleEngine(type: string, engine: RuleEngine): this {
    this.ruleEngines.set(type, engine);
    this.logger.log(`规则引擎[${type}]注册成功`);
    return this;
  }

  /**
   * 启动引擎
   */
  start(): this {
    // 初始化所有功能
    for (const [id, feature] of this.features.entries()) {
      try {
        if (feature.init) {
          feature.init(this);
        }
      } catch (err) {
        this.logger.error(`初始化功能[${id}]失败:`, err);
      }
    }
    this.initialized = true;

    // 设置DOM观察器
    this.setupObserver();
    
    // 监听路由变化
    this.setupRouteObserver();
    
    // 立即执行一次检查
    this.checkAndApplyFeatures();
    
    this.logger.log('引擎启动完成');
    return this;
  }

  /**
   * 设置DOM观察器
   */
  private setupObserver(): void {
    if (!this.observer) {
      const target = this.config.observeTarget === 'document'
        ? document
        : document.querySelector(this.config.observeTarget) || document.body;
      
      this.observer = new MutationObserver((mutations) => {
        this.checkAndApplyFeatures(mutations);
      });
      
      this.observer.observe(target, this.config.observeConfig);
      
      // 添加自定义DOM检查事件监听
      document.addEventListener('dreamina-dom-check', () => {
        this.checkAndApplyFeatures(null, 'custom');
      });
      
      this.logger.log('DOM观察器已设置');
    }
  }

  /**
   * 设置路由观察器
   */
  private setupRouteObserver(): void {
    // 监听 history API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleRouteChange();
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleRouteChange();
    };
    
    // 监听 popstate 事件
    window.addEventListener('popstate', () => this.handleRouteChange());
    
    this.logger.log('路由观察器已启动');
  }

  /**
   * 路由变化处理
   */
  handleRouteChange(): void {
    this.logger.log('检测到路由变化:', window.location.href);
    this.checkAndApplyFeatures(null, 'route');
  }

  /**
   * 检查并应用所有功能
   * @param mutations DOM变动记录
   * @param trigger 触发类型
   */
  checkAndApplyFeatures(mutations: MutationRecord[] | null = null, trigger: string = 'dom'): void {
    for (const [id, feature] of this.features.entries()) {
      try {
        if (this.shouldApplyFeature(feature, mutations, trigger)) {
          feature.apply();
          this.logger.log(`功能[${id}]已应用`);
        }
      } catch (err) {
        this.logger.error(`应用功能[${id}]失败:`, err);
      }
    }
  }

  /**
   * 判断是否应用功能
   * @param feature 功能模块
   * @param mutations DOM变动记录
   * @param trigger 触发类型
   */
  shouldApplyFeature(feature: Feature, mutations: MutationRecord[] | null, trigger: string): boolean {
    // 基础检查：功能自身的shouldApply方法
    if (feature.shouldApply && !feature.shouldApply()) {
      return false;
    }
    
    // 检查功能的激活规则
    if (!feature.rules || feature.rules.length === 0) {
      // 没有规则，默认激活
      return true;
    }
    
    // 至少一条规则满足即可激活
    return feature.rules.some(rule => {
      // 检查规则类型是否匹配当前触发类型
      if (rule.triggerOn && !rule.triggerOn.includes(trigger)) {
        return false;
      }
      
      // 使用对应的规则引擎评估规则
      const ruleEngine = this.ruleEngines.get(rule.type);
      if (!ruleEngine) {
        this.logger.warn(`未找到规则引擎[${rule.type}]`);
        return false;
      }
      
      return ruleEngine.evaluate(rule, { mutations, trigger });
    });
  }

  /**
   * 停止引擎
   */
  stop(): this {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // 销毁所有功能
    for (const [id, feature] of this.features.entries()) {
      try {
        if (feature.destroy) {
          feature.destroy();
        }
      } catch (err) {
        this.logger.error(`销毁功能[${id}]失败:`, err);
      }
    }
    
    this.logger.log('引擎已停止');
    return this;
  }

  /**
   * 获取功能模块
   * @param id 功能模块ID
   */
  getFeature(id: string): Feature | undefined {
    return this.features.get(id);
  }
} 