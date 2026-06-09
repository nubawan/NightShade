/**
 * NightShade V4 — Theme Context
 * Fixed theme toggle with immediate effect and persistence.
 * Properly syncs with system color scheme changes.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AppTheme } from '../types';
import { Palette, getPalette, palettes } from '../theme';
import { storageService } from '../services/StorageService';

interface ThemeContextValue {
  theme: AppTheme;
  palette: Palette;
  isDark: boolean;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  palette: palettes.dark,
  isDark: true,
  setTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemDark = useColorScheme() === 'dark';
  const [theme, setThemeState] = useState<AppTheme>('system');
  const [loaded, setLoaded] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    (async () => {
      const saved = await storageService.getAppTheme();
      setThemeState(saved);
      setLoaded(true);
    })();
  }, []);

  const setTheme = useCallback(async (t: AppTheme) => {
    setThemeState(t);
    await storageService.setAppTheme(t);
  }, []);

  const isDark = theme === 'system' ? systemDark : theme === 'dark';
  const palette = useMemo(() => getPalette(theme, systemDark), [theme, systemDark]);

  const value = useMemo(() => ({ theme, palette, isDark, setTheme }), [theme, palette, isDark, setTheme]);

  // Don't render until theme is loaded to prevent flash
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
