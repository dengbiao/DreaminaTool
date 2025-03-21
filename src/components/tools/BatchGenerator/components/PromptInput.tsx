import React, { useCallback, useEffect, useRef } from "react";
import styles from "../BatchGenerator.module.scss";
import { GenerationMode, STORAGE_KEYS } from "../types";

interface PromptInputProps {
  value: string;
  mode: GenerationMode;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  title?: string;
  defaultHeight?: string;
}

const getPlaceholder = (mode: GenerationMode): string => {
  switch (mode) {
    case GenerationMode.NORMAL:
      return "例如：\n一只可爱的猫咪，坐在窗台上看着窗外的风景\n日落时分的海滩，金色的阳光洒在海面上";
    case GenerationMode.SHARED_PARAMS:
      return "输入基础提示词，每行将与通用参数组合\n例如：\n猫咪\n狗狗\n兔子";
    case GenerationMode.REPLACE:
      return "输入替换变量的值，每行对应一组替换\n例如：\n猫咪,窗台\n狗狗,草地\n兔子,花园";
  }
};

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  mode,
  onChange,
  onKeyDown,
  title = "提示词",
  defaultHeight,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  let resizeTimeout: NodeJS.Timeout | null = null;

  // 获取存储键
  const getHeightStorageKey = () => {
    return `${STORAGE_KEYS.PROMPT_HEIGHT_MODE}_${mode}`;
  };

  // 处理输入框高度变化
  const handleResize = useCallback(() => {
    if (!inputRef.current) return;

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      const height = inputRef.current?.style.height;
      if (height) {
        localStorage.setItem(getHeightStorageKey(), height);
      }
    }, 500);
  }, [mode]);

  // 初始化输入框高度
  useEffect(() => {
    if (!inputRef.current) return;
    const savedHeight = localStorage.getItem(getHeightStorageKey());
    if (savedHeight) {
      inputRef.current.style.height = savedHeight;
    } else if (defaultHeight) {
      inputRef.current.style.height = defaultHeight;
    }
  }, [mode, defaultHeight]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // 只有当光标在文本末尾时才滚动到底部
    if (e.target.selectionStart === e.target.value.length) {
      e.target.scrollTop = e.target.scrollHeight;
    }
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      // 检查光标前后是否已经有空行
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionEnd);
      const lastTwoCharsBeforeCursor = beforeCursor.slice(-2);
      const firstTwoCharsAfterCursor = afterCursor.slice(0, 2);

      let newValue;
      let newLineCount;

      if (
        lastTwoCharsBeforeCursor === "\n\n" ||
        firstTwoCharsAfterCursor === "\n\n"
      ) {
        // 如果前面或后面已经有空行，只添加一个换行
        newValue = beforeCursor + "\n" + afterCursor;
        newLineCount = 1;
      } else {
        // 否则添加一个空行
        newValue = beforeCursor + "\n\n" + afterCursor;
        newLineCount = 2;
      }

      // 更新文本内容
      onChange(newValue);

      // 设置新的光标位置
      const newCursorPosition = selectionStart + newLineCount;

      // 使用 requestAnimationFrame 确保在 DOM 更新后执行滚动
      requestAnimationFrame(() => {
        const textarea = inputRef.current;
        if (!textarea) return;

        textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
        textarea.focus();

        // 只在光标在末尾时才滚动到底部
        if (newCursorPosition === newValue.length) {
          textarea.scrollTop = textarea.scrollHeight;
        }
      });
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const promptCount = value.split("\n").filter((line) => line.trim()).length;

  return (
    <div className={styles.promptSection}>
      <div className={styles.promptHeader}>
        <div className={styles.promptTitle}>
          {title}
          {promptCount > 0 && (
            <span className={styles.promptCount}>({promptCount})</span>
          )}
        </div>
      </div>
      <textarea
        ref={inputRef}
        className={styles.promptInput}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onMouseUp={handleResize}
        onTouchEnd={handleResize}
        placeholder={getPlaceholder(mode)}
      />
    </div>
  );
};
