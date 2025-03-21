import { AIService, AIServiceConfig, AIRequestParams } from './types';

export class VolcengineService implements AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async sendMessage(params: AIRequestParams): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);

    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
        "X-Date": timestamp.toString(),
      },
      body: JSON.stringify({
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
        parameters: {
          temperature: params.temperature || 0.7,
          top_p: params.topP || 0.95,
          max_tokens: params.maxTokens || 1000,
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${JSON.stringify(result)}`);
    }

    return result.choices[0].message.content;
  }
} 