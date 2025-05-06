import { MessageHandler } from '../../core/types';
import { 
  BatchGenerateMessage, 
  StopBatchGenerateMessage,
  BatchGenerateParams, 
  BatchGenerateResponse, 
  BatchGenerateResult 
} from './types';
import { MESSAGE_TYPES } from '../../common/constants';

/**
 * 批量生成处理器
 * 处理批量生成和停止批量生成的消息
 */
export class BatchGenerateHandler implements MessageHandler<BatchGenerateMessage | StopBatchGenerateMessage, BatchGenerateResponse | void> {
  /**
   * 处理批量生成相关消息
   * @param message 消息对象
   * @param sender 发送者信息
   * @returns 处理结果
   */
  async handleMessage(
    message: BatchGenerateMessage | StopBatchGenerateMessage, 
    sender: chrome.runtime.MessageSender
  ): Promise<BatchGenerateResponse | void> {
    const tabId = sender.tab?.id;
    if (!tabId) {
      return { error: "无法获取当前标签页" };
    }

    if (message.type === MESSAGE_TYPES.BATCH_GENERATE) {
      return await this.handleBatchGenerate(message.data, tabId);
    } else if (message.type === MESSAGE_TYPES.STOP_BATCH_GENERATE) {
      await this.handleStopBatchGenerate(tabId);
      return;
    }
    
    throw new Error('未知的消息类型');
  }

  /**
   * 处理批量生成请求
   * @param data 批量生成参数
   * @param tabId 标签页ID
   * @returns 处理结果
   */
  private async handleBatchGenerate(data: BatchGenerateParams, tabId: number): Promise<BatchGenerateResponse> {
    try {
      // 在页面中执行批量生成函数
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: function(params: any, prompts: string[], messageTypes: typeof MESSAGE_TYPES) {
          // 设置批量生成标记和终止标记
          window.__BATCH_GENERATING__ = true;
          window.__STOP_GENERATING__ = false;
          
          let successCount = 0;
          let failCount = 0;
          let totalProcessed = 0;
          const total = prompts.length;
          const maxConcurrent = 6; // 最大并发数
          let runningTasks = 0; // 当前运行的任务数
          let queue = [...prompts]; // 任务队列

          try {
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

            const paramsManager = imageManager._generateImageParamsManager;
            if (!paramsManager) {
              throw new Error('无法获取 _generateImageParamsManager');
            }

            // 发送进度更新
            const updateProgress = () => {
              console.log('Sending progress update:', {
                successCount,
                failCount,
                totalProcessed,
                total,
                queueLength: queue.length,
                runningTasks
              });
              window.postMessage({
                type: messageTypes.BATCH_PROGRESS_UPDATE,
                progress: {
                  successCount,
                  failCount,
                  totalProcessed,
                  total,
                  queueLength: queue.length,
                  runningTasks
                }
              }, '*');
            };

            // 随机延迟函数
            const randomDelay = () => new Promise(resolve => 
              setTimeout(resolve, 500 + Math.random() * 500)
            );

            // 处理单个任务
            const processTask = async (prompt: string) => {
              if (window.__STOP_GENERATING__) {
                // 不再清空队列和减少运行任务数
                // 只返回不执行新任务
                return;
              }

              try {
                await randomDelay(); // 添加随机延迟

                if (window.__STOP_GENERATING__) {
                  // 同上，不执行新任务
                  return;
                }

                const proxyParamsManager = new Proxy(paramsManager, {
                  get(target, prop) {
                    if (prop === 'canCustomSize') return true;
                    if (prop === 'selectModelKey') return params.model.value;
                    if (prop === 'imageRatio') return params.ratio.type;
                    if (prop === 'prompt') return prompt;
                    if (prop === 'seed' && params.seed !== undefined) return params.seed;
                    if (prop === 'selectModel') {
                      return paramsManager.modelList.find((model: any) => model.modelReqKey === params.model.value);
                    }
                    if (prop === 'textToImageGenerateParam') {
                      const selectModel = paramsManager.modelList.find((model: any) => model.modelReqKey === params.model.value);
                      return {
                        ...target.textToImageGenerateParam,
                        prompt: prompt,
                        imageRatio: params.ratio.type,
                        modelConfig: selectModel,
                        sampleStrength: params.strength,
                        model: selectModel.modelReqKey,
                        seed: params.seed ?? target.seed,
                        largeImageInfo: {
                          width: params.ratio.width,
                          height: params.ratio.height,
                          resolutionType: params.clarity === "2k" ? "2k" : "1k",
                        },
                      };
                    }
                    return target[prop];
                  }
                });

                if (window.__STOP_GENERATING__) {
                  // 同上，不执行新任务
                  return;
                }

                // 替换原始对象
                imageManager._generateImageParamsManager = proxyParamsManager;
                const generatePromise = imageManager.generateContent(undefined, {isQueue: true});
                // 恢复原始对象
                imageManager._generateImageParamsManager = paramsManager;
                
                const result = await generatePromise;
                
                if (result.code === 0) {
                  successCount++;
                } else {
                  failCount++;
                  console.error('Generate failed:', result.errMsg);
                }
              } catch (error) {
                failCount++;
                console.error('Generate single image error:', error);
              }

              totalProcessed++;
              runningTasks--;
              updateProgress();
            };

            // 启动任务处理循环
            const processQueue = async () => {
              while ((queue.length > 0 || runningTasks > 0) && !window.__STOP_GENERATING__) {
                // 如果有空闲槽位且队列中还有任务，则启动新任务
                while (runningTasks < maxConcurrent && queue.length > 0 && !window.__STOP_GENERATING__) {
                  const prompt = queue.shift()!;
                  runningTasks++;
                  updateProgress();
                  processTask(prompt); // 注意：不使用 await，让任务并行执行
                }
                
                // 等待一小段时间再检查
                await new Promise(resolve => setTimeout(resolve, 100));
              }

              // 如果是因为终止而退出循环，将剩余任务标记为失败
              if (window.__STOP_GENERATING__ && queue.length > 0) {
                failCount += queue.length;
                totalProcessed += queue.length;
                queue = [];
                updateProgress();
              }
            };

            // 开始处理队列
            processQueue();

            // 注意：这里我们不能直接返回结果，因为processQueue是异步的
            // 我们需要在页面中保存结果，然后通过另一个消息获取
            // 所以这里只返回一个初始状态
            return { 
              successCount: 0, 
              failCount: 0 
            };
          } catch(e) {
            console.error('Batch generate error:', e);
            return { 
              successCount: 0, 
              failCount: 0 
            };
          }
        },
        args: [data.params, data.prompts, MESSAGE_TYPES]
      });

      if (!results || results.length === 0) {
        throw new Error('脚本执行失败：没有返回结果');
      }

      // 这里我们返回一个初始结果，实际结果会通过进度更新消息传递
      // 页面会通过postMessage发送进度更新
      return { 
        result: { 
          successCount: 0, 
          failCount: 0 
        } 
      };
    } catch (error: any) {
      return { error: error.message || "批量生成失败" };
    }
  }

  /**
   * 处理停止批量生成请求
   * @param tabId 标签页ID
   */
  private async handleStopBatchGenerate(tabId: number): Promise<void> {
    try {
      // 在页面中设置停止生成标志
      await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: () => {
          window.__STOP_GENERATING__ = true;
        }
      });
    } catch (error) {
      console.error('停止批量生成失败:', error);
      throw error;
    }
  }
} 