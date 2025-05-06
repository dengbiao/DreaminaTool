import { ModuleDefinition } from '../../core/types';
import { MESSAGE_TYPES } from '../../common/constants';
import { BatchGenerateHandler } from './handler';

/**
 * 批量生成模块定义
 */
export const batchGenerateModule: ModuleDefinition = {
  name: 'batch-generate',
  messageTypes: [
    MESSAGE_TYPES.BATCH_GENERATE,
    MESSAGE_TYPES.STOP_BATCH_GENERATE
  ],
  handler: new BatchGenerateHandler()
}; 