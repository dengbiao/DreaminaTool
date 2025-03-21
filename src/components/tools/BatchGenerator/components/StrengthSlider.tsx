import React from "react";
import styles from "../BatchGenerator.module.scss";

interface StrengthSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export const StrengthSlider: React.FC<StrengthSliderProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className={styles.strengthSlider}>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
      <div className={styles.strengthValue}>{value}</div>
    </div>
  );
};
