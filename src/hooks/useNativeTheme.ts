/**
 * NightShade — Theme Hook
 *
 * Bridge to the native ThemeModule for switching the Android app theme.
 * Uses AppCompatDelegate.setDefaultNightMode() under the hood, which
 * triggers a configuration change and recreates the activity.
 *
 * The selected mode is persisted to SharedPreferences by the native module,
 * and MainActivity restores it before super.onCreate() on cold start.
 */

import { NativeModules, useColorScheme } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

const { ThemeModule } = NativeModules;

export const useNativeTheme = () => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    ThemeModule?.getCurrentTheme?.().then(setMode).catch(() => {
      // ThemeModule may not be available on iOS or if native build is stale
    });
  }, []);

  const applyTheme = useCallback(async (newMode: ThemeMode) => {
    try {
      await ThemeModule?.setTheme?.(newMode);
      setMode(newMode);
    } catch (e) {
      console.error('[ThemeModule] switch failed:', e);
    }
  }, []);

  const resolved = mode === 'system' ? (systemScheme ?? 'dark') : mode;

  return { mode, resolved, applyTheme };
};
