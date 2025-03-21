import React from "react";
import styles from "./styles.module.scss";

interface LoadingOverlayProps {
  isVisible: boolean;
  onCancel: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  onCancel,
}) => {
  return (
    <div
      className={`${styles.loadingOverlay} ${isVisible ? styles.active : ""}`}
    >
      <div className={styles.loadingSpinner} />
      <div className={styles.loadingText}>正在处理音频...</div>
      <button className={styles.cancelButton} onClick={onCancel}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
        取消处理
      </button>
    </div>
  );
};
