import React, { useEffect, useState } from "react";
import styles from "./RouteValidator.module.scss";

interface RouteValidatorProps {
  urlPattern: RegExp | RegExp[];
  title?: string;
  description?: string;
  children: React.ReactNode;
  redirectUrl?: string;
  buttonText?: string;
  toolId?: string;
}

export const RouteValidator: React.FC<RouteValidatorProps> = ({
  urlPattern,
  title = "请先进入生成流界面",
  description = "该功能需要在即梦生成流界面使用",
  children,
  redirectUrl = "https://jimeng.jianying.com/ai-tool/image/generate",
  buttonText = "进入生成流界面",
  toolId,
}) => {
  const [isValidPage, setIsValidPage] = useState(false);

  useEffect(() => {
    const checkUrl = () => {
      const url = window.location.href;

      // 支持单个正则或多个正则数组
      const patterns = Array.isArray(urlPattern) ? urlPattern : [urlPattern];
      const isValid = patterns.some((pattern) => pattern.test(url));

      setIsValidPage(isValid);
    };

    checkUrl();
    // 监听 URL 变化
    const observer = new MutationObserver(() => {
      checkUrl();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
    });

    return () => observer.disconnect();
  }, [urlPattern]);

  const handleRedirect = () => {
    let targetUrl = redirectUrl;

    // 如果提供了工具ID，将其添加到URL中
    if (toolId) {
      // 检查redirectUrl是否已经包含查询参数
      const hasQueryParams = redirectUrl.includes("?");
      // 添加工具ID作为查询参数
      targetUrl = `${redirectUrl}${hasQueryParams ? "&" : "?"}toolId=${toolId}`;
    }

    window.open(targetUrl, "_blank");
  };

  if (!isValidPage) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.icon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 12L12 8M12 8L8 12M12 8V16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
          <button onClick={handleRedirect} className={styles.button}>
            <span>{buttonText}</span>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M13.75 6.75L19.25 12L13.75 17.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 12H4.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
