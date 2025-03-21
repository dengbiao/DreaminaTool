import { Message, ChatResponse } from '../types/chat';

const CHAT_API_URL = 'http://localhost:8000/api/chat';

export class ChatService {
  private static async fetchSSE(
    url: string,
    options: RequestInit,
    onMessage: (data: ChatResponse) => void
  ): Promise<void> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'text/event-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            onMessage(parsed);
          } catch (e) {
            console.error('Error parsing SSE message:', e);
          }
        }
      }
    }
  }

  static async sendMessage(
    messages: Message[],
    systemPrompt: string,
    onMessage: (data: ChatResponse) => void
  ): Promise<void> {
    return this.fetchSSE(
      CHAT_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          system_prompt: systemPrompt,
        }),
      },
      onMessage
    );
  }
} 