declare module 'wavesurfer.js' {
  export interface WaveSurferOptions {
    container: HTMLElement;
    waveColor?: string;
    progressColor?: string;
    cursorColor?: string;
    cursorWidth?: number;
    height?: number;
    barWidth?: number;
    barGap?: number;
    barRadius?: number;
    responsive?: boolean;
    normalize?: boolean;
    fillParent?: boolean;
    minPxPerSec?: number;
    maxCanvasWidth?: number;
    scrollParent?: boolean;
    hideScrollbar?: boolean;
    interact?: boolean;
    splitChannels?: boolean;
  }

  export default class WaveSurfer {
    static create(options: WaveSurferOptions): WaveSurfer;
    on(event: string, callback: (...args: any[]) => void): void;
    registerPlugin(plugin: any): any;
    loadBlob(blob: Blob): Promise<void>;
    empty(): void;
    zoom(level: number): void;
    seekTo(position: number): void;
    play(): void;
    pause(): void;
    playPause(): void;
    getCurrentTime(): number;
    getDuration(): number;
    options: {
      minPxPerSec: number;
      [key: string]: any;
    };
  }
}

declare module 'wavesurfer.js/dist/plugins/regions' {
  export interface RegionsPluginOptions {
    dragSelection?: {
      slop?: number;
      snapToGrid?: number;
    };
    color?: string;
    handleStyle?: {
      left?: Partial<CSSStyleDeclaration>;
      right?: Partial<CSSStyleDeclaration>;
    };
    handleStyleHover?: Partial<CSSStyleDeclaration>;
  }

  export default class RegionsPlugin {
    static create(options: RegionsPluginOptions): RegionsPlugin;
    on(event: string, callback: (...args: any[]) => void): void;
    addRegion(options: any): any;
    getRegions(): { [key: string]: any };
  }
} 