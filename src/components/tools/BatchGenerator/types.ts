// 生成模式枚举
export enum GenerationMode {
  NORMAL = "normal",
  SHARED_PARAMS = "shared_params",
  REPLACE = "replace",
}

// 图片比例类型枚举
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

// 模型配置接口
export interface ModelConfig {
  value: string;
  name: string;
  description: string;
}

// 比例配置接口
export interface RatioConfig {
  ratio: string;
  width: number;
  height: number;
  type: number;
}

// 生成参数接口
export interface GenerationParams {
  model: ModelConfig;
  ratio: RatioConfig;
  strength: number;
}

// 状态信息接口
export interface StatusInfo {
  status: string;
  progress: string;
  showRefreshLink: boolean;
}

// 进度信息接口
export interface ProgressInfo {
  totalProcessed: number;
  total: number;
  queueLength: number;
  runningTasks: number;
  successCount: number;
  failCount: number;
  isStopped?: boolean;
}

// 本地存储键名常量
export const STORAGE_KEYS = {
  MODEL: "jimeng_model",
  RATIO: "jimeng_ratio",
  STRENGTH: "jimeng_strength",
  PARAMS_COLLAPSED: "jimeng_params_collapsed",
  PROMPT_HEIGHT: "jimeng_prompt_height",
  PROMPT_HEIGHT_MODE: "jimeng_prompt_height_mode",
  GENERATION_MODE: "generation_mode",
  TOOL_VISIBLE: "tool_visible",
  TOOL_POSITION: "tool_position",
  TOOL_HEIGHT: "tool_height",
  TOOL_WIDTH: "tool_width",
  NORMAL_INPUT: "normal_input",
  SHARED_PARAMS_INPUT: "shared_params_input",
  SHARED_BASE_INPUT: "shared_base_input",
  REPLACE_TEMPLATE: "replace_template",
  REPLACE_VARS: "replace_vars",
  CHAT_MODE: "chat_mode",
  CHAT_SESSIONS: "chat_sessions",
  CURRENT_SESSION: "current_session",
} as const;