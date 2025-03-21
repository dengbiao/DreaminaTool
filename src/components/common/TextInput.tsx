import React, { useCallback, useEffect, useRef } from "react";
import styles from "./TextInput.module.scss";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  title?: string;
  defaultHeight?: string;
  placeholder?: string;
  storageKey?: string;
  showCount?: boolean;
  autoAddEmptyLine?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onKeyDown,
  title = "输入文本",
  defaultHeight = "200px",
  placeholder = "",
  storageKey,
  showCount = true,
  autoAddEmptyLine = false,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  let resizeTimeout: NodeJS.Timeout | null = null;

  // 处理输入框高度变化
  const handleResize = useCallback(() => {
    if (!inputRef.current || !storageKey) return;

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      const height = inputRef.current?.style.height;
      if (height) {
        localStorage.setItem(storageKey, height);
      }
    }, 500);
  }, [storageKey]);

  // 初始化输入框高度
  useEffect(() => {
    if (!inputRef.current) return;

    if (storageKey) {
      const savedHeight = localStorage.getItem(storageKey);
      if (savedHeight) {
        inputRef.current.style.height = savedHeight;
        return;
      }
    }

    if (defaultHeight) {
      inputRef.current.style.height = defaultHeight;
    }
  }, [storageKey, defaultHeight]);

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
      if (autoAddEmptyLine) {
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
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const lineCount = value.split("\n").filter((line) => line.trim()).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          {title}
          {showCount && lineCount > 0 && (
            <span className={styles.count}>({lineCount})</span>
          )}
        </div>
      </div>
      <textarea
        ref={inputRef}
        className={styles.input}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onMouseUp={handleResize}
        onTouchEnd={handleResize}
        placeholder={placeholder}
      />
    </div>
  );
};
