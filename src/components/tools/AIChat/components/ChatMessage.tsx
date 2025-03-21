import React, { useState, useRef, useEffect } from "react";
import { Message } from "../../../../types/chat";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const reasoningContentRef = useRef<HTMLDivElement>(null);

  // 监听内容变化，自动滚动到底部
  useEffect(() => {
    if (reasoningContentRef.current && !isReasoningExpanded) {
      const container = reasoningContentRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [message.content, isReasoningExpanded]);

  const formatMessageTime = (timestamp: number) => {
    const diffInSeconds = differenceInSeconds(new Date(), timestamp);
    if (diffInSeconds < 60) {
      return "刚刚";
    }
    return formatDistanceToNow(timestamp, {
      addSuffix: true,
      locale: zhCN,
    });
  };

  // 检查是否是提示词消息
  const isPromptMessage =
    message.role === "assistant" &&
    message.content.includes("[方案") &&
    message.content.includes("提示词");

  const handleCopy = () => {
    // 提取提示词内容
    const lines = message.content.split("\n");
    const promptLines = lines.filter(
      (line) => line.includes("[方案") && !line.includes("根据您的需求")
    );
    const promptText = promptLines.join("\n");

    navigator.clipboard
      .writeText(promptText)
      .then(() => {
        alert("提示词已复制到剪贴板");
      })
      .catch((err) => {
        console.error("复制失败:", err);
      });
  };

  // 分离思维链和实际内容
  const { reasoning, content } = React.useMemo(() => {
    if (message.role !== "assistant" || !message.content) {
      return { reasoning: "", content: message.content || "" };
    }

    const parts = message.content.split("<think>\n");
    if (parts.length === 1) {
      // 如果没有 <think> 标记，检查是否是思维链内容
      if (message.content.trim() === "") {
        return { reasoning: "", content: "" };
      }
      // 如果内容不为空且没有 <think> 标记，则认为是思维链内容
      return { reasoning: message.content, content: "" };
    }

    return {
      reasoning: parts[0],
      content: parts.slice(1).join("<think>\n"),
    };
  }, [message.content]);

  return (
    <div className={`message ${message.role}`}>
      <div className="message-bubble user-select">
        {reasoning && (
          <div
            className={`reasoning-section ${
              isReasoningExpanded ? "expanded" : ""
            }`}
            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
          >
            <div className="reasoning-header">
              <span>思维推理过程</span>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`expand-icon ${
                  isReasoningExpanded ? "expanded" : ""
                }`}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="reasoning-content" ref={reasoningContentRef}>
              <ReactMarkdown>{reasoning}</ReactMarkdown>
            </div>
          </div>
        )}
        {content && (
          <div className="main-content">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <div className="message-footer">
        <div className="message-time">
          {formatMessageTime(message.timestamp || Date.now())}
        </div>
        {isPromptMessage && (
          <button className="copy-button" onClick={handleCopy}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z" />
              <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
            </svg>
            复制提示词
          </button>
        )}
      </div>
    </div>
  );
};
