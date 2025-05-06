/**
 * 全局类型声明，用于扩展Window接口
 */
declare global {
  interface Window {
    /** 停止生成标志 */
    __STOP_GENERATING__: boolean;
    /** 批量生成标志 */
    __BATCH_GENERATING__: boolean;
    /** 调试对象 */
    __debugger: any;
  }
}

/**
 * 通用响应结构
 */
export interface Response<T = any> {
  /** 操作是否成功 */
  ok: boolean;
  /** 错误信息，当ok为false时存在 */
  error?: string;
  /** 返回数据，当ok为true时存在 */
  data?: T;
}

/**
 * 进度更新接口
 */
export interface ProgressUpdate {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failCount: number;
  /** 已处理总数 */
  totalProcessed: number;
  /** 总任务数 */
  total: number;
  /** 队列中剩余任务数 */
  queueLength: number;
  /** 当前运行的任务数 */
  runningTasks: number;
}

// 导出一个空对象以确保这是一个 ES module
export {}; 