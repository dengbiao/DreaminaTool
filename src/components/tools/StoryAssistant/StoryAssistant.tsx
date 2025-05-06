import React, { useState, useEffect } from "react";
import styles from "./StoryAssistant.module.scss";
import { TextInput } from "../../common/TextInput";

interface CreateShotResult {
  ok: boolean;
  error?: string;
}

// 在页面上下文中执行代码
const executeInPageContext = async (
  shotDescriptionsList: string[]
): Promise<CreateShotResult[]> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "BATCH_CREATE_SHOTS", shotDescriptionsList },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "执行失败"));
          return;
        }
        resolve(response.results);
      }
    );
  });
};

export const StoryAssistant: React.FC = () => {
  const [shots, setShots] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState("");

  // 检查URL中是否有toolId参数，如果有则移除
  useEffect(() => {
    const url = new URL(window.location.href);
    const toolId = url.searchParams.get("toolId");

    if (toolId === "story-assistant") {
      // 移除toolId参数
      url.searchParams.delete("toolId");

      // 使用history API更新URL，不刷新页面
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  // 批量创建分镜
  const handleCreateShots = async () => {
    if (!shots.trim()) {
      setStatus("请输入至少一个分镜词");
      return;
    }

    setIsCreating(true);
    setStatus("");

    try {
      const shotList = shots.split("\n").filter((shot) => shot.trim());
      const results = await executeInPageContext(shotList);

      // 处理结果
      const successCount = results.filter((r) => r.ok).length;
      const failureCount = results.filter((r) => !r.ok).length;

      if (failureCount > 0) {
        setStatus(`创建完成：成功 ${successCount} 个，失败 ${failureCount} 个`);
      } else {
        setStatus(`成功创建 ${successCount} 个分镜`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建分镜失败");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>故事创作助手</h2>
        <p className={styles.description}>批量创建分镜描述</p>
      </div>

      <div className={styles.content}>
        <TextInput
          value={shots}
          onChange={setShots}
          title="分镜词列表"
          defaultHeight="275px"
          placeholder="每行输入一个分镜词描述，按回车键添加新行"
          storageKey="story_shots_height"
          autoAddEmptyLine={true}
        />

        <button
          className={styles.createButton}
          onClick={handleCreateShots}
          disabled={isCreating}
        >
          {isCreating ? "创建中..." : "批量创建分镜"}
        </button>

        {status && (
          <div
            className={`${styles.status} ${
              status.includes("成功") ? styles.success : styles.error
            }`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};
