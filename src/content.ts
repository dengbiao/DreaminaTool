import './styles/panel.scss';
import { JimengTools } from './content/JimengTools';

let jimengTools: JimengTools | null = null;

// 监听来自页面的消息
window.addEventListener('message', (event) => {
  // 确保消息来自同一个窗口
  if (event.source !== window) return;

  // 处理批量生成进度更新
  if (event.data.type === 'FROM_PAGE_BATCH_PROGRESS_UPDATE') {
    // 转发消息给background script
    chrome.runtime.sendMessage({
      type: 'BATCH_PROGRESS_UPDATE',
      progress: event.data.progress
    });
  }
});

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    if (message.action === 'toggleToolbox') {
        if (!jimengTools) {
            console.log('JimengTools not initialized yet');
            sendResponse({ success: false, error: 'Not initialized' });
            return true;
        }
        
        jimengTools.toggle();
        const status = jimengTools.getStatus();
        console.log('Toggled toolbox, new status:', status);
        sendResponse({ success: true, status });
        return true;
    }

    // 处理终止生成的消息
    if (message.type === 'STOP_BATCH_GENERATE') {
        // 将终止信号传递给页面脚本
        window.postMessage({
            type: 'STOP_BATCH_GENERATE'
        }, '*');
        return true;
    }
});

// 只在即梦网站上初始化工具
if (window.location.hostname === 'jimeng.jianying.com') {
    jimengTools = JimengTools.getInstance();
    jimengTools.initialize();
}
