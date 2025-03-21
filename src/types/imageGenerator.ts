/**
 * 图片生成相关的类型定义
 */

/**
 * 图片比例类型
 */
export enum ImageRadioType {
  OneOne = 1,
  ThreeFour = 2,
  FourThree = 3,
  NineSixteen = 4,
  SixteenNine = 5,
  TwoThree = 6,
  ThreeTwo = 7,
  TwentyOneNine = 8,
}

/**
 * 图片比例配置
 */
export interface ImageRatioConfig {
  ratio: string;
  width: number;
  height: number;
  type: number;
}

/**
 * 图片生成模型配置
 */
export interface ImageModelConfig {
  value: string;
  name: string;
  description: string;
}

/**
 * 图片生成请求参数
 */
export interface ImageGenerateParams {
  model: string;
  prompt: string;
  image_ratio: ImageRadioType;
  dimensions: string;
  sample_strength: number;
  generateCount: number;
  seed: number;
}

/**
 * 图片生成请求体
 */
export interface ImageGenerateRequestBody {
  extend: {
    root_model: string;
    template_id: string;
  };
  submit_id: string;
  metrics_extra: string;
  draft_content: string;
  http_common_info: {
    aid: number;
  };
}

/**
 * 图片生成响应数据
 */
export interface ImageGenerateResponse {
  ret: string;
  errmsg?: string;
  data?: {
    fail_starling_message?: string;
  };
} 