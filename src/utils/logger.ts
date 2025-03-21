export class Logger {
  private static readonly PREFIX = '[即梦工具箱]';

  static info(message: string, ...args: any[]): void {
    console.log(`${this.PREFIX} ${message}`, ...args);
  }

  static error(message: string, error?: any): void {
    console.error(`${this.PREFIX} ${message}`, error);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`${this.PREFIX} ${message}`, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.PREFIX} ${message}`, ...args);
    }
  }
} 