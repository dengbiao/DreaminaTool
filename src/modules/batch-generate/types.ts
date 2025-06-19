import { BaseMessage } from '../../core/types';
import { ProgressUpdate } from '../../common/types';
import { MESSAGE_TYPES } from '../../common/constants';

/**
 * 批量生成参数
 */
export interface BatchGenerateParams {
  params: {
    model: { value: string };
    ratio: { 
      type: string; 
      width: number; 
      height: number 
    };
    strength: number;
    seed?: number;
    clarity?: string;
  };
  prompts: string[];
}

/**
 * 批量生成消息
 */
export interface BatchGenerateMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.BATCH_GENERATE;
  data: BatchGenerateParams;
}

/**
 * 停止批量生成消息
 */
export interface StopBatchGenerateMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.STOP_BATCH_GENERATE;
}

/**
 * 批量生成结果
 */
export interface BatchGenerateResult {
  successCount: number;
  failCount: number;
}

/**
 * 批量生成响应
 */
export interface BatchGenerateResponse {
  result?: BatchGenerateResult;
  error?: string;
}

/**
 * 批量生成进度更新消息
 */
export interface BatchProgressUpdateMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.BATCH_PROGRESS_UPDATE;
  progress: ProgressUpdate;
}

/**
 * 获取模型列表消息
 */
export interface GetModelListMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.GET_MODEL_LIST;
}

/**
 * 获取模型列表响应
 * 你可以根据实际模型结构调整 models 字段类型
 */
export interface GetModelListResponse {
  models?: any[]; // 这里留空，后续你可以补充具体类型
  error?: string;
} 