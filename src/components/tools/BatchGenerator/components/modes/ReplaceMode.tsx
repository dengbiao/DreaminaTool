import React, { useState, forwardRef, useImperativeHandle } from "react";
import { TextInput } from "../../../../common/TextInput";
import { STORAGE_KEYS } from "../../types";
import styles from "../../BatchGenerator.module.scss";

interface ReplaceModeProps {
  onGenerate: (prompts: string[]) => void;
  isGenerating: boolean;
}

export interface ReplaceModeHandle {
  handleGenerate: () => void;
}

export const ReplaceMode = forwardRef<ReplaceModeHandle, ReplaceModeProps>(
  ({ onGenerate, isGenerating }, ref) => {
    // 内部状态管理
    const [template, setTemplate] = useState<string>("");
    const [variables, setVariables] = useState<string>("");

    // 处理输入变化
    const handleTemplateChange = (value: string) => {
      setTemplate(value);
    };

    const handleVariablesChange = (value: string) => {
      setVariables(value);
    };

    // 处理生成按钮点击
    const handleGenerate = () => {
      if (!template.trim()) {
        return;
      }

      // 解析变量列表，支持中英文逗号分隔
      const variablesList = variables
        .split("\n")
        .filter((line) => line.trim())
        .map((line) =>
          line
            .split(/[,，]/)
            .map((v) => v.trim())
            .filter(Boolean)
        );

      if (variablesList.length === 0) {
        return;
      }

      // 检查变量数量是否匹配
      const variableCount = template.match(/\{(\d+)\}/g)?.length || 0;
      const hasInvalidVariables = variablesList.some(
        (vars) => vars.length !== variableCount
      );
      if (hasInvalidVariables) {
        return;
      }

      // 生成提示词列表
      const promptList = variablesList.map((vars) => {
        let result = template;
        vars.forEach((value, index) => {
          const regex = new RegExp(`\\{${index}\\}`, "g");
          if (!regex.test(result)) {
            console.warn(`模板中未找到变量 {${index}}`);
          }
          result = result.replace(regex, value);
        });
        // 检查是否还有未替换的变量
        if (result.match(/\{\d+\}/)) {
          console.warn("存在未替换的变量:", result);
        }
        return result;
      });

      onGenerate(promptList);
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      handleGenerate,
    }));

    return (
      <div className={styles.promptsContainer}>
        <TextInput
          value={template}
          onChange={handleTemplateChange}
          title="模板提示词"
          defaultHeight="80px"
          placeholder={
            "输入带变量的模板提示词，使用 {0}, {1} 等表示变量位置，例如：\n一只{0}在{1}上玩耍"
          }
          storageKey={`${STORAGE_KEYS.PROMPT_HEIGHT}_replace_template`}
          showCount={false}
        />

        <TextInput
          value={variables}
          onChange={handleVariablesChange}
          title="替换变量"
          defaultHeight="160px"
          placeholder={
            "输入替换变量的值，每行对应一组替换，用中文或英文逗号分隔\n例如：\n猫咪，窗台\n狗狗,草地\n兔子，花园"
          }
          storageKey={`${STORAGE_KEYS.PROMPT_HEIGHT}_replace_vars`}
        />
      </div>
    );
  }
);
