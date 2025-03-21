type EventCallback = (...args: any[]) => void;

interface EventMap {
  [key: string]: Set<EventCallback>;
}

export class EventManager {
  private static events: EventMap = {};
  private static maxListeners = 10;

  static setMaxListeners(n: number): void {
    this.maxListeners = n;
  }

  static on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = new Set();
    }

    if (this.events[event].size >= this.maxListeners) {
      console.warn(
        `Warning: Event "${event}" has exceeded maximum listener count (${this.maxListeners})`
      );
    }

    this.events[event].add(callback);
  }

  static once(event: string, callback: EventCallback): void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }

  static off(event: string, callback: EventCallback): void {
    if (this.events[event]) {
      this.events[event].delete(callback);
      if (this.events[event].size === 0) {
        delete this.events[event];
      }
    }
  }

  static emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }

    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });

    return true;
  }

  static removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  static listenerCount(event: string): number {
    return this.events[event]?.size || 0;
  }

  static eventNames(): string[] {
    return Object.keys(this.events);
  }
} 