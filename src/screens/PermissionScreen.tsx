import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Animated,
  useColorScheme,
} from 'react-native';
import { getThemeColors, Spacing, Typography, Shape, Animation } from '../theme';
import { checkOverlayPermission, requestOverlayPermission } from '../utils/helpers';

interface PermissionScreenProps {
  onPermissionGranted: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({ onPermissionGranted }) => {
  const [checking, setChecking] = useState(false);
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: Animation.durationSlow,
      useNativeDriver: true,
    }).start();

    const check = async () => {
      const hasPermission = await checkOverlayPermission();
      if (hasPermission) onPermissionGranted();
    };
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [onPermissionGranted, fadeAnim]);

  const handleRequest = async () => {
    setChecking(true);
    try {
      await requestOverlayPermission();
    } catch {
      Alert.alert(
        'Permission Required',
        'Please grant the "Display over other apps" permission for NightShade.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
          <Text style={styles.icon}>🛡️</Text>
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>Permission Required</Text>
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          NightShade needs the "Display over other apps" permission to draw a screen
          filter overlay on top of all applications. This enables the brightness
          reduction and color filter to work across your entire device.
        </Text>

        <View style={[styles.stepsCard, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.stepsTitle, { color: colors.onSurface }]}>How to grant permission:</Text>
          <Text style={[styles.step, { color: colors.onSurfaceVariant }]}>
            1. Tap "Grant Permission" below
          </Text>
          <Text style={[styles.step, { color: colors.onSurfaceVariant }]}>
            2. Find "NightShade" in the list
          </Text>
          <Text style={[styles.step, { color: colors.onSurfaceVariant }]}>
            3. Toggle "Allow display over other apps"
          </Text>
          <Text style={[styles.step, { color: colors.onSurfaceVariant }]}>
            4. Return to this app
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.grantButton, { backgroundColor: colors.primary }]}
          onPress={handleRequest}
          disabled={checking}
          accessibilityLabel="Grant overlay permission"
          accessibilityRole="button">
          <Text style={styles.grantButtonText}>
            {checking ? 'Checking...' : 'Grant Permission'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={() => Linking.openSettings()}
          accessibilityLabel="Open app settings">
          <Text style={[styles.settingsButtonText, { color: colors.primary }]}>
            Open App Settings
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: { fontSize: 36 },
  title: {
    ...Typography.headlineSmall,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  stepsCard: {
    borderRadius: Shape.lg,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  stepsTitle: {
    ...Typography.titleSmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  step: {
    ...Typography.bodyMedium,
    lineHeight: 24,
    paddingLeft: Spacing.sm,
  },
  grantButton: {
    borderRadius: Shape.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  grantButtonText: {
    color: '#FFFFFF',
    ...Typography.labelLarge,
    fontWeight: '700',
  },
  settingsButton: {
    borderRadius: Shape.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  settingsButtonText: {
    ...Typography.labelLarge,
    fontWeight: '600',
  },
});

export default PermissionScreen;
