import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/global.scss";
import { ToolboxLayout } from "../components/layout/ToolboxLayout";
import { tools } from "../utils/toolRegistry";
import { IToolboxManager, ToolboxOptions } from "./interfaces";
import { UIManager } from "./ui-manager";
import { DOMEngineAdapter } from "./dom-engine-adapter";
import { ToolboxManager } from "./toolbox-manager";

// 常量定义
const TOOLBOX_ID = "jimeng-toolbox-root";
const TOGGLE_DEBOUNCE_TIME = 500; // 防抖间隔，单位毫秒
const TARGET_HOSTNAME = "jimeng.jianying.com";

// 状态变量
let jimengToolsManager: IToolboxManager | null = null;
let lastToggleTime = 0;
let uiManager: UIManager | null = null;

/**
 * 获取UI管理器实例
 * 确保全局只有一个UI管理器实例
 */
function getUIManagerInstance(): UIManager {
  if (!uiManager) {
    uiManager = new UIManager(TOOLBOX_ID);
  }
  return uiManager;
}

/**
 * 获取工具箱管理器实例
 * 确保全局只有一个工具箱实例
 */
function getToolboxManagerInstance(
  options: ToolboxOptions = { debugMode: true }
): IToolboxManager {
  if (!jimengToolsManager) {
    // 创建UI管理器
    const uiManager = getUIManagerInstance();

    // 创建DOM引擎适配器
    const domEngine = new DOMEngineAdapter(options.debugMode);

    // 创建工具箱管理器
    jimengToolsManager = ToolboxManager.getInstance(
      uiManager,
      domEngine,
      options
    );
  }

  return jimengToolsManager;
}

/**
 * 初始化工具箱UI
 */
function initializeToolboxUI(): HTMLElement {
  // 获取UI管理器实例
  const uiManager = getUIManagerInstance();

  // 创建容器元素（如果不存在）
  const container = uiManager.createContainerIfNotExists();

  // 创建 React 根节点并渲染
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ToolboxLayout
        tools={tools}
        onClose={() => {
          // 工具箱关闭回调
          console.log("工具箱关闭回调被触发");
          jimengToolsManager?.toggle();
          // uiManager.updateVisibility(false);
        }}
        onToolSelect={(tool) => {
          // 工具选择回调
          console.log("工具选择回调被触发:", tool ? tool.name : "返回主菜单");
        }}
      />
    </React.StrictMode>
  );

  return container;
}

/**
 * 初始化工具箱功能
 */
function initializeToolboxManager() {
  // 只在目标网站上初始化工具
  if (window.location.hostname === TARGET_HOSTNAME) {
    // 获取工具箱管理器实例
    jimengToolsManager = getToolboxManagerInstance({ debugMode: true });
    jimengToolsManager.initialize();
    console.log("即梦工具初始化完成，工具箱UI默认隐藏，点击插件图标可显示");
  }
}

// 监听来自页面的消息
window.addEventListener("message", (event) => {
  // 确保消息来自同一个窗口
  if (event.source !== window) return;

  // 处理批量生成进度更新
  if (event.data.type === "FROM_PAGE_BATCH_PROGRESS_UPDATE") {
    // 转发消息给background script
    chrome.runtime.sendMessage({
      type: "BATCH_PROGRESS_UPDATE",
      progress: event.data.progress,
    });
  }
});

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);

  if (message.action === "toggleToolbox") {
    console.log("处理 toggleToolbox 消息");
    if (!jimengToolsManager) {
      console.log("工具箱管理器未初始化");
      sendResponse({ success: false, error: "工具箱未初始化" });
      return true;
    }

    // 使用管理器的toggle方法切换显示状态
    console.log("调用 jimengToolsManager.toggle()");
    jimengToolsManager.toggle();
    const status = jimengToolsManager.getStatus();
    console.log("切换工具箱状态:", status);
    sendResponse({ success: true, status });
    return true;
  }

  // 处理终止生成的消息
  if (message.type === "STOP_BATCH_GENERATE") {
    // 将终止信号传递给页面脚本
    window.postMessage(
      {
        type: "STOP_BATCH_GENERATE",
      },
      "*"
    );
    return true;
  }
});

// 等待 DOM 加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // 首先初始化工具箱UI
    initializeToolboxUI();

    // 初始化功能
    initializeToolboxManager();
  });
} else {
  // 首先初始化工具箱UI
  initializeToolboxUI();

  // 初始化功能
  initializeToolboxManager();
}

// 添加全局类型声明
declare global {
  interface Window {
    __jimengTools: any;
  }
}
