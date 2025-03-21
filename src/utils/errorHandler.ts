import { Logger } from './logger';
import { EventManager } from './eventManager';

export class ErrorHandler {
  private static readonly ERROR_EVENT = 'error';

  static handle(error: unknown, context?: string): void {
    const errorMessage = this.formatError(error);
    Logger.error(`${context ? `[${context}] ` : ''}${errorMessage}`);
    
    EventManager.emit(this.ERROR_EVENT, {
      error,
      message: errorMessage,
      context,
      timestamp: new Date(),
    });
  }

  static async wrap<T>(
    promise: Promise<T>,
    context?: string
  ): Promise<T | undefined> {
    try {
      return await promise;
    } catch (error) {
      this.handle(error, context);
      return undefined;
    }
  }

  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    }
    return String(error);
  }

  static onError(callback: (error: any) => void): void {
    EventManager.on(this.ERROR_EVENT, callback);
  }

  static offError(callback: (error: any) => void): void {
    EventManager.off(this.ERROR_EVENT, callback);
  }
} 