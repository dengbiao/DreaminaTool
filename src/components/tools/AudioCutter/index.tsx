import React, { useRef, useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import { AudioEncoder } from "../../../tools/utils/audioEncoder";
import { UploadArea } from "./UploadArea";
import { Waveform } from "./Waveform";
import { Controls } from "./Controls";
import { SegmentsList } from "./SegmentsList";
import { ShortcutsInfo } from "./ShortcutsInfo";
import { LoadingOverlay } from "./LoadingOverlay";
import {
  AudioSegment,
  Region,
  WaveSurferWithPlugins,
  ExtendedWaveSurferOptions,
} from "../../../tools/types";
import styles from "./styles.module.scss";

export const AudioCutter: React.FC = () => {
  const [wavesurfer, setWavesurfer] = useState<WaveSurferWithPlugins | null>(
    null
  );
  const [audioContext] = useState(() => new AudioContext());
  const [currentBuffer, setCurrentBuffer] = useState<AudioBuffer | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [initialZoom, setInitialZoom] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    const options: ExtendedWaveSurferOptions = {
      container: waveformRef.current,
      waveColor: "#90EE90",
      progressColor: "#ADD8E6",
      cursorColor: "#2196F3",
      cursorWidth: 2,
      height: 96,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      responsive: true,
      normalize: true,
      fillParent: false,
      minPxPerSec: 20,
      maxCanvasWidth: 8000,
      scrollParent: true,
      hideScrollbar: false,
      interact: true,
      splitChannels: false,
      autoCenter: true,
      autoScroll: true,
    };

    const wavesurferInstance = WaveSurfer.create(
      options
    ) as WaveSurferWithPlugins;

    // 创建并添加 regions 插件
    const regionsPlugin = RegionsPlugin.create({
      dragSelection: {
        slop: 5,
      },
      color: "rgba(0, 128, 255, 0.2)",
      handleStyle: {
        left: {
          width: "8px",
          height: "100%",
          position: "absolute",
          top: "0px",
          left: "-4px",
          cursor: "ew-resize",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: "4",
          borderRadius: "2px 0 0 2px",
          overflow: "visible",
        },
        right: {
          width: "8px",
          height: "100%",
          position: "absolute",
          top: "0px",
          right: "-4px",
          cursor: "ew-resize",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: "4",
          borderRadius: "0 2px 2px 0",
          overflow: "visible",
        },
      },
      handleStyleHover: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
    });

    wavesurferInstance.registerPlugin(regionsPlugin);
    Object.defineProperty(wavesurferInstance, "regions", {
      value: regionsPlugin,
      writable: false,
    });

    // 监听 ready 事件
    wavesurferInstance.on("ready", () => {
      const duration = wavesurferInstance.getDuration();
      if (waveformRef.current) {
        const containerWidth = waveformRef.current.clientWidth;
        const randomFactor = 0.95 + Math.random() * 0.03;
        const pxPerSec = (containerWidth * randomFactor) / duration;
        setInitialZoom(pxPerSec);
        wavesurferInstance.zoom(pxPerSec);
      }

      // 创建初始区域
      const region = regionsPlugin.addRegion({
        start: 0,
        end: duration,
        color: "rgba(76, 175, 80, 0.2)",
        drag: true,
        resize: true,
      });
      setCurrentRegion(region);
    });

    setWavesurfer(wavesurferInstance);

    return () => {
      if (wavesurferInstance) {
        wavesurferInstance.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      if (!wavesurfer || !currentRegion) return;

      const currentTime = wavesurfer.getCurrentTime();
      const duration = wavesurfer.getDuration();

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (
            currentTime < currentRegion.start ||
            currentTime > currentRegion.end
          ) {
            wavesurfer.seekTo(currentRegion.start / duration);
          }
          await wavesurfer.playPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          const newTimeLeft = Math.max(currentTime - 5, 0);
          wavesurfer.seekTo(newTimeLeft / duration);
          break;
        case "ArrowRight":
          e.preventDefault();
          const newTimeRight = Math.min(currentTime + 5, duration);
          wavesurfer.seekTo(newTimeRight / duration);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [wavesurfer, currentRegion]);

  const handleFileUpload = async (file: File) => {
    if (!wavesurfer) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (arrayBuffer) {
        try {
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          setCurrentBuffer(buffer);
          setCurrentFile(file);

          // 加载音频文件
          await wavesurfer.loadBlob(file);
        } catch (error) {
          console.error("Error loading audio:", error);
          alert("加载音频文件失败，请重试");
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCutAudio = async () => {
    if (!currentRegion || !currentBuffer || isProcessing) return;

    try {
      setIsProcessing(true);
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const startTime = currentRegion.start;
      const endTime = currentRegion.end;
      const startOffset = Math.floor(startTime * currentBuffer.sampleRate);
      const endOffset = Math.floor(endTime * currentBuffer.sampleRate);
      const length = endOffset - startOffset;

      console.log("[AudioCutter] Cutting audio:", {
        startTime,
        endTime,
        startOffset,
        endOffset,
        length,
        sampleRate: currentBuffer.sampleRate,
        channels: currentBuffer.numberOfChannels,
      });

      if (signal.aborted) {
        throw new Error("Operation cancelled");
      }

      // 创建新的 AudioBuffer
      const newBuffer = audioContext.createBuffer(
        currentBuffer.numberOfChannels,
        length,
        currentBuffer.sampleRate
      );

      // 复制每个通道的数据
      for (
        let channel = 0;
        channel < currentBuffer.numberOfChannels;
        channel++
      ) {
        if (signal.aborted) {
          throw new Error("Operation cancelled");
        }

        const channelData = currentBuffer.getChannelData(channel);
        const newChannelData = new Float32Array(length);

        // 手动复制数据
        for (let i = 0; i < length; i++) {
          if (startOffset + i < channelData.length) {
            newChannelData[i] = channelData[startOffset + i];
          }
        }

        newBuffer.copyToChannel(newChannelData, channel, 0);
      }

      if (signal.aborted) {
        throw new Error("Operation cancelled");
      }

      // 检查新缓冲区
      console.log("[AudioCutter] New buffer created:", {
        duration: newBuffer.duration,
        length: newBuffer.length,
        sampleRate: newBuffer.sampleRate,
        channels: newBuffer.numberOfChannels,
      });

      // 转换为 MP3
      console.log("[AudioCutter] Converting to MP3...");
      const mp3Data = await AudioEncoder.convertToMp3(newBuffer);

      // 添加到片段列表
      setSegments((prev) => [
        ...prev,
        {
          id: Date.now(),
          start: startTime,
          end: endTime,
          duration: endTime - startTime,
          blob: mp3Data,
        },
      ]);
    } catch (error) {
      if ((error as Error).message === "Operation cancelled") {
        console.log("[AudioCutter] Operation cancelled");
      } else {
        console.error("[AudioCutter] Error cutting audio:", error);
        alert("分割音频失败，请重试");
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    if (wavesurfer) {
      try {
        // 先停止播放
        wavesurfer.pause();

        // 重置状态
        setCurrentFile(null);
        setCurrentBuffer(null);
        setCurrentRegion(null);
        setSegments([]);
        setInitialZoom(0);

        // 销毁当前实例
        wavesurfer.destroy();
        setWavesurfer(null);

        // 延迟创建新实例，确保旧实例完全清理
        setTimeout(() => {
          if (!waveformRef.current) return;

          const options: ExtendedWaveSurferOptions = {
            container: waveformRef.current,
            waveColor: "#90EE90",
            progressColor: "#ADD8E6",
            cursorColor: "#2196F3",
            cursorWidth: 2,
            height: 96,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            responsive: true,
            normalize: true,
            fillParent: false,
            minPxPerSec: 20,
            maxCanvasWidth: 8000,
            scrollParent: true,
            hideScrollbar: false,
            interact: true,
            splitChannels: false,
            autoCenter: true,
            autoScroll: true,
          };

          const newInstance = WaveSurfer.create(
            options
          ) as WaveSurferWithPlugins;

          // 创建并添加 regions 插件
          const regionsPlugin = RegionsPlugin.create({
            dragSelection: {
              slop: 5,
            },
            color: "rgba(0, 128, 255, 0.2)",
            handleStyle: {
              left: {
                width: "8px",
                height: "100%",
                position: "absolute",
                top: "0px",
                left: "-4px",
                cursor: "ew-resize",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                zIndex: "4",
                borderRadius: "2px 0 0 2px",
                overflow: "visible",
              },
              right: {
                width: "8px",
                height: "100%",
                position: "absolute",
                top: "0px",
                right: "-4px",
                cursor: "ew-resize",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                zIndex: "4",
                borderRadius: "0 2px 2px 0",
                overflow: "visible",
              },
            },
            handleStyleHover: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          });

          newInstance.registerPlugin(regionsPlugin);
          Object.defineProperty(newInstance, "regions", {
            value: regionsPlugin,
            writable: false,
          });

          // 监听 ready 事件
          newInstance.on("ready", () => {
            const duration = newInstance.getDuration();
            if (waveformRef.current) {
              const containerWidth = waveformRef.current.clientWidth;
              const randomFactor = 0.95 + Math.random() * 0.03;
              const pxPerSec = (containerWidth * randomFactor) / duration;
              setInitialZoom(pxPerSec);
              newInstance.zoom(pxPerSec);
            }

            // 创建初始区域
            const region = regionsPlugin.addRegion({
              start: 0,
              end: duration,
              color: "rgba(76, 175, 80, 0.2)",
              drag: true,
              resize: true,
            });
            setCurrentRegion(region);
          });

          setWavesurfer(newInstance);
        }, 500); // 增加延迟时间，确保清理完成
      } catch (error) {
        console.error("Error resetting wavesurfer:", error);
      }
    }
  };

  return (
    <div className={styles.audioCutter}>
      <LoadingOverlay
        isVisible={isProcessing}
        onCancel={handleCancelProcessing}
      />
      <UploadArea
        onFileUpload={handleFileUpload}
        currentFile={currentFile}
        duration={wavesurfer?.getDuration()}
        onReset={handleReset}
      />
      <Waveform
        ref={waveformRef}
        wavesurfer={wavesurfer}
        currentRegion={currentRegion}
        onRegionUpdate={setCurrentRegion}
        initialZoom={initialZoom}
      />
      <Controls
        wavesurfer={wavesurfer}
        currentRegion={currentRegion}
        onCut={handleCutAudio}
        disabled={!currentFile}
      />
      <SegmentsList
        segments={segments}
        onSegmentPlay={(segment) => {
          if (!wavesurfer || !currentRegion) return;
          currentRegion.setOptions({
            start: segment.start,
            end: segment.end,
          });
          wavesurfer.seekTo(segment.start / wavesurfer.getDuration());
          wavesurfer.play();
        }}
        onSegmentDelete={(segmentId) => {
          setSegments((prev) => prev.filter((s) => s.id !== segmentId));
        }}
      />
      <ShortcutsInfo />
    </div>
  );
};
