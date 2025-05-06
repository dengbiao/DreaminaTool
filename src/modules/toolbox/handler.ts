import { MessageHandler } from '../../core/types';
import { ToggleToolboxMessage } from './types';
import { MESSAGE_TYPES } from '../../common/constants';

/**
 * 工具箱模块处理器
 */
export class ToolboxHandler implements MessageHandler<ToggleToolboxMessage, void> {
  /**
   * 处理工具箱相关消息
   * @param message 消息对象
   * @param sender 发送者信息
   */
  async handleMessage(message: ToggleToolboxMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    if (message.action === MESSAGE_TYPES.TOGGLE_TOOLBOX) {
      await this.handleToggleToolbox(sender.tab?.id);
    }
  }

  /**
   * 处理切换工具箱消息
   * @param tabId 标签页ID
   */
  private async handleToggleToolbox(tabId?: number): Promise<void> {
    if (!tabId) {
      console.error('无法获取当前标签页ID');
      return;
    }
    
    // 向内容脚本发送切换工具箱的消息
    await chrome.tabs.sendMessage(tabId, { action: MESSAGE_TYPES.TOGGLE_TOOLBOX });
  }
} 