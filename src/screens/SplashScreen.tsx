import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, useColorScheme } from 'react-native';
import { getThemeColors, Spacing, Typography, Shape, Animation } from '../theme';
import { checkOverlayPermission } from '../utils/helpers';
import { storageService } from '../services/StorageService';
import { overlayService } from '../services/OverlayService';

interface SplashScreenProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Animation.durationSlow,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: Animation.springDamping,
        stiffness: Animation.springStiffness,
        useNativeDriver: true,
      }),
    ]).start();

    const initialize = async () => {
      try {
        const settings = await storageService.getOverlaySettings();
        const autoStart = await storageService.getAutoStart();

        const hasPermission = await checkOverlayPermission();
        if (!hasPermission) {
          onPermissionDenied();
          return;
        }

        if (autoStart && settings.enabled) {
          try {
            await overlayService.updateOverlay(settings);
          } catch (e) {
            console.error('Failed to restore overlay on boot:', e);
          }
        }

        onPermissionGranted();
      } catch (e) {
        console.error('Splash initialization error:', e);
        onPermissionDenied();
      }
    };

    const timer = setTimeout(initialize, 800);
    return () => clearTimeout(timer);
  }, [onPermissionGranted, onPermissionDenied, fadeAnim, scaleAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primaryContainer }]}>
          <Text style={styles.logoIcon}>🌙</Text>
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>NightShade</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Screen Filter & Eye Comfort
        </Text>
      </Animated.View>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIcon: {
    fontSize: 44,
  },
  title: {
    ...Typography.headlineMedium,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xxxl,
  },
  loader: {
    marginTop: Spacing.huge,
  },
});

export default SplashScreen;
