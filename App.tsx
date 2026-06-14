/**
 * NightShade V5 — App Entry
 * - Initializes Crashlytics (crash reporting)
 * - Initializes OverlayStateStore (single source of truth)
 * - Overlay permission guard — shows PermissionScreen if permission lost
 * - SafeAreaProvider → ThemeProvider → AppNavigator
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import PermissionScreen from './src/screens/PermissionScreen';
import { overlayStore } from './src/services/OverlayStateStore';
import { useOverlayPermission } from './src/hooks/useOverlayPermission';
import { crashlyticsService } from './src/services/CrashlyticsService';

const Inner: React.FC = () => {
  const { isDark } = useAppTheme();
  const { hasPermission, checkNow } = useOverlayPermission();

  useEffect(() => {
    // Initialize Crashlytics — defer to avoid blocking first paint
    crashlyticsService.init();
    crashlyticsService.log('App started');

    overlayStore.init();
    return () => overlayStore.destroy();
  }, []);

  // If overlay permission is lost, show permission screen
  if (!hasPermission) {
    return (
      <ThemeProvider>
        <PermissionScreen onPermissionGranted={checkNow} />
      </ThemeProvider>
    );
  }

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
