import React from "react";
import styles from "../BatchGenerator.module.scss";
import { RatioConfig } from "../types";

interface RatioSelectorProps {
  ratios: RatioConfig[];
  selectedRatio: RatioConfig;
  onRatioChange: (ratio: RatioConfig) => void;
}

export const RatioSelector: React.FC<RatioSelectorProps> = ({
  ratios,
  selectedRatio,
  onRatioChange,
}) => {
  return (
    <div className={styles.aspectRatios}>
      {ratios.map((ratio) => (
        <div
          key={ratio.ratio}
          className={`${styles.aspectRatioOption} ${
            ratio.ratio === selectedRatio.ratio ? styles.selected : ""
          }`}
          onClick={() => onRatioChange(ratio)}
        >
          <div className={styles.ratio}>{ratio.ratio}</div>
          <div className={styles.size}>
            {ratio.width}×{ratio.height}
          </div>
        </div>
      ))}
    </div>
  );
};
