export const TOOL_IDS = {
  BATCH_GENERATOR: 'batch-generator',
  AUDIO_CUTTER: 'audio-cutter',
} as const;

export const MESSAGES = {
  UPLOAD_AUDIO: '请上传音频文件',
  PROCESSING: '处理中...',
  SUCCESS: '操作成功',
  ERROR: '操作失败',
} as const;

export const FILE_TYPES = {
  AUDIO: ['.mp3', '.wav', '.ogg', '.m4a'],
} as const;

export const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'zh-CN',
  autoSave: true,
} as const;