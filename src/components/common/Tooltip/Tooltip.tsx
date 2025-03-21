import React, { useState, useRef, useEffect } from "react";
import styles from "./Tooltip.module.scss";
import classNames from "classnames";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  children: React.ReactElement;
  className?: string;
  shortcut?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = "top",
  delay = 200,
  children,
  className,
  shortcut,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      <span className={styles.text}>{content}</span>
      {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
    </div>
  );

  return (
    <div
      className={classNames(styles.tooltipWrapper, className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {isVisible && (
        <div
          ref={tooltipRef}
          className={classNames(styles.tooltip, styles[position])}
          role="tooltip"
        >
          {tooltipContent}
          <div className={styles.arrow} />
        </div>
      )}
      {children}
    </div>
  );
};
