import { RetryOptions, AsyncFunction } from '../types/utility';
import { Logger } from './logger';

export async function retry<T>(
  fn: AsyncFunction<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = 3,
    delay = 1000,
    onRetry = (error, attempt) => {
      Logger.warn(
        `Retry attempt ${attempt} failed:`,
        error instanceof Error ? error.message : error
      );
    },
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === attempts) {
        throw lastError;
      }

      onRetry(lastError, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
} 