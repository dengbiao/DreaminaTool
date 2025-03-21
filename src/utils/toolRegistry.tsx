import React from "react";
import { BatchGeneratorWrapper } from "../components/tools/BatchGenerator/components/BatchGeneratorWrapper";
import { StoryAssistantWrapper } from "../components/tools/StoryAssistant/components/StoryAssistantWrapper";
import { ToolIcon } from "../components/common/ToolIcon";
import { AudioCutter } from "../components/tools/AudioCutter/index";
import { AIChat } from "../components/tools/AIChat/AIChat";
import { MattingWrapper } from "../components/tools/Matting/MattingWrapper";

export interface Tool {
  name: string;
  icon: React.ReactNode;
  description: string;
  component: React.ComponentType<any>;
  category: "text" | "image" | "audio" | "main" | "extra";
  defaultWidth?: number;
}

// 工具图标
const icons = {
  batch: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgNEgyQTIgMiAwIDAgMCAwIDZWMjBhMiAyIDAgMCAwIDIgMmgxNGEyIDIgMCAwIDAgMi0yVjZhMiAyIDAgMCAwLTItMnptMCAxNEgyVjZoMTR2MTJ6TTI0IDBoLTZ2MmgzLjU4NmwtNy43OTMgNy43OTMgMS40MTQgMS40MTRMMjIgMy40MTRWN2gyVjB6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=`,
  matting: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48cGF0aCBkPSJNMTIgOGMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=`,
  audio: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgM3YxMC41NWMtLjU5LS4zNC0xLjI3LS41NS0yLS41NS0yLjIxIDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTRWN2g0VjNoLTZ6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=`,
  story: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48cGF0aCBkPSJNMTIgOGMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=`,
  chat: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48cGF0aCBkPSJNMTIgOGMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=`,
};

export const tools: Tool[] = [
  {
    name: "批量生成",
    description: "批量生成多张图片，支持通用参数和模板替换",
    icon: <ToolIcon type="batch" size={24} />,
    component: BatchGeneratorWrapper,
    category: "main",
    defaultWidth: 330,
  },
  {
    name: "故事创作",
    description: "辅助创作故事分镜，支持批量创建多个分镜",
    icon: <ToolIcon type="story" size={24} />,
    component: StoryAssistantWrapper,
    category: "main",
    defaultWidth: 330,
  },
  {
    name: "音频处理",
    description: "音频预览、剪辑、分割、格式转换等处理工具",
    icon: <ToolIcon type="audio" size={24} />,
    component: AudioCutter,
    category: "audio",
    defaultWidth: 330,
  },
  {
    name: "AI 助手",
    description: "基于 AI 的智能对话助手，支持多轮对话和系统提示词设置",
    icon: <ToolIcon type="chat" size={24} />,
    component: AIChat,
    category: "main",
    defaultWidth: 600,
  },
  {
    name: "智能抠图",
    description: "基于AI的智能抠图工具，支持人像、物体等场景",
    icon: <ToolIcon type="matting" size={24} />,
    component: MattingWrapper,
    category: "image",
    defaultWidth: 330,
  },
];

export const getToolById = (id: string): Tool | undefined => {
  return tools.find((tool) => tool.name === id);
};

export const toolRegistry = {
  batchGenerator: {
    name: "批量生成器",
    component: BatchGeneratorWrapper,
    category: "text",
  },
} as const;

export type ToolKey = keyof typeof toolRegistry;
