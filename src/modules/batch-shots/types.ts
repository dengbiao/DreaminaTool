import { BaseMessage, BaseResponse } from '../../core/types';
import { MESSAGE_TYPES } from '../../common/constants';

/**
 * 批量创建分镜请求消息
 */
export interface BatchCreateShotsMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.BATCH_CREATE_SHOTS;
  shotDescriptionsList: string[];
}

/**
 * 单个分镜创建结果
 */
export interface ShotCreationResult {
  ok: boolean;
  error?: string;
}

/**
 * 批量创建分镜响应
 */
export interface BatchCreateShotsResponse extends BaseResponse {
  ok: boolean;
  results?: ShotCreationResult[];
  error?: string;
} 