import React, { forwardRef, useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { Region, WaveSurferWithPlugins } from "../../../tools/types";
import {
  formatTimeCompact,
  formatDuration,
} from "../../../tools/utils/timeFormat";
import styles from "./styles.module.scss";

interface WaveformProps {
  wavesurfer: WaveSurferWithPlugins | null;
  currentRegion: Region | null;
  onRegionUpdate: (region: Region) => void;
  initialZoom: number;
}

export const Waveform = forwardRef<HTMLDivElement, WaveformProps>(
  ({ wavesurfer, currentRegion, onRegionUpdate, initialZoom }, ref) => {
    const [timeInfo, setTimeInfo] = useState({
      total: 0,
      current: 0,
      start: 0,
      end: 0,
    });
    const [isEditingDuration, setIsEditingDuration] = useState(false);
    const [durationInputValue, setDurationInputValue] = useState("");
    const durationInputRef = useRef<HTMLInputElement>(null);
    const eventsAttached = useRef(false);

    // Debug function
    const logTimeInfo = (source: string, info: typeof timeInfo) => {
      console.log(`[Waveform] Time info updated from ${source}:`, {
        total: formatTimeCompact(info.total),
        current: formatTimeCompact(info.current),
        start: formatTimeCompact(info.start),
        end: formatTimeCompact(info.end),
      });
    };

    // 更新选区时间信息
    useEffect(() => {
      if (currentRegion) {
        console.log("[Waveform] currentRegion changed:", {
          start: formatTimeCompact(currentRegion.start),
          end: formatTimeCompact(currentRegion.end),
        });
        setTimeInfo((prev) => {
          const newInfo = {
            ...prev,
            start: currentRegion.start,
            end: currentRegion.end,
          };
          logTimeInfo("currentRegion change", newInfo);
          return newInfo;
        });
      }
    }, [currentRegion]);

    useEffect(() => {
      if (!wavesurfer || !wavesurfer.regions || eventsAttached.current) return;

      console.log("[Waveform] Setting up event listeners");

      const handleReady = () => {
        const duration = wavesurfer.getDuration();
        console.log(
          "[Waveform] Ready event, duration:",
          formatTimeCompact(duration)
        );
        setTimeInfo((prev) => {
          const newInfo = {
            ...prev,
            total: duration,
          };
          logTimeInfo("ready event", newInfo);
          return newInfo;
        });
      };

      const handleTimeupdate = () => {
        const currentTime = wavesurfer.getCurrentTime();
        setTimeInfo((prev) => {
          const newInfo = {
            ...prev,
            current: currentTime,
          };
          // Don't log timeupdate to avoid console spam
          return newInfo;
        });
      };

      const handleRegionUpdating = (region: Region) => {
        console.log("[Waveform] Region updating:", {
          start: formatTimeCompact(region.start),
          end: formatTimeCompact(region.end),
        });
        setTimeInfo((prev) => {
          const newInfo = {
            ...prev,
            start: region.start,
            end: region.end,
          };
          logTimeInfo("region updating", newInfo);
          return newInfo;
        });
      };

      const handleRegionUpdated = (region: Region) => {
        console.log("[Waveform] Region updated:", {
          start: formatTimeCompact(region.start),
          end: formatTimeCompact(region.end),
        });
        setTimeInfo((prev) => {
          const newInfo = {
            ...prev,
            start: region.start,
            end: region.end,
          };
          logTimeInfo("region updated", newInfo);
          return newInfo;
        });
        onRegionUpdate(region);
      };

      // 在 regions 插件上监听区域更新事件
      wavesurfer.regions.on("region-updating", handleRegionUpdating);
      wavesurfer.regions.on("region-updated", handleRegionUpdated);

      // 在 wavesurfer 实例上监听其他事件
      wavesurfer.on("ready", handleReady);
      wavesurfer.on("timeupdate", handleTimeupdate);

      eventsAttached.current = true;

      return () => {
        console.log("[Waveform] Cleaning up event listeners");
        if (wavesurfer && wavesurfer.regions) {
          try {
            wavesurfer.regions.un("region-updating", handleRegionUpdating);
            wavesurfer.regions.un("region-updated", handleRegionUpdated);
            wavesurfer.un("ready", handleReady);
            wavesurfer.un("timeupdate", handleTimeupdate);
            eventsAttached.current = false;
          } catch (error) {
            console.error(
              "[Waveform] Error cleaning up event listeners:",
              error
            );
          }
        }
      };
    }, [wavesurfer, onRegionUpdate]);

    // 添加新的 effect 来处理 wavesurfer 为 null 的情况
    useEffect(() => {
      if (!wavesurfer) {
        // 重置所有时间信息
        setTimeInfo({
          total: 0,
          current: 0,
          start: 0,
          end: 0,
        });
        eventsAttached.current = false;
      }
    }, [wavesurfer]);

    useEffect(() => {
      const container = wavesurfer?.getWrapper();
      if (!container || !wavesurfer) return;

      // 计算缩放限制
      const duration = wavesurfer.getDuration();
      const containerWidth = container.clientWidth;

      // 最小缩放：确保整个音频至少占据容器宽度的 80%
      const minPxPerSec = Math.max(1, (containerWidth * 0.8) / duration);

      // 最大缩放：考虑三个因素
      // 1. 容器宽度的 10 倍（确保能看到足够细节）
      // 2. 初始缩放值的 2 倍（确保能超过初始显示）
      // 3. 最小值 2000（确保有足够的放大空间）
      const maxPxPerSec = Math.max(
        2000,
        (containerWidth * 10) / Math.min(duration, 5),
        initialZoom * 2
      );

      console.log("[Waveform] Zoom limits calculated:", {
        containerWidth,
        duration,
        initialZoom,
        minPxPerSec: Math.round(minPxPerSec),
        maxPxPerSec: Math.round(maxPxPerSec),
        containerWidthRatio: containerWidth / duration,
      });

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!wavesurfer || !currentRegion) return;

        const container = wavesurfer.getWrapper();
        const containerWidth = container.clientWidth;
        const scrollWidth = container.scrollWidth;
        const scrollLeft = container.scrollLeft;
        const viewportWidth = containerWidth;
        const viewportCenter = scrollLeft + viewportWidth / 2;
        const timeAtCenter = (viewportCenter / scrollWidth) * duration;

        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          // 计算当前的像素/秒比率
          const currentPxPerSec = scrollWidth / duration;

          // 缩放因子，shift 时缩放速度更快
          const baseZoomFactor = e.shiftKey ? 1.1 : 1.05;
          // 根据滚动方向决定是放大还是缩小
          const zoomFactor = e.deltaY < 0 ? baseZoomFactor : 1 / baseZoomFactor;

          // 计算新的缩放级别
          const newPxPerSec = Math.min(
            Math.max(currentPxPerSec * zoomFactor, minPxPerSec),
            maxPxPerSec
          );

          console.log("[Waveform] Zoom calculation:", {
            currentPxPerSec: Math.round(currentPxPerSec),
            newPxPerSec: Math.round(newPxPerSec),
            zoomFactor: zoomFactor.toFixed(2),
            minPxPerSec: Math.round(minPxPerSec),
            maxPxPerSec: Math.round(maxPxPerSec),
            direction: e.deltaY < 0 ? "zoom in" : "zoom out",
          });

          // 应用新的缩放级别
          wavesurfer.zoom(newPxPerSec);

          // 调整滚动位置以保持视图中心
          const newScrollWidth = container.scrollWidth;
          const newScrollLeft =
            (timeAtCenter * newScrollWidth) / duration - viewportWidth / 2;

          // 确保滚动位置在有效范围内
          const maxScrollLeft = Math.max(0, newScrollWidth - viewportWidth);
          container.scrollLeft = Math.min(
            Math.max(0, newScrollLeft),
            maxScrollLeft
          );

          console.log("[Waveform] Scroll adjustment:", {
            oldScrollLeft: Math.round(scrollLeft),
            newScrollLeft: Math.round(container.scrollLeft),
            maxScrollLeft: Math.round(maxScrollLeft),
            viewportWidth,
            newScrollWidth,
          });
        } else {
          // 调整选区大小
          const delta = e.deltaY * 0.001; // 调整灵敏度
          const regionDuration = currentRegion.end - currentRegion.start;
          const regionCenter = (currentRegion.start + currentRegion.end) / 2;

          // 计算新的选区范围
          let newStart = Math.max(
            0,
            regionCenter - (regionDuration * (1 + delta)) / 2
          );
          let newEnd = Math.min(
            duration,
            regionCenter + (regionDuration * (1 + delta)) / 2
          );

          // 更新选区
          currentRegion.setOptions({
            start: newStart,
            end: newEnd,
          });

          // 触发选区更新事件
          onRegionUpdate(currentRegion);
        }
      };

      container.addEventListener("wheel", handleWheel);
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }, [wavesurfer, currentRegion, initialZoom]);

    const handleDurationDoubleClick = () => {
      if (!currentRegion) return;
      setIsEditingDuration(true);
      setDurationInputValue(formatTimeCompact(timeInfo.end - timeInfo.start));
      setTimeout(() => {
        if (durationInputRef.current) {
          durationInputRef.current.focus();
          durationInputRef.current.select();
        }
      }, 0);
    };

    const handleDurationInputKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleDurationSubmit();
      } else if (e.key === "Escape") {
        setIsEditingDuration(false);
      }
    };

    const handleDurationSubmit = () => {
      if (!currentRegion || !wavesurfer) return;

      const timePattern = /^(\d+):(\d+)(?:\.(\d+))?$/;
      const match = durationInputValue.match(timePattern);

      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3]
          ? parseInt(match[3], 10) / Math.pow(10, match[3].length)
          : 0;
        const newDuration = minutes * 60 + seconds + milliseconds;

        if (
          newDuration > 0 &&
          timeInfo.start + newDuration <= wavesurfer.getDuration()
        ) {
          const newEnd = timeInfo.start + newDuration;
          console.log("[Waveform] Updating region duration:", {
            start: formatTimeCompact(timeInfo.start),
            end: formatTimeCompact(newEnd),
            duration: formatTimeCompact(newDuration),
          });

          try {
            // 保存当前区域的属性
            const { id, color, drag, resize } = currentRegion;

            // 移除当前区域
            currentRegion.remove();

            // 立即创建新区域
            const newRegion = wavesurfer.regions.addRegion({
              id, // 保持相同的 ID
              start: timeInfo.start,
              end: newEnd,
              color,
              drag,
              resize,
            });

            // 更新状态
            onRegionUpdate(newRegion);
            setTimeInfo((prev) => {
              const newInfo = {
                ...prev,
                end: newEnd,
              };
              logTimeInfo("duration input", newInfo);
              return newInfo;
            });
          } catch (error) {
            console.error("[Waveform] Error updating region:", error);
          }
        }
      }

      setIsEditingDuration(false);
    };

    return (
      <div className={styles.waveformContainer}>
        <div className={styles.timeInfo}>
          <div className={`${styles.timeItem} ${styles.total}`}>
            <span className={styles.label}>总时长</span>
            <span className={styles.value}>
              <span className={styles.time}>
                {formatTimeCompact(timeInfo.total)}
              </span>
            </span>
          </div>
          <div className={`${styles.timeItem} ${styles.cursor}`}>
            <span className={styles.label}>当前位置</span>
            <span className={styles.value}>
              <span className={styles.time}>
                {formatTimeCompact(timeInfo.current)}
              </span>
            </span>
          </div>
          <div className={`${styles.timeItem} ${styles.selection}`}>
            <span className={styles.label}>选区范围</span>
            <span className={styles.value}>
              <span className={styles.time}>
                {formatTimeCompact(timeInfo.start)}
              </span>
              <span>-</span>
              <span className={styles.time}>
                {formatTimeCompact(timeInfo.end)}
              </span>
              <span
                className={styles.duration}
                onDoubleClick={handleDurationDoubleClick}
                style={{ cursor: "pointer" }}
              >
                {isEditingDuration ? (
                  <input
                    ref={durationInputRef}
                    type="text"
                    className={styles.durationInput}
                    value={durationInputValue}
                    onChange={(e) => setDurationInputValue(e.target.value)}
                    onKeyDown={handleDurationInputKeyDown}
                    onBlur={handleDurationSubmit}
                  />
                ) : (
                  `时长: ${formatTimeCompact(timeInfo.end - timeInfo.start)}`
                )}
              </span>
            </span>
          </div>
        </div>
        <div ref={ref} className={styles.waveform} />
      </div>
    );
  }
);
