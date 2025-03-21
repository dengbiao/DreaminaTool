import { useEffect, useCallback } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

interface HotkeyOptions {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export function useHotkey(
  key: string,
  handler: KeyHandler,
  options: HotkeyOptions = {}
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { ctrl = false, alt = false, shift = false, meta = false } = options;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        !!e.ctrlKey === ctrl &&
        !!e.altKey === alt &&
        !!e.shiftKey === shift &&
        !!e.metaKey === meta &&
        // 确保不是在输入框中触发
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handler(e);
      }
    },
    [key, handler, options]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
} 