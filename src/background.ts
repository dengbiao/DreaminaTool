import { MessageBus } from './core/message-bus';
import { registerAllModules } from './modules';
import { debounce } from './core/utils';
import { DEBOUNCE_TIME, MESSAGE_TYPES } from './common/constants';

/**
 * 初始化后台脚本
 */
function initBackground(): void {
  // 创建消息总线实例
  const messageBus = new MessageBus();
  
  // 注册所有模块
  registerAllModules(messageBus);

  // 设置全局消息监听
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    messageBus.handleMessage(message, sender)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    
    // 保持消息通道开放以进行异步响应
    return true;
  });

  // 设置扩展图标点击事件（带防抖）
  setupActionClickHandler();
}

/**
 * 设置扩展图标点击事件处理
 */
function setupActionClickHandler(): void {
  // 记录上次点击时间，用于防抖
  let lastClickTime = 0;

  // 监听扩展图标点击事件
  chrome.action.onClicked.addListener(
    // 使用防抖函数包装处理器
    debounce((tab: chrome.tabs.Tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: MESSAGE_TYPES.TOGGLE_TOOLBOX });
      }
    }, DEBOUNCE_TIME)
  );
}

// 初始化后台脚本
initBackground();

// 添加全局类型声明
declare global {
  interface Window {
    __STOP_GENERATING__: boolean;
    __BATCH_GENERATING__: boolean;
    __debugger: any;
  }
}

// 导出一个空对象以确保这是一个 ES module
export {};