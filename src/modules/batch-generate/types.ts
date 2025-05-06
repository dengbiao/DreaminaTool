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