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
  onSeedChange?: (seed: number | undefined) => void;
  onClarityChange?: (clarity: string) => void;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  clarity: string;
}

export const ParamsPanel: React.FC<ParamsPanelProps> = ({
  mode,
  modelConfigs,
  ratioConfigs,
  onModelChange,
  onRatioChange,
  onStrengthChange,
  onSeedChange,
  onClarityChange,
  isCollapsed,
  onCollapsedChange,
  clarity,
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

  const [strength, setStrength] = useState(5);

  const [seed, setSeed] = useState<number | undefined>(() => {
    const savedSeed = localStorage.getItem(getStorageKey("SEED"));
    if (savedSeed) {
      const parsedSeed = parseInt(savedSeed, 10);
      return isNaN(parsedSeed) ? undefined : parsedSeed;
    }
    return undefined;
  });

  // 是否显示清晰度选择器（仅当选择"图片 3.0"时显示）
  const showClaritySelector = selectedModel.name.includes("图片 3.0");

  // 保存参数到本地存储
  useEffect(() => {
    localStorage.setItem(getStorageKey("MODEL"), selectedModel.value);
    onModelChange(selectedModel);
  }, [selectedModel, mode, onModelChange]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("RATIO"), selectedRatio.ratio);
    onRatioChange(selectedRatio);
  }, [selectedRatio, mode, onRatioChange]);

  // 保存seed到本地存储并通知父组件
  useEffect(() => {
    if (seed !== undefined) {
      localStorage.setItem(getStorageKey("SEED"), seed.toString());
    } else {
      localStorage.removeItem(getStorageKey("SEED"));
    }

    if (onSeedChange) {
      onSeedChange(seed);
    }
  }, [seed, mode, onSeedChange]);

  // 处理seed值变化
  const handleSeedChange = (value: string) => {
    if (value === "") {
      setSeed(undefined);
      return;
    }

    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue < 2147483647) {
      setSeed(parsedValue);
    } else {
      setSeed(undefined);
    }
  };

  // 处理清晰度变化
  const handleClarityChange = (value: string) => {
    if (onClarityChange) {
      onClarityChange(value);
    }
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
          {selectedModel.name.split(" - ")[0]} · {selectedRatio.ratio}
          {showClaritySelector
            ? ` · ${clarity === "2k" ? "高清" : "标清"}`
            : ""}
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
          <label>图片比例</label>
          <RatioSelector
            ratios={ratioConfigs}
            selectedRatio={selectedRatio}
            onRatioChange={setSelectedRatio}
          />
        </div>

        {showClaritySelector && (
          <div
            className={`${styles.controlGroup} ${styles.clarityControlGroup}`}
          >
            <label className={styles.clarityLabel}>清晰度</label>
            <div
              className={`${styles.radioGroup} ${styles.radioGroupHorizontal}`}
            >
              <label
                className={`${styles.radioLabel} ${styles.radioLabelHorizontal}`}
              >
                <input
                  type="radio"
                  name="clarity"
                  value="1k"
                  checked={clarity === "1k"}
                  onChange={() => handleClarityChange("1k")}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>标清 1k</span>
              </label>
              <label
                className={`${styles.radioLabel} ${styles.radioLabelHorizontal}`}
              >
                <input
                  type="radio"
                  name="clarity"
                  value="2k"
                  checked={clarity === "2k"}
                  onChange={() => handleClarityChange("2k")}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>高清 2k</span>
              </label>
            </div>
          </div>
        )}

        {/* <div className={styles.controlGroup}>
          <label>Seed值</label>
          <input
            type="number"
            min={0}
            max={2147483646}
            value={seed !== undefined ? seed : ""}
            placeholder="可选，范围[0, 2147483646]"
            onChange={(e) => handleSeedChange(e.target.value)}
            className={styles.settingInput}
          />
        </div> */}
      </div>
    </div>
  );
};
