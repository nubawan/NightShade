import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { colors, S, T, R, ANIM } from '../theme';
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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIM.slow,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: ANIM.spring.damping,
        stiffness: ANIM.spring.stiffness,
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
            await overlayService.update(settings);
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
    marginBottom: S.s6,
  },
  logoIcon: {
    fontSize: 44,
  },
  title: {
    ...T.headline,
    fontWeight: '700',
    marginBottom: S.s1,
  },
  subtitle: {
    ...T.bodyM,
    marginBottom: S.s16,
  },
  loader: {
    marginTop: S.s12,
  },
});

export default SplashScreen;
