import { BaseMessage } from '../../core/types';
import { MESSAGE_TYPES } from '../../common/constants';

/**
 * 切换工具箱消息
 */
export interface ToggleToolboxMessage extends BaseMessage {
  action: typeof MESSAGE_TYPES.TOGGLE_TOOLBOX;
} 