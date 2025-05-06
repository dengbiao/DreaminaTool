import { ModuleDefinition } from '../../core/types';
import { MESSAGE_TYPES } from '../../common/constants';
import { ToolboxHandler } from './handler';

/**
 * 工具箱模块定义
 */
export const toolboxModule: ModuleDefinition = {
  name: 'toolbox',
  messageTypes: [MESSAGE_TYPES.TOGGLE_TOOLBOX],
  handler: new ToolboxHandler()
}; 