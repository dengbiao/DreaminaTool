import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/global.scss";
import { ToolboxLayout } from "../components/layout/ToolboxLayout";
import { tools } from "../utils/toolRegistry";
import { JimengTools } from "./JimengTools";

// 初始化即梦工具实例
let jimengTools: JimengTools | null = null;

// 防止重复初始化
const TOOLBOX_ID = "jimeng-toolbox-root";

// 添加防抖功能避免短时间内重复处理消息
let lastToggleTime = 0;
const TOGGLE_DEBOUNCE_TIME = 500; // 防抖间隔，单位毫秒

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
    const now = Date.now();
    if (now - lastToggleTime < TOGGLE_DEBOUNCE_TIME) {
      console.log("忽略重复的toggleToolbox消息");
      sendResponse({ success: false, error: "消息过于频繁，已忽略" });
      return true;
    }
    lastToggleTime = now;

    if (!jimengTools) {
      console.log("JimengTools not initialized yet");
      sendResponse({ success: false, error: "Not initialized" });
      return true;
    }

    jimengTools.toggle();
    const status = jimengTools.getStatus();
    console.log("Toggled toolbox, new status:", status);
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

function initializeToolbox() {
  // 检查是否已存在工具箱
  let container = document.getElementById(TOOLBOX_ID);

  if (!container) {
    // 创建容器
    container = document.createElement("div");
    container.id = TOOLBOX_ID;
    // 默认隐藏工具箱
    container.style.display = "none";
    document.body.appendChild(container);

    // 创建 React 根节点并渲染
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ToolboxLayout tools={tools} />
      </React.StrictMode>
    );
  }
}

// 等待 DOM 加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // 首先初始化工具箱UI
    initializeToolbox();

    // 只在即梦网站上初始化工具
    if (window.location.hostname === "jimeng.jianying.com") {
      jimengTools = JimengTools.getInstance();
      jimengTools.initialize();
      console.log("即梦工具初始化完成，工具箱UI默认隐藏，点击插件图标可显示");
    }
  });
} else {
  // 首先初始化工具箱UI
  initializeToolbox();

  // 只在即梦网站上初始化工具
  if (window.location.hostname === "jimeng.jianying.com") {
    jimengTools = JimengTools.getInstance();
    jimengTools.initialize();
    console.log("即梦工具初始化完成，工具箱UI默认隐藏，点击插件图标可显示");
  }
}

// 添加全局类型声明
declare global {
  interface Window {
    __jimengTools: any;
  }
}
