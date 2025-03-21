// @ts-ignore
import * as lamejs from 'lamejs/lame.all.js';

declare global {
  interface Window {
    lamejs: {
      Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => {
        encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
        flush(): Int8Array;
      };
    }
  }
}

// 添加 MPEGMode 常量
const MPEGMode = {
  STEREO: { ordinal: () => 0 },
  JOINT_STEREO: { ordinal: () => 1 },
  DUAL_CHANNEL: { ordinal: () => 2 },
  MONO: { ordinal: () => 3 },
  NOT_SET: { ordinal: () => 4 }
};

export class AudioEncoder {
  static async convertToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
    // 验证输入参数
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Invalid audio buffer');
    }

    // 获取音频参数
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = Math.min(audioBuffer.sampleRate, 44100); // MP3 标准限制
    const kbps = 128;

    // 记录开始状态
    console.log('[AudioEncoder] Starting conversion:', {
      channels,
      sampleRate,
      kbps,
      duration: audioBuffer.duration,
      samples: audioBuffer.length
    });

    try {
      // 等待 lamejs 加载完成
      if (!window.lamejs?.Mp3Encoder) {
        throw new Error('Mp3Encoder is not available. Please ensure lame.all.js is loaded.');
      }

      // 创建编码器
      const encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, kbps);
      const mp3Data: Int8Array[] = [];

      // 获取音频数据
      const left = audioBuffer.getChannelData(0);
      const right = channels === 2 ? audioBuffer.getChannelData(1) : null;

      // 分块处理
      const blockSize = 1152; // MP3 标准帧大小
      const numBlocks = Math.ceil(audioBuffer.length / blockSize);

      // 处理每个数据块
      for (let i = 0; i < numBlocks; i++) {
        const offset = i * blockSize;
        const count = Math.min(blockSize, audioBuffer.length - offset);

        // 创建采样数据数组
        const leftData = new Int16Array(count);
        const rightData = channels === 2 ? new Int16Array(count) : undefined;

        // 转换采样数据
        for (let j = 0; j < count; j++) {
          // 将 [-1,1] 的 Float32 转换为 [-32768,32767] 的 Int16
          const leftSample = left[offset + j];
          leftData[j] = Math.max(-32768, Math.min(32767, Math.round(leftSample * 32767)));
          
          if (channels === 2 && right && rightData) {
            const rightSample = right[offset + j];
            rightData[j] = Math.max(-32768, Math.min(32767, Math.round(rightSample * 32767)));
          }
        }

        // 编码当前块
        const encoded = encoder.encodeBuffer(leftData, rightData);
        if (encoded && encoded.length > 0) {
          mp3Data.push(encoded);
        }

        // 输出进度
        if ((i + 1) % 50 === 0 || i === numBlocks - 1) {
          const progress = ((i + 1) / numBlocks * 100).toFixed(1);
          console.log(`[AudioEncoder] Progress: ${progress}%`);
        }
      }

      // 完成编码
      const final = encoder.flush();
      if (final && final.length > 0) {
        mp3Data.push(final);
      }

      // 检查结果
      if (mp3Data.length === 0) {
        throw new Error('No data generated during encoding');
      }

      // 创建 MP3 文件
      const blob = new Blob(mp3Data, { type: 'audio/mp3' });
      console.log('[AudioEncoder] Conversion complete:', {
        size: blob.size,
        type: blob.type
      });

      return blob;
    } catch (error) {
      console.error('[AudioEncoder] Encoding error:', error);
      throw error;
    }
  }
} 