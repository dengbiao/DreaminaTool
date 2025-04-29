import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ToolboxLayout.module.scss";
import { Tool } from "../../utils/toolRegistry";
import { STORAGE_KEYS } from "../../components/tools/BatchGenerator/types";

interface ToolboxLayoutProps {
  tools?: Tool[];
  children?: React.ReactNode;
  title?: string;
  padding?: number;
  // 添加UI控制能力的接口
  onClose?: () => void;
  onToolSelect?: (tool: Tool | null) => void;
}

interface Position {
  x: number;
  y: number;
}

export const ToolboxLayout: React.FC<ToolboxLayoutProps> = ({
  tools = [],
  children,
  title,
  padding = 0,
  onClose,
  onToolSelect,
}) => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolWidth, setToolWidth] = useState<number | undefined>(() => {
    // 从本地存储获取工具宽度
    if (selectedTool) {
      const savedWidth = localStorage.getItem(
        `${STORAGE_KEYS.TOOL_WIDTH}_${selectedTool.name}`
      );
      return savedWidth ? parseInt(savedWidth) : selectedTool.defaultWidth;
    }
    return undefined;
  });
  const [isAIAssistant, setIsAIAssistant] = useState(false);
  const [iconUrl, setIconUrl] = useState("");
  const [position, setPosition] = useState<Position>(() => {
    const savedPosition = localStorage.getItem(STORAGE_KEYS.TOOL_POSITION);
    // 只有当存在保存的位置时才使用它，否则使用默认的右上角位置
    return savedPosition ? JSON.parse(savedPosition) : null;
  });
  const [height, setHeight] = useState(() => {
    const savedHeight = localStorage.getItem(STORAGE_KEYS.TOOL_HEIGHT);
    return savedHeight ? parseInt(savedHeight) : 700; // 默认高度 700px
  });

  const toolboxRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const isResizingWidthRef = useRef(false);
  const dragStartPosRef = useRef<Position>({ x: 0, y: 0 });
  const hasBeenDraggedRef = useRef(false);
  const startHeightRef = useRef(0);
  const startYRef = useRef(0);
  const resizeStartRef = useRef({
    width: 0,
    right: 0,
    mouseX: 0,
  });

  const contentRef = useRef<HTMLDivElement>(null);

  // 检查URL中是否有toolId参数，如果有则自动选择对应的工具
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const toolId = url.searchParams.get("toolId");

      if (toolId && tools.length > 0) {
        // 根据toolId查找对应的工具
        let toolToSelect: Tool | undefined;

        if (toolId === "batch-generator") {
          toolToSelect = tools.find((tool) => tool.name === "批量生成");
        } else if (toolId === "story-assistant") {
          toolToSelect = tools.find((tool) => tool.name === "故事创作");
        }

        if (toolToSelect) {
          // 自动选择工具
          setSelectedTool(toolToSelect);

          // 获取保存的工具宽度或使用默认宽度
          const savedWidth = localStorage.getItem(
            `${STORAGE_KEYS.TOOL_WIDTH}_${toolToSelect.name}`
          );
          setToolWidth(
            savedWidth ? parseInt(savedWidth) : toolToSelect.defaultWidth
          );

          // 检查是否是 AI 助手工具
          setIsAIAssistant(toolToSelect.name === "AI 助手");
        }
      }
    } catch (error) {
      console.error("Error checking toolId in URL:", error);
    }
  }, [tools]);

  useEffect(() => {
    // 设置图标URL
    setIconUrl(chrome.runtime.getURL("icons/icon128.png"));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!toolboxRef.current) return;

    // 检查是否点击了调整器
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.resizeHandle}`)) {
      isResizingRef.current = true;
      startHeightRef.current = toolboxRef.current.offsetHeight;
      startYRef.current = e.clientY;
      // 防止事件冒泡，避免触发拖拽
      e.stopPropagation();
      return;
    }

    // 只允许从header区域拖拽
    if (!target.closest(`.${styles.header}`)) return;

    isDraggingRef.current = true;
    const rect = toolboxRef.current.getBoundingClientRect();
    const currentX = position?.x ?? rect.right - rect.width - 20;
    const currentY = position?.y ?? 20;

    dragStartPosRef.current = {
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    };
  };

  // 确保整个组件范围都能检测底部 resizeHandle 的点击
  const handleResizeHandleClick = (e: React.MouseEvent) => {
    if (!toolboxRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.resizeHandle}`)) {
      console.log("开始调整高度");
      isResizingRef.current = true;
      startHeightRef.current = toolboxRef.current.offsetHeight;
      startYRef.current = e.clientY;
      e.stopPropagation();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!toolboxRef.current) return;

      if (isResizingRef.current) {
        const deltaY = e.clientY - startYRef.current;
        const newHeight = Math.max(
          450,
          Math.min(startHeightRef.current + deltaY, window.innerHeight - 60)
        );
        setHeight(newHeight);
        return;
      }

      if (!isDraggingRef.current) return;

      hasBeenDraggedRef.current = true;
      const newX = e.clientX - dragStartPosRef.current.x;
      const newY = e.clientY - dragStartPosRef.current.y;

      // 确保不超出屏幕边界
      const maxX = window.innerWidth - toolboxRef.current.offsetWidth;
      const maxY = window.innerHeight - toolboxRef.current.offsetHeight;

      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        localStorage.setItem(STORAGE_KEYS.TOOL_HEIGHT, height.toString());
        isResizingRef.current = false;
      }

      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        // 只有在实际发生拖拽时才保存位置
        if (hasBeenDraggedRef.current && position) {
          localStorage.setItem(
            STORAGE_KEYS.TOOL_POSITION,
            JSON.stringify(position)
          );
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [position, height]);

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    // 获取保存的工具宽度或使用默认宽度
    const savedWidth = localStorage.getItem(
      `${STORAGE_KEYS.TOOL_WIDTH}_${tool.name}`
    );
    setToolWidth(savedWidth ? parseInt(savedWidth) : tool.defaultWidth);
    // 检查是否是 AI 助手工具
    setIsAIAssistant(tool.name === "AI 助手");

    // 通知外部工具已选择
    if (onToolSelect) {
      onToolSelect(tool);
    }
  };

  const handleBack = () => {
    // 检查是否是从 AI 助手返回首页
    const isFromAIAssistant = isAIAssistant;

    // 在更改状态前获取当前工具箱的位置和尺寸信息
    let rightEdgePosition = 0;
    if (isFromAIAssistant && toolboxRef.current) {
      const rect = toolboxRef.current.getBoundingClientRect();
      // 保存右边缘的位置（相对于视窗）
      rightEdgePosition = rect.right;
    }

    setSelectedTool(null);
    setToolWidth(undefined);
    setIsAIAssistant(false);

    // 通知外部工具已取消选择
    if (onToolSelect) {
      onToolSelect(null);
    }

    // 如果是从 AI 助手返回，则调整位置，保持右边框不动
    if (isFromAIAssistant && toolboxRef.current) {
      // 等待状态更新和DOM渲染后获取新宽度
      setTimeout(() => {
        if (!toolboxRef.current) return;

        // 获取工具箱当前宽度
        const currentWidth = toolboxRef.current.offsetWidth;

        // 计算新的左边界位置，使右边缘保持不变
        const newX = Math.max(0, rightEdgePosition - currentWidth);
        const currentY = position?.y ?? 20;

        // 更新位置
        setPosition({
          x: newX,
          y: currentY,
        });

        // 保存位置到本地存储
        localStorage.setItem(
          STORAGE_KEYS.TOOL_POSITION,
          JSON.stringify({ x: newX, y: currentY })
        );
      }, 0);
    }
  };

  const handleClose = () => {
    // 通过 props 回调关闭工具箱
    if (onClose) {
      onClose();
    }
  };

  // 添加宽度变化监听
  useEffect(() => {
    if (selectedTool && toolWidth) {
      localStorage.setItem(
        `${STORAGE_KEYS.TOOL_WIDTH}_${selectedTool.name}`,
        toolWidth.toString()
      );
    }
  }, [selectedTool, toolWidth]);

  // 添加宽度调整功能
  const handleWidthResize = useCallback(
    (e: MouseEvent, isLeftHandle: boolean) => {
      if (!toolboxRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.mouseX;

      if (isLeftHandle) {
        // 左侧调整：保持右边界位置不变
        const newX = Math.min(
          Math.max(0, resizeStartRef.current.mouseX + deltaX),
          resizeStartRef.current.right - 330
        );
        const newWidth = resizeStartRef.current.right - newX;

        setPosition((prev) =>
          prev ? { ...prev, x: newX } : { x: newX, y: 20 }
        );
        setToolWidth(newWidth);
      } else {
        // 右侧调整：保持左边界位置不变
        const viewportWidth = window.innerWidth;
        const maxWidth = viewportWidth - 20; // 考虑右边距

        // 计算新宽度，确保不小于最小宽度
        const newWidth = Math.min(
          Math.max(330, resizeStartRef.current.width + deltaX),
          maxWidth
        );

        // 直接设置新宽度，不改变位置（保持左边界不变）
        setToolWidth(newWidth);
      }
    },
    []
  );

  // 添加宽度调整的事件监听
  useEffect(() => {
    let isLeftHandle = false;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const widthResizeHandle = target.closest(`.${styles.widthResizeHandle}`);
      if (widthResizeHandle) {
        const rect = toolboxRef.current?.getBoundingClientRect();
        if (!rect) return;

        isResizingWidthRef.current = true;
        isLeftHandle = widthResizeHandle.classList.contains(`${styles.left}`);

        // 记录调整开始时的状态
        resizeStartRef.current = {
          width: rect.width,
          right: rect.right,
          mouseX: e.clientX,
        };

        // 添加用户选择限制，提升性能
        document.body.style.userSelect = "none";
        document.body.style.cursor = "ew-resize";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidthRef.current) {
        e.preventDefault();
        handleWidthResize(e, isLeftHandle);
      }
    };

    const handleMouseUp = () => {
      if (isResizingWidthRef.current) {
        isResizingWidthRef.current = false;
        // 移除用户选择限制
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // 确保清理样式
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [handleWidthResize]);

  // 修改调整位置的函数，只在特定情况下靠右对齐
  const adjustPosition = useCallback((width: number, height: number) => {
    if (!toolboxRef.current) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minX = 0;
    const minY = 0;
    const maxX = viewportWidth - width - 20; // 考虑右边距
    const maxY = viewportHeight - height - 20; // 考虑底部边距

    setPosition((prev) => {
      // 如果没有之前的位置，使用默认右上角位置
      const currentX = prev?.x ?? viewportWidth - width - 20;
      const currentY = prev?.y ?? 20;

      // 确保位置在可视区域内
      const newX = Math.max(minX, Math.min(currentX, maxX));
      const newY = Math.max(minY, Math.min(currentY, maxY));

      // 只有当位置需要调整时才返回新的位置
      if (newX !== currentX || newY !== currentY) {
        return { x: newX, y: newY };
      }
      return prev ?? { x: newX, y: newY };
    });
  }, []);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (!toolboxRef.current) return;

      const currentWidth = toolboxRef.current.offsetWidth;
      const currentHeight = toolboxRef.current.offsetHeight;

      // 调整高度确保不超出视窗
      const maxHeight = window.innerHeight - 40;
      if (currentHeight > maxHeight) {
        setHeight(maxHeight);
      }

      // 调整位置确保在可视区域内
      adjustPosition(currentWidth, currentHeight);
    };

    // 初始检查
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustPosition]);

  // 在工具选择变化时检查位置
  useEffect(() => {
    if (selectedTool && toolboxRef.current) {
      const currentWidth = toolboxRef.current.offsetWidth;
      const currentHeight = toolboxRef.current.offsetHeight;

      // 如果工具太宽，调整到合适的宽度
      if (currentWidth > window.innerWidth - 40) {
        setToolWidth(window.innerWidth - 40);
      }

      adjustPosition(currentWidth, currentHeight);
    }
  }, [selectedTool, adjustPosition]);

  // 在工具宽度变化时检查位置
  useEffect(() => {
    if (toolWidth && toolboxRef.current) {
      const currentHeight = toolboxRef.current.offsetHeight;
      adjustPosition(toolWidth, currentHeight);
    }
  }, [toolWidth, adjustPosition]);

  // 添加滚动到底部的方法
  const scrollToBottom = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // if (!isVisible) return null;

  return (
    <div
      className={styles.toolbox}
      ref={toolboxRef}
      style={{
        ...(position
          ? { left: `${position.x}px`, top: `${position.y}px`, right: "auto" }
          : { right: "20px", top: "20px" }),
        height: `${height}px`,
        width: toolWidth ? `${toolWidth}px` : undefined,
      }}
    >
      <div className={styles.header} onMouseDown={handleMouseDown}>
        <div className={styles.titleWrapper}>
          {selectedTool ? (
            <button
              className={styles.backButton}
              onClick={handleBack}
              title="返回主菜单"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {selectedTool.name}
            </button>
          ) : (
            <>
              <div className={styles.icon}>
                {iconUrl && <img src={iconUrl} alt="即梦工具箱" />}
              </div>
              <h1 className={styles.title}>{title || "即梦工具箱"}</h1>
            </>
          )}
        </div>
        <button className={styles.closeButton} onClick={handleClose}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div
        className={styles.content}
        ref={contentRef}
        style={{ padding: `${padding}px` }}
      >
        {selectedTool ? (
          <>
            <div className={`${styles.widthResizeHandle} ${styles.left}`} />
            <selectedTool.component scrollToBottom={scrollToBottom} />
            <div className={`${styles.widthResizeHandle} ${styles.right}`} />
          </>
        ) : tools.length > 0 ? (
          <ul className={styles.toolList}>
            {tools.map((tool) => (
              <li
                key={tool.name}
                className={styles.toolItem}
                onClick={() => handleToolClick(tool)}
              >
                <div className={styles.toolIcon}>{tool.icon}</div>
                <p className={styles.toolName}>{tool.name}</p>
                <p className={styles.toolDescription}>{tool.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          children
        )}
      </div>
      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeHandleClick}
        style={{ cursor: "ns-resize", zIndex: 1000 }}
        title="拖动调整高度"
      />
    </div>
  );
};
