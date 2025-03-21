import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/global.scss";
import { ToolboxLayout } from "../components/layout/ToolboxLayout";
import { tools } from "../utils/toolRegistry";

// 防止重复初始化
const TOOLBOX_ID = "jimeng-toolbox-root";

function initializeToolbox() {
  // 检查是否已存在工具箱
  let container = document.getElementById(TOOLBOX_ID);

  if (!container) {
    // 创建容器
    container = document.createElement("div");
    container.id = TOOLBOX_ID;
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
  document.addEventListener("DOMContentLoaded", initializeToolbox);
} else {
  initializeToolbox();
}

// 添加全局类型声明
declare global {
  interface Window {
    __jimengTools: any;
  }
}
