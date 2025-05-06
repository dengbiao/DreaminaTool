import { MessageHandler } from '../../core/types';
import { BatchCreateShotsMessage, BatchCreateShotsResponse } from './types';
import { MESSAGE_TYPES } from '../../common/constants';

/**
 * 批量创建分镜处理器
 */
export class BatchShotsHandler implements MessageHandler<BatchCreateShotsMessage, BatchCreateShotsResponse> {
  /**
   * 处理批量创建分镜消息
   * @param message 消息对象
   * @param sender 发送者信息
   * @returns 处理结果
   */
  async handleMessage(message: BatchCreateShotsMessage, sender: chrome.runtime.MessageSender): Promise<BatchCreateShotsResponse> {
    if (message.type === MESSAGE_TYPES.BATCH_CREATE_SHOTS) {
      const tabId = sender.tab?.id;
      if (!tabId) {
        return { ok: false, error: "无法获取当前标签页" };
      }
      
      return await this.handleBatchCreateShots(message.shotDescriptionsList, tabId);
    }
    
    throw new Error('未知的消息类型');
  }

  /**
   * 处理批量创建分镜
   * @param shotDescriptions 分镜描述列表
   * @param tabId 标签页ID
   * @returns 处理结果
   */
  private async handleBatchCreateShots(shotDescriptions: string[], tabId: number): Promise<BatchCreateShotsResponse> {
    try {
      // 在页面中执行创建分镜的函数
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: function(shotDescriptions: string[]) {
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
          for (const desc of shotDescriptions) {
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
        args: [shotDescriptions]
      });

      const result = results[0].result;

      if (!result?.ok) {
        throw new Error(result?.error || "执行脚本失败");
      }

      return result;
    } catch (error: any) {
      return { ok: false, error: error.message || "批量创建分镜失败" };
    }
  }
} 