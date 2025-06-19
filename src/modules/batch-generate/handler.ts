import { MessageHandler } from '../../core/types';
import { 
  BatchGenerateMessage, 
  StopBatchGenerateMessage,
  BatchGenerateParams, 
  BatchGenerateResponse, 
  BatchGenerateResult, 
  GetModelListMessage,
  GetModelListResponse
} from './types';
import { MESSAGE_TYPES } from '../../common/constants';

/**
 * 批量生成处理器
 * 处理批量生成和停止批量生成的消息
 */
export class BatchGenerateHandler implements MessageHandler<BatchGenerateMessage | StopBatchGenerateMessage | GetModelListMessage, BatchGenerateResponse | void | GetModelListResponse> {
  /**
   * 处理批量生成相关消息
   * @param message 消息对象
   * @param sender 发送者信息
   * @returns 处理结果
   */
  async handleMessage(
    message: BatchGenerateMessage | StopBatchGenerateMessage | GetModelListMessage, 
    sender: chrome.runtime.MessageSender
  ): Promise<BatchGenerateResponse | void | GetModelListResponse> {
    const tabId = sender.tab?.id;
    if (!tabId) {
      return { error: "无法获取当前标签页" };
    }

    if (message.type === MESSAGE_TYPES.BATCH_GENERATE) {
      return await this.handleBatchGenerate((message as BatchGenerateMessage).data, tabId);
    } else if (message.type === MESSAGE_TYPES.STOP_BATCH_GENERATE) {
      await this.handleStopBatchGenerate(tabId);
      return;
    } else if (message.type === MESSAGE_TYPES.GET_MODEL_LIST) {
      return await this.handleGetModelList(tabId);
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
          const taskIdMap = new Map<string, boolean>();
          try {
            // 获取 imageManager 实例
            // @ts-ignore
            const services = Array.from(Array.from((window as any).__debugger._containerService._childs)[1]._childs as any) as any;
            const contentGeneratorFeatureService = services.find((item: { _services: { _entries: { keys: () => { (): any; new(): any; toArray: { (): any[]; new(): any; }; }; }; }; }) => item._services._entries.keys().toArray().find(item => item.toString() === 'content-generator-feature-service'))._services.entries.find((_: any, key: { toString: () => string; }) => key.toString() === 'content-generator-feature-service');
            // const contentGeneratorFeatureService = parent && parent._services.entries.find((_, key) => key.toString() === 'content-generator-feature-service');

            if (!contentGeneratorFeatureService) {
              console.error('无法获取 contentGeneratorFeatureService');
              return;
            }

            const imageGeneratorManager = contentGeneratorFeatureService.imageGeneratorManager;
            if (!imageGeneratorManager) {
              console.error('无法获取 imageGeneratorManager');
              // console.error('无法获取 imageGeneratorManager');
              return;
            }

            // 发送进度更新
            const updateProgress = () => {
              console.log('handleBatchGenerate', 'Sending progress update:', {
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

                // const proxyParamsManager = new Proxy(imageGeneratorManager.data, {
                //   get(target, prop) {
                //     if (prop === 'params') {
                //       const selectModel = imageGeneratorManager.data._metadata.generateImageModelList.find((model: any) => model.modelReqKey === params.model.value);
                //       return {
                //         ...target.params,
                //         prompt: prompt,
                //         // imageRatio: params.ratio.type,
                //         modelConfig: selectModel,
                //         sampleStrength: params.strength,
                //         model: selectModel.modelReqKey,
                //         seed: params.seed ?? target.seed,
                //         largeImageInfo: {
                //           width: params.ratio.width,
                //           height: params.ratio.height,
                //           resolutionType: params.clarity === "2k" ? "2k" : "1k",
                //         },
                //       };
                //     }
                //     return target[prop];
                //   }
                // });

                if (window.__STOP_GENERATING__) {
                  // 同上，不执行新任务
                  return;
                }

                const generatorService = await (window as any).__debugger._containerService.services.entries.find((_: any, key: { toString: () => string; }) => key.toString() === 'content-generator-task-feature-loader-service').getInstance();
                const selectModel = imageGeneratorManager.data._metadata.generateImageModelList.find((model: any) => model.modelReqKey === params.model.value);

                const createTaskResult = await generatorService.createAIGCTextToImageTask({
                  ...imageGeneratorManager.data.params,
                  prompt: prompt,
                  // imageRatio: params.ratio.type,
                  model: selectModel.modelReqKey,
                  seed: params.seed ?? undefined,
                  largeImageInfo: {
                    width: params.ratio.width,
                    height: params.ratio.height,
                    resolutionType: params.clarity === "2k" ? "2k" : "1k",
                  },
                  isRegenerate: false,
                });
                if (!createTaskResult.ok) {
                  throw new Error('Generate failed: ' + createTaskResult.errMsg);
                }

                const submitId = createTaskResult.value.idModel.submitId;

                await new Promise((resolve, reject) => {
                  generatorService.onAigcDataTaskGenerated((task: any) => {
                    if (task.idModel.submitId !== submitId) {
                      return;
                    }

                    if (taskIdMap.has(task.idModel.submitId)) {
                      console.log('handleBatchGenerate', 'onAigcDataTaskGenerated task already exists', task, taskIdMap);
                      return;
                    }

                    if (task.statusModel.statusCode === 50 && task.statusModel.recordStatus === 1) {
                      successCount++;
                      taskIdMap.set(task.idModel.submitId, true);
                      console.log('handleBatchGenerate', 'onAigcDataTaskGenerated task success', task);
                      resolve(task);
                    } else if (task.statusModel.recordStatus === 2) {
                      failCount++;
                      taskIdMap.set(task.idModel.submitId, false);
                      console.log('handleBatchGenerate', 'onAigcDataTaskGenerated task fail', task);
                      console.error('Generate failed:', task.statusModel.statusCode);
                      resolve(task);
                    }
                  });
                });
              } catch (error) {
                failCount++;
                console.error('handleBatchGenerate', 'Generate single image error:', error);
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

  /**
   * 处理获取模型列表请求
   * @param tabId 标签页ID
   * @returns 处理结果
   */
  private async handleGetModelList(tabId: number): Promise<GetModelListResponse> {
    try {
      // 在页面中执行获取模型列表的函数
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: function() {
          // TODO: 这里编写获取模型列表的具体逻辑
          // 返回模型列表，例如：
          // return { models: [...] };
          // @ts-ignore
          const services = Array.from(Array.from((window as any).__debugger._containerService._childs)[1]._childs as any) as any;
          const contentGeneratorFeatureService = services.find((item: { _services: { _entries: { keys: () => { (): any; new(): any; toArray: { (): any[]; new(): any; }; }; }; }; }) => item._services._entries.keys().toArray().find(item => item.toString() === 'content-generator-feature-service'))._services.entries.find((_: any, key: { toString: () => string; }) => key.toString() === 'content-generator-feature-service');
          // const contentGeneratorFeatureService = parent && parent._services.entries.find((_, key) => key.toString() === 'content-generator-feature-service');

          if (!contentGeneratorFeatureService) {
            console.error('无法获取 contentGeneratorFeatureService');
            return;
          }

          const imageGeneratorManager = contentGeneratorFeatureService.imageGeneratorManager;
          if (!imageGeneratorManager) {
            console.error('无法获取 imageGeneratorManager');
            // console.error('无法获取 imageGeneratorManager');
            return;
          }
          const modelList = imageGeneratorManager.data._metadata.generateImageModelList;
          return { models: modelList.map((model: any) => ({
            name: model.modelName,
            value: model.modelReqKey,
            description: model.modelTip,
          })) };
        }
      });

      if (!results || results.length === 0) {
        throw new Error('脚本执行失败：没有返回结果');
      }

      // 返回获取到的模型列表
      return results[0].result as GetModelListResponse;
    } catch (error: any) {
      return { error: error.message || "获取模型列表失败" };
    }
  }
} 