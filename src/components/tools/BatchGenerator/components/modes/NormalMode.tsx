import React, { useState, forwardRef, useImperativeHandle } from "react";
import { TextInput } from "../../../../common/TextInput";
import { STORAGE_KEYS } from "../../types";
import styles from "../../BatchGenerator.module.scss";

interface NormalModeProps {
  onGenerate: (prompts: string[]) => void;
  isGenerating: boolean;
}

export interface NormalModeHandle {
  handleGenerate: () => void;
}

export const NormalMode = forwardRef<NormalModeHandle, NormalModeProps>(
  ({ onGenerate, isGenerating }, ref) => {
    // 内部状态管理
    const [prompts, setPrompts] = useState<string>("");

    // 处理输入变化
    const handlePromptsChange = (value: string) => {
      setPrompts(value);
    };

    // 处理生成按钮点击
    const handleGenerate = () => {
      const promptList = prompts.split("\n").filter((p) => p.trim());
      if (promptList.length === 0) {
        return;
      }
      onGenerate(promptList);
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      handleGenerate,
    }));

    return (
      <div className={styles.promptsContainer}>
        <TextInput
          value={prompts}
          onChange={handlePromptsChange}
          title="提示词列表"
          defaultHeight="230px"
          placeholder="例如：
一只可爱的猫咪，坐在窗台上看着窗外的风景
日落时分的海滩，金色的阳光洒在海面上"
          storageKey={`${STORAGE_KEYS.PROMPT_HEIGHT}_normal`}
          autoAddEmptyLine={true}
        />
      </div>
    );
  }
);
