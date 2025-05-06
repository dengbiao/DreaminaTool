import { MESSAGE_TYPES } from '../../common/constants';

interface CreateShotResult {
  ok: boolean;
  error?: string;
}

interface BatchCreateShotsResponse {
  ok: boolean;
  error?: string;
  results: CreateShotResult[];
}

/**
 * 批量创建分镜
 * @param shotDescriptionsList 分镜描述列表
 */
export const batchCreateShots = async (
  shotDescriptionsList: string[]
): Promise<CreateShotResult[]> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { 
        type: MESSAGE_TYPES.BATCH_CREATE_SHOTS, 
        shotDescriptionsList 
      },
      (response: BatchCreateShotsResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "执行失败"));
          return;
        }
        resolve(response.results);
      }
    );
  });
}; 