import WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js/dist/types";

export interface Region {
  id: string;
  start: number;
  end: number;
  color: string;
  drag: boolean;
  resize: boolean;
  element?: HTMLElement;
  remove(): void;
  update(options: { start?: number; end?: number }): void;
  setOptions(options: { start?: number; end?: number }): void;
}

export interface AudioSegment {
  id: number;
  start: number;
  end: number;
  duration: number;
  blob: Blob;
}

export interface ExtendedWaveSurferOptions extends Omit<WaveSurferOptions, 'splitChannels'> {
  container: HTMLElement;
  waveColor: string;
  progressColor: string;
  cursorColor: string;
  cursorWidth: number;
  height: number;
  barWidth: number;
  barGap: number;
  barRadius: number;
  responsive: boolean;
  normalize: boolean;
  fillParent: boolean;
  minPxPerSec: number;
  maxCanvasWidth: number;
  scrollParent: boolean;
  hideScrollbar: boolean;
  interact: boolean;
  splitChannels: boolean;
  autoCenter: boolean;
  autoScroll: boolean;
}

export interface WaveSurferWithPlugins extends WaveSurfer {
  regions: {
    addRegion: (options: Partial<Region>) => Region;
    on(eventName: string, callback: (...args: any[]) => void): void;
    un(eventName: string, callback: (...args: any[]) => void): void;
  };
  on(eventName: string, callback: (...args: any[]) => void): void;
  un(eventName: string, callback: (...args: any[]) => void): void;
  getWrapper(): HTMLElement;
  getCurrentTime(): number;
  getDuration(): number;
  zoom(pxPerSec: number): void;
  seekTo(progress: number): void;
  playPause(): void;
  pause(): void;
  play(): void;
  destroy(): void;
  loadBlob(blob: Blob): Promise<void>;
  load(url: string | Blob): Promise<void>;
  setHeight(height: number): void;
} 