import React, { useEffect, useRef } from "react";
import { AudioSegment } from "../../../tools/types";
import { formatTimeCompact } from "../../../tools/utils/timeFormat";
import styles from "./styles.module.scss";

interface SegmentsListProps {
  segments: AudioSegment[];
  onSegmentPlay: (segment: AudioSegment) => void;
  onSegmentDelete: (segmentId: number) => void;
}

export const SegmentsList: React.FC<SegmentsListProps> = ({
  segments,
  onSegmentPlay,
  onSegmentDelete,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && segments.length > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [segments.length]);

  const handleDownload = (segment: AudioSegment) => {
    const url = URL.createObjectURL(segment.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audio_segment_${Math.floor(segment.start)}-${Math.floor(
      segment.end
    )}.mp3`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.segmentsList}>
      <div className={styles.segmentsListHeader}>已分割音频片段列表</div>
      <div ref={listRef} className={styles.segmentsListContent}>
        {segments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="currentColor"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className={styles.emptyText}>暂无分割片段</div>
            <div className={styles.emptySubtext}>
              在波形区域选择要分割的部分，然后点击"分割"按钮
            </div>
          </div>
        ) : (
          segments.map((segment, index) => (
            <div
              key={segment.id}
              className={`${styles.segmentItem} ${
                index === segments.length - 1 ? styles.new : ""
              }`}
            >
              <div className={styles.segmentContent}>
                <div className={styles.segmentTitle}>片段 {index + 1}</div>
                <div className={styles.timeDetails}>
                  <div className={styles.timeRow}>
                    <span className={styles.timeLabel}>开始：</span>
                    <span className={styles.timeValue}>
                      {formatTimeCompact(segment.start)}
                    </span>
                  </div>
                  <div className={styles.timeRow}>
                    <span className={styles.timeLabel}>结束：</span>
                    <span className={styles.timeValue}>
                      {formatTimeCompact(segment.end)}
                    </span>
                  </div>
                  <div className={`${styles.timeRow} ${styles.duration}`}>
                    <span className={styles.timeLabel}>时长：</span>
                    <span className={styles.timeValue}>
                      {formatTimeCompact(segment.duration)}
                    </span>
                  </div>
                </div>
                <div className={styles.segmentControls}>
                  <button
                    className={styles.playBtn}
                    title="播放"
                    onClick={() => onSegmentPlay(segment)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button
                    className={styles.downloadBtn}
                    title="下载"
                    onClick={() => handleDownload(segment)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                  </button>
                  <button
                    className={styles.deleteBtn}
                    title="删除"
                    onClick={() => onSegmentDelete(segment.id)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
