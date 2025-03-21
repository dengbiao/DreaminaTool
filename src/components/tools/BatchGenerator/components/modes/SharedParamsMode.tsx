import React, { useState, forwardRef, useImperativeHandle } from "react";
import { TextInput } from "../../../../common/TextInput";
import { STORAGE_KEYS } from "../../types";
import styles from "../../BatchGenerator.module.scss";

interface SharedParamsModeProps {
  onGenerate: (prompts: string[]) => void;
  isGenerating: boolean;
}

export interface SharedParamsModeHandle {
  handleGenerate: () => void;
}

export const SharedParamsMode = forwardRef<
  SharedParamsModeHandle,
  SharedParamsModeProps
>(({ onGenerate, isGenerating }, ref) => {
  // 内部状态管理
  const [basePrompts, setBasePrompts] = useState<string>("");
  const [sharedParams, setSharedParams] = useState<string>("");

  // 处理输入变化
  const handleBasePromptsChange = (value: string) => {
    setBasePrompts(value);
  };

  const handleSharedParamsChange = (value: string) => {
    setSharedParams(value);
  };

  // 处理生成按钮点击
  const handleGenerate = () => {
    const basePromptList = basePrompts.split("\n").filter((p) => p.trim());
    const sharedParamsList = sharedParams.split("\n").filter((p) => p.trim());

    if (basePromptList.length === 0 || sharedParamsList.length === 0) {
      return;
    }

    // 组合基础提示词和通用参数
    const promptList = basePromptList.flatMap((basePrompt) =>
      sharedParamsList.map((param) => `${param}, ${basePrompt}`)
    );

    onGenerate(promptList);
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleGenerate,
  }));

  return (
    <div className={styles.promptsContainer}>
      <TextInput
        value={sharedParams}
        onChange={handleSharedParamsChange}
        title="通用参数"
        defaultHeight="80px"
        placeholder="输入要附加到每个提示词后的通用参数,例如:
8k,高清,写实风格"
        storageKey={`${STORAGE_KEYS.PROMPT_HEIGHT}_shared_params`}
        showCount={false}
      />

      <TextInput
        value={basePrompts}
        onChange={handleBasePromptsChange}
        title="提示词列表"
        defaultHeight="160px"
        placeholder="输入提示词，一行一个，每行将与通用参数进行组合
例如：
猫咪
狗狗
兔子"
        storageKey={`${STORAGE_KEYS.PROMPT_HEIGHT}_shared_base`}
        autoAddEmptyLine={true}
      />
    </div>
  );
});
