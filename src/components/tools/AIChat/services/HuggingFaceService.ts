import { AIService, AIServiceConfig, AIRequestParams } from './types';

export class HuggingFaceService implements AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async sendMessage(params: AIRequestParams): Promise<string> {
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        inputs: `${params.systemPrompt}\n\n${params.messages
          .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
          .join("\n")}\nAssistant:`,
        parameters: {
          max_new_tokens: params.maxTokens || 1000,
          temperature: params.temperature || 0.7,
          top_p: params.topP || 0.95,
          repetition_penalty: 1.15,
        },
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    let assistantMessage = result[0].generated_text;

    // Extract AI's actual reply
    const lines = assistantMessage.split("\n");
    let lastAssistantIndex = -1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith("Assistant:") && !lines[i].includes("Error:")) {
        lastAssistantIndex = i;
        break;
      }
    }

    if (lastAssistantIndex !== -1) {
      assistantMessage = lines[lastAssistantIndex].replace("Assistant:", "").trim();
      for (let i = lastAssistantIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("Human:") || line.startsWith("Assistant:")) {
          break;
        }
        if (line) {
          assistantMessage += "\n" + line;
        }
      }
    }

    return assistantMessage;
  }
} 