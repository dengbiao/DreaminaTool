import { ModuleDefinition, BaseMessage } from './types';

/**
 * 消息总线类
 * 负责注册模块和分发消息到对应的处理器
 */
export class MessageBus {
  /** 存储已注册的模块 */
  private modules: Map<string, ModuleDefinition> = new Map();
  /** 消息类型到模块名称的映射 */
  private typeToModule: Map<string, string> = new Map();

  /**
   * 注册一个模块
   * @param module 模块定义对象
   */
  public registerModule(module: ModuleDefinition): void {
    if (this.modules.has(module.name)) {
      console.warn(`模块 ${module.name} 已存在，将被覆盖`);
    }

    // 注册模块
    this.modules.set(module.name, module);

    // 更新消息类型映射
    for (const type of module.messageTypes) {
      if (this.typeToModule.has(type)) {
        console.warn(`消息类型 ${type} 已被模块 ${this.typeToModule.get(type)} 注册，将被模块 ${module.name} 覆盖`);
      }
      this.typeToModule.set(type, module.name);
    }

    console.log(`模块 ${module.name} 已注册，处理消息类型: ${module.messageTypes.join(', ')}`);
  }

  /**
   * 注销一个模块
   * @param moduleName 模块名称
   */
  public unregisterModule(moduleName: string): void {
    const module = this.modules.get(moduleName);
    if (!module) {
      console.warn(`尝试注销不存在的模块: ${moduleName}`);
      return;
    }

    // 移除消息类型映射
    for (const type of module.messageTypes) {
      if (this.typeToModule.get(type) === moduleName) {
        this.typeToModule.delete(type);
      }
    }

    // 移除模块
    this.modules.delete(moduleName);
    console.log(`模块 ${moduleName} 已注销`);
  }

  /**
   * 处理接收到的消息
   * @param message 消息对象
   * @param sender 发送者信息
   * @returns 处理结果的Promise
   */
  public async handleMessage(message: BaseMessage, sender: chrome.runtime.MessageSender): Promise<any> {
    const { type } = message;
    
    if (!type) {
      throw new Error('消息缺少type字段');
    }

    const moduleName = this.typeToModule.get(type);
    if (!moduleName) {
      throw new Error(`未找到处理消息类型 ${type} 的模块`);
    }

    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`模块 ${moduleName} 未注册`);
    }

    try {
      return await module.handler.handleMessage(message, sender);
    } catch (error) {
      console.error(`模块 ${moduleName} 处理消息 ${type} 时出错:`, error);
      throw error;
    }
  }
} 