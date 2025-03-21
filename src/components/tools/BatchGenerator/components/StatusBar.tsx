import React from "react";
import styles from "../BatchGenerator.module.scss";
import { ProgressInfo } from "../types";

interface StatusBarProps {
  status: string;
  progress: ProgressInfo | null;
  onStop?: () => void;
  isGenerating: boolean;
  isStopped: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  progress,
  onStop,
  isGenerating,
  isStopped,
}) => {
  return (
    <div className={styles.statusSection}>
      {status && <div className={styles.status}>{status}</div>}
      {progress && (
        <div className={styles.progressContainer}>
          {isStopped ? (
            <div>
              <div className={styles.stoppedMessage}>批量任务已终止</div>
              <div className={styles.resultInfo}>
                <span className={styles.success}>
                  成功: {progress.successCount}
                </span>
                <span className={styles.failure}>
                  失败: {progress.failCount}
                </span>
                <span>
                  进行中:{" "}
                  {progress.total - progress.successCount - progress.failCount}
                </span>
              </div>
            </div>
          ) : (
            !isStopped && (
              <>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressBackground}
                    style={{ width: "100%" }}
                  />
                  <div
                    className={styles.progressFailed}
                    style={{
                      width: `${
                        ((progress.successCount +
                          progress.runningTasks +
                          progress.failCount) /
                          progress.total) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className={styles.progressRunning}
                    style={{
                      width: `${
                        ((progress.successCount + progress.runningTasks) /
                          progress.total) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className={styles.progressSuccess}
                    style={{
                      width: `${
                        (progress.successCount / progress.total) * 100
                      }%`,
                    }}
                  />
                </div>
                <div className={styles.progressText}>
                  <div className={styles.progressInfo}>
                    <span>生成中: {progress.runningTasks}</span>
                    <span>排队中: {progress.queueLength}</span>
                    <span>
                      进度: {progress.totalProcessed}/{progress.total}
                    </span>
                  </div>
                  <div className={styles.resultInfo}>
                    <span className={styles.success}>
                      成功: {progress.successCount}
                    </span>
                    <span className={styles.failure}>
                      失败: {progress.failCount}
                    </span>
                    {isGenerating && onStop && (
                      <button
                        className={styles.stopButton}
                        onClick={onStop}
                        disabled={isStopped}
                      >
                        {isStopped ? "正在终止..." : "终止生成"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
};
