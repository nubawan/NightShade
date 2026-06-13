import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { colors, S, T, R, ANIM } from '../theme';
import { checkOverlayPermission, requestOverlayPermission } from '../utils/helpers';

interface PermissionScreenProps {
  onPermissionGranted: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({ onPermissionGranted }) => {
  const [checking, setChecking] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIM.slow,
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
    paddingHorizontal: S.s8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: S.s6,
  },
  icon: { fontSize: 36 },
  title: {
    ...T.titleL,
    fontWeight: '700',
    marginBottom: S.s3,
    textAlign: 'center',
  },
  description: {
    ...T.bodyM,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: S.s6,
  },
  stepsCard: {
    borderRadius: R.radiusLg,
    padding: S.s4,
    width: '100%',
    marginBottom: S.s8,
  },
  stepsTitle: {
    ...T.titleS,
    fontWeight: '600',
    marginBottom: S.s2,
  },
  step: {
    ...T.bodyM,
    lineHeight: 24,
    paddingLeft: S.s2,
  },
  grantButton: {
    borderRadius: R.radiusXl,
    paddingVertical: S.s3,
    paddingHorizontal: S.s8,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: S.s3,
  },
  grantButtonText: {
    color: '#FFFFFF',
    ...T.labelL,
    fontWeight: '700',
  },
  settingsButton: {
    borderRadius: R.radiusXl,
    paddingVertical: S.s3,
    paddingHorizontal: S.s8,
    width: '100%',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  settingsButtonText: {
    ...T.labelL,
    fontWeight: '600',
  },
});

export default PermissionScreen;
