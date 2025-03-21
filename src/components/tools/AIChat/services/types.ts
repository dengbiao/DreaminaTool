import { Message } from "../../../../types/chat";

export enum AIProvider {
  DEEPSEEK = "DEEPSEEK",
  HUGGINGFACE = "HUGGINGFACE",
  VOLCENGINE = "VOLCENGINE",
}

export interface AIServiceConfig {
  apiUrl: string;
  apiKey: string;
}

export interface StreamChunk {
  type: 'reasoning' | 'content';
  content: string;
}

export interface AIRequestOptions {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  onStream?: (chunk: StreamChunk) => void;
}

export interface AIService {
  sendMessage(params: AIRequestOptions): Promise<string>;
} 