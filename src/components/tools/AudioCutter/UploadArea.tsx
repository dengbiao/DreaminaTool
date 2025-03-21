import React, { useCallback, useState, useEffect } from "react";
import styles from "./styles.module.scss";
import { formatDuration } from "../../../tools/utils/timeFormat";

interface UploadAreaProps {
  onFileUpload: (file: File) => void;
  currentFile: File | null;
  onReset: () => void;
  duration?: number;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileUpload,
  currentFile,
  onReset,
  duration,
}) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const dt = e.dataTransfer;
      const files = dt?.files;

      if (files && files.length > 0) {
        const file = files[0];
        if (
          file.type.startsWith("audio/") ||
          file.name.match(/\.(mp3|wav|ogg|m4a)$/i)
        ) {
          onFileUpload(file);
        } else {
          alert("请上传支持的音频文件格式 (MP3, WAV, OGG, M4A)");
        }
      }
    },
    [onFileUpload]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  return (
    <div className={styles.audioUpload}>
      {!currentFile ? (
        <div
          className={styles.uploadArea}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.style.borderColor = "rgba(72, 187, 120, 0.8)";
            e.currentTarget.style.background = "rgba(198, 246, 213, 0.3)";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.style.borderColor = "rgba(72, 187, 120, 0.3)";
            e.currentTarget.style.background =
              "linear-gradient(to bottom, rgba(198, 246, 213, 0.1), rgba(198, 246, 213, 0.2))";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={handleDrop}
        >
          <label htmlFor="audioFileInput" className={styles.uploadLabel}>
            <div className={styles.uploadContent}>
              <div className={styles.uploadIcon}>
                <svg
                  viewBox="0 0 24 24"
                  width="64"
                  height="64"
                  fill="currentColor"
                >
                  <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                </svg>
              </div>
              <div className={styles.uploadText}>
                <div className={styles.primaryText}>点击或拖拽上传音频文件</div>
                <div className={styles.secondaryText}>
                  支持 MP3, WAV, OGG, M4A 格式
                </div>
              </div>
            </div>
          </label>
          <input
            type="file"
            accept=".mp3,.wav,.ogg,.m4a"
            id="audioFileInput"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
        </div>
      ) : (
        <div className={`${styles.fileInfo} ${styles.visible}`}>
          <div className={styles.fileIcon}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div className={styles.fileContent}>
            <div className={styles.fileName}>
              {currentFile.name.length > 40
                ? `${currentFile.name.slice(0, 25)}...${currentFile.name.slice(
                    -10
                  )}`
                : currentFile.name}
            </div>
            <div className={styles.fileDuration}>
              {duration ? `时长：${formatDuration(duration)}` : "加载中..."}
            </div>
          </div>
          <button
            className={styles.deleteBtn}
            title="删除文件"
            onClick={onReset}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
