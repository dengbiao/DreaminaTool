import { config } from '../config';
import { Result } from '../types/utility';
import { ErrorHandler } from '../utils/errorHandler';
import { Logger } from '../utils/logger';

export class ApiService {
  private static readonly headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-API-Key': config.api.key,
  };

  private static async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<Result<T>> {
    try {
      const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      ErrorHandler.handle(error, 'API Request');
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  static async generateImage(prompt: string): Promise<Result<any>> {
    Logger.debug('Generating image with prompt:', prompt);
    return this.request('/aigc_draft/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }
}