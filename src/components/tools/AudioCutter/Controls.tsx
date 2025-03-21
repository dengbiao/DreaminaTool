import React, { useCallback, useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { Region, WaveSurferWithPlugins } from "../../../tools/types";
import styles from "./styles.module.scss";

interface ControlsProps {
  wavesurfer: WaveSurferWithPlugins | null;
  currentRegion: Region | null;
  onCut: () => void;
  disabled: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  wavesurfer,
  currentRegion,
  onCut,
  disabled,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const eventsAttached = useRef(false);

  useEffect(() => {
    if (!wavesurfer) {
      setIsPlaying(false);
      eventsAttached.current = false;
      return;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleAudioProcess = () => {
      if (!currentRegion) return;
      const currentTime = wavesurfer.getCurrentTime();
      if (currentTime >= currentRegion.end) {
        wavesurfer.pause();
      }
    };

    if (!eventsAttached.current) {
      wavesurfer.on("play", handlePlay);
      wavesurfer.on("pause", handlePause);
      wavesurfer.on("audioprocess", handleAudioProcess);
      eventsAttached.current = true;
    }

    return () => {
      if (eventsAttached.current && wavesurfer) {
        try {
          wavesurfer.un("play", handlePlay);
          wavesurfer.un("pause", handlePause);
          wavesurfer.un("audioprocess", handleAudioProcess);
          eventsAttached.current = false;
        } catch (error) {
          console.log("清理事件监听器时发生错误:", error);
        }
      }
    };
  }, [wavesurfer, currentRegion]);

  const handlePlayPause = useCallback(() => {
    if (!wavesurfer || !currentRegion) return;

    const currentTime = wavesurfer.getCurrentTime();
    const tolerance = 0.01;

    if (
      currentTime < currentRegion.start ||
      currentTime > currentRegion.end ||
      Math.abs(currentTime - currentRegion.end) <= tolerance
    ) {
      wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
    }
    wavesurfer.playPause();
  }, [wavesurfer, currentRegion]);

  return (
    <div className={styles.audioControls}>
      <button
        id="playPauseBtn"
        disabled={disabled}
        data-playing={isPlaying}
        onClick={handlePlayPause}
        className={styles.playPauseBtn}
      >
        <span className={styles.iconContainer}>
          <svg
            className={styles.playIcon}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            className={styles.pauseIcon}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        </span>
        播放/暂停
      </button>
      <button
        id="cutBtn"
        disabled={disabled}
        onClick={onCut}
        className={styles.cutBtn}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
        </svg>
        分割音频
      </button>
    </div>
  );
};
