import { MessageBus } from '../core/message-bus';
import { toolboxModule } from './toolbox';
import { batchShotsModule } from './batch-shots';
import { batchGenerateModule } from './batch-generate';

/**
 * 注册所有模块到消息总线
 * @param messageBus 消息总线实例
 */
export function registerAllModules(messageBus: MessageBus): void {
  // 注册工具箱模块
  messageBus.registerModule(toolboxModule);
  
  // 注册批量创建分镜模块
  messageBus.registerModule(batchShotsModule);
  
  // 注册批量生成模块
  messageBus.registerModule(batchGenerateModule);
} 