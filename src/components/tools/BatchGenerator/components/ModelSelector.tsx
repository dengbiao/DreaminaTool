import React, { useState } from "react";
import styles from "../BatchGenerator.module.scss";
import { ModelConfig } from "../types";

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModel: ModelConfig;
  onModelChange: (model: ModelConfig) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
}) => {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);

  return (
    <div className={styles.modelSelector}>
      <div
        className={styles.modelCurrent}
        onClick={() => setIsOptionsVisible(!isOptionsVisible)}
      >
        <div className={styles.modelInfo}>
          <div className={styles.modelName}>{selectedModel.name}</div>
          <div className={styles.modelDesc}>{selectedModel.description}</div>
        </div>
        <div className={styles.modelIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div
        className={`${styles.modelOptions} ${
          isOptionsVisible ? styles.show : ""
        }`}
      >
        {models.map((model) => (
          <div
            key={model.value}
            className={`${styles.modelOption} ${
              model.value === selectedModel.value ? styles.selected : ""
            }`}
            onClick={() => {
              onModelChange(model);
              setIsOptionsVisible(false);
            }}
          >
            <div className={styles.modelOptionName}>{model.name}</div>
            <div className={styles.modelOptionDesc}>{model.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
