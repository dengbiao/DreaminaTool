export interface Tool {
  name: string;
  container: HTMLElement | null;
  createUI(container: HTMLElement): void;
}

export interface Region {
  id: string;
  start: number;
  end: number;
  color: string;
  drag: boolean;
  resize: boolean;
  element?: HTMLElement;
  remove(): void;
}

export interface AudioSegment {
  id: number;
  start: number;
  end: number;
  duration: number;
  blob: Blob;
}

export interface WaveSurferOptions {
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