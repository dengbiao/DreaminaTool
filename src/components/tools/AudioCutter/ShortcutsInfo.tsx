import React from "react";
import styles from "./styles.module.scss";

export const ShortcutsInfo: React.FC = () => {
  return (
    <div className={styles.keyboardShortcuts}>
      <span>
        <kbd>空格</kbd>播放/暂停
      </span>
      <span>
        <kbd>←</kbd>后退5秒
      </span>
      <span>
        <kbd>→</kbd>前进5秒
      </span>
      <span>
        <kbd>拖拽</kbd>选择区域
      </span>
      <span>
        <kbd>双击</kbd>播放区域
      </span>
      <span>
        <kbd>滚轮</kbd>调整选区长度
      </span>
      <span>
        <kbd>Shift+滚轮</kbd>缩放波形
      </span>
    </div>
  );
};
