import React, { useEffect, useRef, useState } from "react";
import { MattingTool } from "../../../content/tools/MattingTool";
import styles from "./MattingWrapper.module.scss";

export const MattingWrapper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolRef = useRef<MattingTool | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (container && !toolRef.current) {
      const initializeTool = async () => {
        try {
          const tool = new MattingTool();
          toolRef.current = tool;

          // 等待 DOM 完全加载
          await new Promise((resolve) => setTimeout(resolve, 100));

          // 创建 UI
          await tool.createUI(container);

          // 等待 UI 元素完全加载
          await new Promise((resolve) => setTimeout(resolve, 100));

          // 初始化工具状态
          if (typeof tool.updateState === "function") {
            tool.updateState({
              hasImage: false,
              hasModel: false,
              hasImageCanvas: false,
              hasMaskCanvas: false,
            });
          }

          setIsInitialized(true);
        } catch (error) {
          console.error("Failed to initialize MattingTool:", error);
        }
      };

      initializeTool();
    }

    return () => {
      if (toolRef.current) {
        // 清理逻辑
        if (typeof toolRef.current.dispose === "function") {
          toolRef.current.dispose();
        }
        toolRef.current = null;
      }
      setIsInitialized(false);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.mattingWrapper}>
      {!isInitialized && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>正在初始化抠图工具...</p>
        </div>
      )}
    </div>
  );
};
