// 监听扩展图标点击事件
// 添加防抖机制，避免短时间内多次触发
let lastClickTime = 0;
const DEBOUNCE_TIME = 500; // 防抖时间间隔，单位毫秒

// 添加全局类型声明
declare global {
  interface Window {
    __STOP_GENERATING__: boolean;
    __BATCH_GENERATING__: boolean;
    __debugger: any;
  }
}

chrome.action.onClicked.addListener((tab) => {
  const now = Date.now();
  if (now - lastClickTime < DEBOUNCE_TIME) {
    console.log('点击过于频繁，忽略本次点击');
    return;
  }
  
  lastClickTime = now;
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleToolbox' });
  }
});

// 导出一个空对象以确保这是一个 ES module
export {};

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STOP_BATCH_GENERATE') {
    // 转发终止信号到页面
    chrome.scripting.executeScript({
      target: { tabId: sender.tab?.id || 0 },
      world: "MAIN",
      func: () => {
        window.__STOP_GENERATING__ = true;
      }
    });
    return true;
  }
  if (message.type === "EXECUTE_IN_PAGE") {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ ok: false, error: "无法获取当前标签页" });
      return true;
    }

    // 使用 Promise 包装 executeScript
    const executeScriptPromise = () => new Promise((resolve, reject) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          world: "MAIN",
          func: (descriptions: string[]) => {
            if (!window.__debugger) {
              return { ok: false, error: "页面未就绪: __debugger不存在" };
            }

            if (!window.__debugger.storyEditorPageController) {
              return {
                ok: false,
                error: "页面未就绪: storyEditorPageController不存在",
              };
            }

            const results = [];
            for (const desc of descriptions) {
              try {
                const addSegmentTask =
                  window.__debugger.storyEditorPageController._timelineManager._draftController.segment.addEmptySegment();

                if (!addSegmentTask.ok) {
                  results.push({ ok: false, error: "创建分镜失败" });
                  continue;
                }

                window.__debugger.storyEditorPageController
                  ._getMainEditor(
                    window.__debugger.storyEditorPageController
                      ._editorContainerService
                  )
                  .getDataSdk()
                  .api.segment.setDescription({
                    segmentId: addSegmentTask.value,
                    desc: desc,
                  });

                results.push({ ok: true });
              } catch (error) {
                results.push({ ok: false, error: String(error) });
              }
            }

            return { ok: true, results };
          },
          args: [message.descriptions],
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          const result = results?.[0]?.result;
          if (!result?.ok) {
            reject(new Error(result?.error || "执行脚本失败"));
            return;
          }

          resolve(result);
        }
      );
    });

    // 执行并处理响应
    executeScriptPromise()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ ok: false, error: error.message }));

    return true; // 保持消息通道开放
  }

  if (message.type === 'BATCH_GENERATE') {
    handleBatchGenerate(message.data, sender.tab?.id)
      .then(result => sendResponse({ result }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 保持消息通道打开以进行异步响应
  }
});

// 处理批量生成请求
async function handleBatchGenerate(data: any, tabId?: number) {
  if (!tabId) {
    throw new Error('No tab ID provided');
  }

  // 注入并执行函数
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: async (params: any, prompts: string[]) => {
      // debugger;
      // 设置批量生成标记和终止标记
      window.__BATCH_GENERATING__ = true;
      window.__STOP_GENERATING__ = false;
      try {
        let successCount = 0;
        let failCount = 0;
        let totalProcessed = 0;
        const total = prompts.length;
        const maxConcurrent = 6; // 最大并发数
        let runningTasks = 0; // 当前运行的任务数
        let queue = [...prompts]; // 任务队列

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
            type: 'FROM_PAGE_BATCH_PROGRESS_UPDATE',
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
        await processQueue();

        console.log(`Generation completed. Success: ${successCount}, Failed: ${failCount}`);
        return { successCount, failCount };
      } catch(e) {
        console.error('Batch generate error:', e);
        throw e;  // 重新抛出错误以便正确处理
      } finally {
        // 清除批量生成标记和终止标记
        window.__BATCH_GENERATING__ = false;
        window.__STOP_GENERATING__ = false;
      }
    },
    args: [data.params, data.prompts]
  });

  const result = results[0]?.result;
  if (!result) {
    throw new Error('Script execution failed');
  }

  return result;
}