export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  name: string;
  systemPrompt: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isStreaming: boolean;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    delta?: {
      content?: string;
      role?: string;
    };
    message?: Message;
    finish_reason?: string | null;
  }>;
  created: number;
  model: string;
  object: string;
} 