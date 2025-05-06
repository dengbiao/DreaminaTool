/**
 * 消息处理器接口
 * 定义了处理特定类型消息的标准接口
 */
export interface MessageHandler<T = any, R = any> {
  /**
   * 处理消息的方法
   * @param message 消息对象
   * @param sender 消息发送者信息
   * @returns 处理结果的Promise
   */
  handleMessage(message: T, sender: chrome.runtime.MessageSender): Promise<R>;
}

/**
 * 模块定义接口
 * 描述一个功能模块的结构
 */
export interface ModuleDefinition {
  /** 模块名称 */
  name: string;
  /** 该模块处理的消息类型列表 */
  messageTypes: string[];
  /** 消息处理器实例 */
  handler: MessageHandler;
}

/**
 * 基础消息接口
 * 所有消息都应包含type字段
 */
export interface BaseMessage {
  type: string;
  [key: string]: any;
}

/**
 * 基础响应接口
 */
export interface BaseResponse {
  ok: boolean;
  error?: string;
  [key: string]: any;
} 