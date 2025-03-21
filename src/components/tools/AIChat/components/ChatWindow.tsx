import React, { useState, useRef, useEffect, useCallback } from "react";
import { Message, ChatSession } from "../../../../types/chat";
import { ChatMessage } from "./ChatMessage";
import { v4 as uuidv4 } from "uuid";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AIProvider } from "../services/types";
import { AIServiceFactory } from "../services/AIServiceFactory";

// 默认使用的 AI 提供商和对话模式
const DEFAULT_AI_PROVIDER = AIProvider.DEEPSEEK;

enum ChatMode {
  CHAT = "chat",
  IMAGE = "image",
}

const STORAGE_KEYS = {
  AI_PROVIDER: "ai_provider",
  CHAT_MODE: "chat_mode",
  CHAT_SESSIONS: "chat_sessions",
};

const SYSTEM_PROMPTS = {
  [ChatMode.CHAT]: `"""我是你的AI助手，一个温暖贴心的朋友。让我们开始愉快的对话吧！😊"""
Initiate your response with "<think>\\n" at the beginning of every output.`,
  [ChatMode.IMAGE]: `"""请你根据用户输入进行回答，如果用户向你提出生图或者生视频要求，请你帮他生成相关Prompt

好的生图prompt要求：
1. 使用主题描述词+美学词+专业词的方式给出高质量的、直白表达的 prompt，Prompt 不要使用修辞手法和复杂表达
2. 当用户需要在图片中呈现文字时，使用引号标注需生成的文字
3. Prompt 保持结构简单并且只能包含中文，不能包含特殊符号
4. 给出的 Prompt 应该始终围绕用户的核心意图和要素，并且进行质量、创意上的合理发散

你需要输出{number}个prompt，你输出的**每一个prompt**都用如下的markdown格式的标签包裹，例如：
\`\`\`prompt
这是你输出的其中一个prompt
\`\`\`
"""`,
};

// 使用环境变量获取token
const HUGGING_FACE_TOKEN = process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN;

if (!HUGGING_FACE_TOKEN) {
  console.error("Hugging Face token not found in environment variables");
}

// 使用环境变量中的token
const headers = {
  Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
  "Content-Type": "application/json",
};

export const ChatWindow: React.FC<{
  onClose?: () => void;
}> = ({ onClose }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>(DEFAULT_AI_PROVIDER);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.CHAT);
  const [loadingDots, setLoadingDots] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  // 加载保存的设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.AI_PROVIDER,
          STORAGE_KEYS.CHAT_MODE,
          STORAGE_KEYS.CHAT_SESSIONS,
        ]);

        if (result[STORAGE_KEYS.AI_PROVIDER]) {
          setAiProvider(result[STORAGE_KEYS.AI_PROVIDER] as AIProvider);
        }

        if (result[STORAGE_KEYS.CHAT_MODE]) {
          const mode = result[STORAGE_KEYS.CHAT_MODE] as ChatMode;
          setChatMode(mode);
        }

        if (result[STORAGE_KEYS.CHAT_SESSIONS]) {
          const savedSessions = result[STORAGE_KEYS.CHAT_SESSIONS];
          setSessions(savedSessions);
          if (savedSessions.length > 0) {
            setCurrentSession(savedSessions[0]);
          } else {
            // 如果没有保存的会话，创建一个新会话
            createNewSession();
          }
        } else {
          // 如果没有保存的会话数据，创建一个新会话
          createNewSession();
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        // 出错时也创建一个新会话
        createNewSession();
      }
    };

    loadSettings();
  }, []);

  // 保存会话到 storage
  useEffect(() => {
    if (sessions.length > 0) {
      chrome.storage.local
        .set({ [STORAGE_KEYS.CHAT_SESSIONS]: sessions })
        .catch((error) => console.error("Failed to save sessions:", error));
    }
  }, [sessions]);

  useEffect(() => {
    // Handle click outside history dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputWrapperRef.current &&
        !inputWrapperRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      name: "新对话",
      systemPrompt: SYSTEM_PROMPTS[chatMode],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSession(newSession);
    setShowHistory(false);
    textareaRef.current?.focus();
  }, [chatMode, sessions]);

  const handleModeChange = async (mode: ChatMode) => {
    setChatMode(mode);
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.CHAT_MODE]: mode });
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          systemPrompt: SYSTEM_PROMPTS[mode],
        };
        setCurrentSession(updatedSession);
        setSessions(
          sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
        );
      }
    } catch (error) {
      console.error("Failed to save chat mode:", error);
    }
  };

  const handleProviderChange = async (provider: AIProvider) => {
    setAiProvider(provider);
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.AI_PROVIDER]: provider });
    } catch (error) {
      console.error("Failed to save AI provider:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(() => {
        setLoadingDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      setLoadingDots("");
    };
  }, [isStreaming]);

  const handleSend = async () => {
    if (!currentSession || !input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user" as const,
      content: input.trim(),
      timestamp: Date.now(),
    };

    // 创建一个初始的助手消息
    const assistantMessage: Message = {
      role: "assistant" as const,
      content: "",
      timestamp: Date.now(),
    };

    const updatedMessages = [
      ...currentSession.messages,
      userMessage,
      assistantMessage,
    ];
    const updatedSession: ChatSession = {
      ...currentSession,
      messages: updatedMessages,
      updatedAt: Date.now(),
      name:
        currentSession.messages.length === 0
          ? input.trim().slice(0, 20) + (input.trim().length > 20 ? "..." : "")
          : currentSession.name,
    };

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
      textareaRef.current.focus();
    }

    // 更新会话状态，包含用户消息和空的助手消息
    setCurrentSession(updatedSession);
    setSessions(
      sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );

    setIsStreaming(true);

    try {
      const aiService = AIServiceFactory.createService(aiProvider);
      let streamContent = {
        reasoning: "",
        content: "",
      };

      // 处理流式响应
      const fullResponse = await aiService.sendMessage({
        systemPrompt: currentSession.systemPrompt,
        messages: updatedMessages.slice(0, -1), // 不包含空的助手消息
        temperature: 0.7,
        topP: 0.95,
        maxTokens: 1000,
        onStream: (chunk) => {
          if (chunk.type === "reasoning") {
            streamContent.reasoning =
              (streamContent.reasoning || "") + chunk.content;
          } else {
            streamContent.content =
              (streamContent.content || "") + chunk.content;
          }

          // 更新消息内容
          setCurrentSession((prev) => {
            if (!prev) return prev;
            const updatedMessages = [...prev.messages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage.role === "assistant") {
              // 组合思维链和内容
              const combinedContent = [
                streamContent.reasoning ? streamContent.reasoning : "",
                streamContent.content
                  ? `<think>\n${streamContent.content}`
                  : "",
              ]
                .filter(Boolean)
                .join("\n");

              lastMessage.content = combinedContent || "";
            }
            return {
              ...prev,
              messages: updatedMessages,
            };
          });
        },
      });

      // 更新最终的完整响应
      const finalContent = [
        streamContent.reasoning || "",
        fullResponse ? `<think>\n${fullResponse}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const finalSession = {
        ...updatedSession,
        messages: [
          ...updatedMessages.slice(0, -1),
          {
            role: "assistant" as const,
            content: finalContent || "",
            timestamp: Date.now(),
          },
        ],
      };

      setCurrentSession(finalSession);
      setSessions(
        sessions.map((s) => (s.id === finalSession.id ? finalSession : s))
      );
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      const updatedSessionWithError = {
        ...updatedSession,
        messages: [
          ...updatedMessages.slice(0, -1),
          {
            role: "assistant" as const,
            content: `Error: ${errorMessage}`,
            timestamp: Date.now(),
          },
        ],
      };

      setCurrentSession(updatedSessionWithError);
      setSessions(
        sessions.map((s) =>
          s.id === updatedSessionWithError.id ? updatedSessionWithError : s
        )
      );
    } finally {
      setIsStreaming(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "36px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, 120) + "px";
    }
  };

  // Focus textarea when component mounts or session changes
  useEffect(() => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [currentSession]);

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

  return (
    <>
      <div className="chat-header">
        <div className="header-left">
          <select
            className="mode-select"
            value={chatMode}
            onChange={(e) => handleModeChange(e.target.value as ChatMode)}
          >
            <option value={ChatMode.CHAT}>聊天模式</option>
            <option value={ChatMode.IMAGE}>生图模式</option>
          </select>
          <select
            className="model-select"
            value={aiProvider}
            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          >
            <option value={AIProvider.DEEPSEEK}>Deepseek AI</option>
            <option value={AIProvider.HUGGINGFACE}>HuggingFace AI</option>
            <option value={AIProvider.VOLCENGINE}>火山引擎 AI</option>
          </select>
        </div>
        <div className="tools" ref={inputWrapperRef}>
          <button
            className="tool-button"
            onClick={createNewSession}
            title="新建对话"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            className={`tool-button ${showHistory ? "active" : ""}`}
            onClick={() => setShowHistory(!showHistory)}
            title="历史记录"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </button>

          <div className={`history-dropdown ${showHistory ? "show" : ""}`}>
            <div className="history-header">
              <div className="header-title">历史记录</div>
            </div>
            <div className="history-list">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`history-item ${
                    currentSession?.id === session.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setCurrentSession(session);
                    setShowHistory(false);
                    requestAnimationFrame(() => {
                      textareaRef.current?.focus();
                    });
                  }}
                >
                  <div className="item-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="item-info">
                    <div className="item-name">{session.name}</div>
                    <div className="item-time">
                      {formatMessageTime(session.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="empty-state">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="48"
                height="48"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <path d="M9 9h.01" />
                <path d="M15 9h.01" />
              </svg>
              <div className="empty-title">开始新的对话</div>
              <div className="empty-desc">
                AI 助手可以帮你回答问题、编写代码、分析数据等，快来开始对话吧！
              </div>
            </div>
          ) : (
            <>
              {currentSession.messages.map((message, index) => {
                if (!message || typeof message.role === "undefined") {
                  console.error("Invalid message object:", message);
                  return null;
                }

                return message.role === "assistant" &&
                  !message.content &&
                  isStreaming ? (
                  <div key={index} className="message assistant">
                    <div className="message-bubble loading-bubble">
                      <p data-dots={loadingDots}>AI 思考中</p>
                    </div>
                    <div className="message-footer">
                      <span className="message-time">刚刚</span>
                    </div>
                  </div>
                ) : (
                  <ChatMessage key={index} message={message} />
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="textarea"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            rows={1}
            disabled={isStreaming}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <div className="btn-content">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              {isStreaming ? "发送中..." : "发送"}
            </div>
          </button>
        </div>
      </div>
    </>
  );
};
