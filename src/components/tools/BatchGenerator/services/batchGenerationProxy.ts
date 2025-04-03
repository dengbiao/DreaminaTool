import { GenerationParams } from '../types';

interface BatchGenerationResult {
  successCount: number;
  failCount: number;
}

/**
 * 批量生成服务
 */
export class BatchGenerationService {
  static async startBatchGeneration(prompts: string[], params: GenerationParams): Promise<BatchGenerationResult> {
    // 发送消息给 background script
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'BATCH_GENERATE',
          data: {
            prompts,
            params
          }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          resolve(response.result);
        }
      );
    });
  }
}

// 声明全局变量类型
declare global {
  interface Window {
    __BATCH_GENERATING__: boolean;
  }
}

export default BatchGenerationService; 