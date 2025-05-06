import { ModuleDefinition } from '../../core/types';
import { MESSAGE_TYPES } from '../../common/constants';
import { BatchShotsHandler } from './handler';

/**
 * 批量创建分镜模块定义
 */
export const batchShotsModule: ModuleDefinition = {
  name: 'batch-shots',
  messageTypes: [MESSAGE_TYPES.BATCH_CREATE_SHOTS],
  handler: new BatchShotsHandler()
}; 