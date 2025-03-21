import React from "react";
import styles from "../BatchGenerator.module.scss";
import { GenerationMode } from "../types";

interface TabConfig {
  id: GenerationMode;
  label: string;
  description: string;
}

interface TabSelectorProps {
  tabs: TabConfig[];
  activeMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  tabs,
  activeMode,
  onModeChange,
}) => {
  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${
              activeMode === tab.id ? styles.activeTab : ""
            }`}
            onClick={() => onModeChange(tab.id)}
          >
            <div className={styles.tabLabel}>{tab.label}</div>
          </div>
        ))}
      </div>
      <div className={styles.tabDescription}>
        {tabs.find((tab) => tab.id === activeMode)?.description}
      </div>
    </div>
  );
};
