import { GenerationParams } from '../types';
import { randomDelay } from './utils';

interface BatchGenerationResult {
  successCount: number;
  failCount: number;
}

/**
 * 创建要在即梦网站上下文中执行的函数
 */
function createInjectedFunction(params: GenerationParams, prompts: string[]) {
  return async function injected() {
    // 设置批量生成标记
    window.__BATCH_GENERATING__ = true;

    try {
      let successCount = 0;
      let failCount = 0;

      // 获取 imageManager 实例
      const parent = (window as any).__debugger._containerService._childs.values()
        .toArray()
        .find((item: any) =>
          item.services._entries.values()
            .toArray()
            .find((child: any) => child.__origin__ && child.__origin__.imageManager)
        );

      const imageManager = parent && parent.services._entries.values()
        .toArray()
        .find((child: any) => child.__origin__ && child.__origin__.imageManager)
        .__origin__.imageManager;

      if (!imageManager) {
        throw new Error('无法获取 imageManager');
      }

      // 保存原始值
      const originalCanCustomSize = imageManager.canCustomSize;
      const originalSelectModelKey = imageManager.selectModelKey;
      const originalImageRatio = imageManager.imageRatio;

      // 设置新值
      Object.defineProperties(imageManager, {
        canCustomSize: {
          get: () => true
        },
        selectModelKey: {
          get: () => params.model.value
        },
        imageRatio: {
          get: () => params.ratio
        }
      });

      // 执行批量生成
      for (const prompt of prompts) {
        try {
          await imageManager.generateImage(prompt);
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        } catch (error) {
          failCount++;
          console.error('Generate single image error:', error);
        }
      }

      // 恢复原始值
      Object.defineProperties(imageManager, {
        canCustomSize: {
          value: originalCanCustomSize,
          writable: true
        },
        selectModelKey: {
          value: originalSelectModelKey,
          writable: true
        },
        imageRatio: {
          value: originalImageRatio,
          writable: true
        }
      });

      console.log(`Generation completed. Success: ${successCount}, Failed: ${failCount}`);
      return { successCount, failCount };
    } finally {
      // 清除批量生成标记
      window.__BATCH_GENERATING__ = false;
    }
  };
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