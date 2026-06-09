/**
 * NightShade V5 — App Entry
 * - Initializes OverlayStateStore (single source of truth)
 * - SafeAreaProvider → ThemeProvider → AppNavigator
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { overlayStore } from './src/services/OverlayStateStore';

const Inner: React.FC = () => {
  const { isDark } = useAppTheme();

  useEffect(() => {
    overlayStore.init();
    return () => overlayStore.destroy();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
    </>
  );
};

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Inner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
