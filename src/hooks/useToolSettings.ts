import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';

export interface ToolSettings<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  saveSettings: (settings: T) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export function useToolSettings<T>(
  toolId: string,
  defaultSettings: T
): ToolSettings<T> {
  const [data, setData] = useState<T>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const savedSettings = await storage.get<T>(`tool_settings_${toolId}`);
        if (savedSettings) {
          setData(savedSettings);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load settings'));
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [toolId]);

  // 保存设置
  const saveSettings = useCallback(
    async (newSettings: T) => {
      try {
        await storage.set(`tool_settings_${toolId}`, newSettings);
        setData(newSettings);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to save settings'));
        console.error('Failed to save settings:', err);
        throw err;
      }
    },
    [toolId]
  );

  // 重置设置
  const resetSettings = useCallback(async () => {
    try {
      await storage.remove(`tool_settings_${toolId}`);
      setData(defaultSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset settings'));
      console.error('Failed to reset settings:', err);
      throw err;
    }
  }, [toolId, defaultSettings]);

  return {
    data,
    loading,
    error,
    saveSettings,
    resetSettings,
  };
} 