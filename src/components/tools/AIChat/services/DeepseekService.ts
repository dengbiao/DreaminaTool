import { AIService, AIServiceConfig, AIRequestOptions } from './types';

export class DeepseekService implements AIService {
  private config: AIServiceConfig;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      return response;
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        console.warn(`Request failed, retrying... (${retries + 1}/${this.MAX_RETRIES})`);
        await this.delay(this.RETRY_DELAY);
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  async sendMessage(params: AIRequestOptions): Promise<string> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };

    const body = {
      model: "deepseek-r1-250120",
      messages: [
        {
          role: "system",
          content: params.systemPrompt
        },
        ...params.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      ],
      stream: true,
    };

    try {
      const response = await this.fetchWithRetry(this.config.apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let isInReasoning = true; // 标记是否在思维链阶段
      let lastContent = ''; // 用于检测空消息和换行模式

      if (!reader) {
        throw new Error("Response body is null");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const reasoningContent = parsed.choices?.[0]?.delta?.reasoning_content || '';
              let content = parsed.choices?.[0]?.delta?.content || '';
              
              // 检测思维链到正式回答的转换
              if (content === '\n\n' && lastContent === '') {
                isInReasoning = false; // 检测到转换标记
                lastContent = '';
                continue; // 跳过这个转换消息
              }
              lastContent = content;

              // 处理思维链内容
              if (reasoningContent || (isInReasoning && content)) {
                if (params.onStream) {
                  params.onStream({
                    type: 'reasoning',
                    content: reasoningContent || content
                  });
                }
              } 
              // 处理正式回答内容
              else if (!isInReasoning && content) {
                if (params.onStream) {
                  params.onStream({
                    type: 'content',
                    content: content
                  });
                }
                fullContent += content;
              }
            } catch (e) {
              console.warn('Failed to parse chunk:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error("Deepseek API error:", error);
      throw new Error(`Deepseek API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}