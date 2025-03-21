import React, { useState, useEffect } from "react";
import styles from "../BatchGenerator.module.scss";
import {
  ModelConfig,
  RatioConfig,
  GenerationMode,
  STORAGE_KEYS,
} from "../types";
import { ModelSelector } from "./ModelSelector";
import { RatioSelector } from "./RatioSelector";
import { StrengthSlider } from "./StrengthSlider";

interface ParamsPanelProps {
  mode: GenerationMode;
  modelConfigs: ModelConfig[];
  ratioConfigs: RatioConfig[];
  onModelChange: (model: ModelConfig) => void;
  onRatioChange: (ratio: RatioConfig) => void;
  onStrengthChange: (strength: number) => void;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
}

export const ParamsPanel: React.FC<ParamsPanelProps> = ({
  mode,
  modelConfigs,
  ratioConfigs,
  onModelChange,
  onRatioChange,
  onStrengthChange,
  isCollapsed,
  onCollapsedChange,
}) => {
  // 获取存储键
  const getStorageKey = (baseKey: keyof typeof STORAGE_KEYS) => {
    return `${STORAGE_KEYS[baseKey]}_${mode}`;
  };

  // 状态管理
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(() => {
    const savedModel = localStorage.getItem(getStorageKey("MODEL"));
    if (savedModel) {
      const model = modelConfigs.find((m) => m.value === savedModel);
      return model || modelConfigs[0];
    }
    return modelConfigs[0];
  });

  const [selectedRatio, setSelectedRatio] = useState<RatioConfig>(() => {
    const savedRatio = localStorage.getItem(getStorageKey("RATIO"));
    if (savedRatio) {
      const ratio = ratioConfigs.find((r) => r.ratio === savedRatio);
      return ratio || ratioConfigs[4];
    }
    return ratioConfigs[4];
  });

  const [strength, setStrength] = useState(() => {
    const savedStrength = localStorage.getItem(getStorageKey("STRENGTH"));
    const parsedStrength = savedStrength ? parseInt(savedStrength, 10) : 5;
    return isNaN(parsedStrength) ? 5 : parsedStrength;
  });

  // 保存参数到本地存储
  useEffect(() => {
    localStorage.setItem(getStorageKey("MODEL"), selectedModel.value);
    onModelChange(selectedModel);
  }, [selectedModel, mode, onModelChange]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("RATIO"), selectedRatio.ratio);
    onRatioChange(selectedRatio);
  }, [selectedRatio, mode, onRatioChange]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("STRENGTH"), strength.toString());
    onStrengthChange(strength);
  }, [strength, mode, onStrengthChange]);

  // 处理精细度变化
  const handleStrengthChange = (value: number) => {
    const validValue = isNaN(value) ? 10 : Math.max(1, Math.min(20, value));
    setStrength(validValue);
  };

  return (
    <div
      className={`${styles.paramsSection} ${
        isCollapsed ? styles.collapsed : ""
      }`}
    >
      <div
        className={styles.paramsHeader}
        onClick={() => onCollapsedChange(!isCollapsed)}
      >
        <div className={styles.paramsTitle}>
          <span>生成参数</span>
          <div className={styles.paramsIcon}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className={styles.paramsSummary}>
          {selectedModel.name.split(" - ")[0]} · 精细度 {strength} ·{" "}
          {selectedRatio.ratio}
        </div>
      </div>

      <div className={styles.paramsContent}>
        <div className={styles.controlGroup}>
          <label>模型选择</label>
          <ModelSelector
            models={modelConfigs}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>精细度</label>
          <StrengthSlider value={strength} onChange={handleStrengthChange} />
        </div>

        <div className={styles.controlGroup}>
          <label>图片比例</label>
          <RatioSelector
            ratios={ratioConfigs}
            selectedRatio={selectedRatio}
            onRatioChange={setSelectedRatio}
          />
        </div>
      </div>
    </div>
  );
};
