import { AIProvider, AIService, AIServiceConfig } from './types';
import { HuggingFaceService } from './HuggingFaceService';
import { VolcengineService } from './VolcengineService';
import { DeepseekService } from './DeepseekService';

export class AIServiceFactory {
  private static configs: Record<AIProvider, AIServiceConfig> = {
    [AIProvider.HUGGINGFACE]: {
      apiUrl: "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      apiKey: process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN!,
    },
    [AIProvider.VOLCENGINE]: {
      apiUrl: "https://open.volcengineapi.com/v3/llm/text",
      apiKey: "your_volcengine_api_key",
      apiSecret: "your_volcengine_api_secret",
    },
    [AIProvider.DEEPSEEK]: {
      apiUrl: "https://1251144395-0nj78wqwk4.ap-beijing.tencentscf.com/chat",
      apiKey: "",
    },
  };

  static createService(provider: AIProvider): AIService {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    switch (provider) {
      case AIProvider.HUGGINGFACE:
        return new HuggingFaceService(config);
      case AIProvider.VOLCENGINE:
        return new VolcengineService(config);
      case AIProvider.DEEPSEEK:
        return new DeepseekService(config);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  static updateConfig(provider: AIProvider, config: Partial<AIServiceConfig>) {
    this.configs[provider] = {
      ...this.configs[provider],
      ...config,
    };
  }
}