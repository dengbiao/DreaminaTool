import { GenerationParams } from '../../components/tools/BatchGenerator/types';
import { MESSAGE_TYPES } from '../../common/constants';

interface BatchGenerationResult {
  successCount: number;
  failCount: number;
}

/**
 * 开始批量生成图片
 * @param prompts 提示词列表
 * @param params 生成参数
 */
export const startBatchGeneration = async (
  prompts: string[],
  params: GenerationParams
): Promise<BatchGenerationResult> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPES.BATCH_GENERATE,
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
};

/**
 * 停止批量生成
 */
export const stopBatchGeneration = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPES.STOP_BATCH_GENERATE
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      }
    );
  });
}; 