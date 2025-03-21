/// <reference types="chrome"/>

declare namespace chrome {
  export namespace tabs {
    export interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
      windowId: number;
    }
  }

  export namespace action {
    export const onClicked: {
      addListener(callback: (tab: chrome.tabs.Tab) => void): void;
    };
  }

  export namespace scripting {
    export function executeScript(injection: {
      target: { tabId: number };
      files: string[];
    }): Promise<void>;

    export function insertCSS(injection: {
      target: { tabId: number };
      files: string[];
    }): Promise<void>;
  }

  export namespace storage {
    export interface StorageArea {
      get(keys?: string | string[] | object | null): Promise<{ [key: string]: any }>;
      set(items: object): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    export const sync: StorageArea;
    export const local: StorageArea;
  }

  export namespace runtime {
    export interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    export function sendMessage<T = any>(
      message: any,
      responseCallback?: (response: T) => void
    ): void;

    export const onMessage: {
      addListener(
        callback: (
          message: any,
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => void | boolean
      ): void;
    };
  }
} 