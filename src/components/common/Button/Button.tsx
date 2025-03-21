import React from "react";
import classNames from "classnames";
import styles from "./Button.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        {
          [styles.loading]: loading,
          [styles.disabled]: disabled,
          [styles.fullWidth]: fullWidth,
          [styles.iconOnly]: icon && !children,
          [styles.iconRight]: icon && iconPosition === "right",
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.loadingSpinner}>
          <svg viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}

      {icon && iconPosition === "left" && !loading && (
        <span className={styles.icon}>{icon}</span>
      )}

      {children && <span className={styles.content}>{children}</span>}

      {icon && iconPosition === "right" && !loading && (
        <span className={styles.icon}>{icon}</span>
      )}
    </button>
  );
};
