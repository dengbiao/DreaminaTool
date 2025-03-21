declare module '@lame/Mp3Encoder' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
    flush(): Int8Array;
  }
}

declare module '@lame/MPEGMode' {
  export class MPEGMode {
    static STEREO: MPEGMode;
    static JOINT_STEREO: MPEGMode;
    static DUAL_CHANNEL: MPEGMode;
    static MONO: MPEGMode;
    static NOT_SET: MPEGMode;
    
    constructor(ordinal: number);
    ordinal(): number;
  }
} 