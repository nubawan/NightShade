/**
 * NightShade Revamp — Splash Screen
 * Void Architecture design tokens. No emoji. Honest copy.
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const insets = useSafeAreaInsets();

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
            // Restore may fail if service was killed
          }
        }

        onPermissionGranted();
      } catch (e) {
        onPermissionDenied();
      }
    };

    const timer = setTimeout(initialize, 800);
    return () => clearTimeout(timer);
  }, [onPermissionGranted, onPermissionDenied, fadeAnim, scaleAnim]);

  return (
    <View style={[ss.root, { backgroundColor: colors.voidBlack, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View
        style={[
          ss.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        {/* Icon — no emoji, use MaterialCommunityIcons iris mark */}
        <View style={[ss.logoCircle, { backgroundColor: colors.voidMid, borderColor: colors.voidRim }]}>
          <Icon name="moon-waning-crescent" size={44} color={colors.accentAmber} />
        </View>
        <Text style={ss.title}>NightShade</Text>
        <Text style={ss.subtitle}>
          Precision screen filter
        </Text>
      </Animated.View>
      <ActivityIndicator
        size="large"
        color={colors.accentAmber}
        style={ss.loader}
      />
    </View>
  );
};

const ss = StyleSheet.create({
  root: {
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
    borderWidth: 1,
  },
  title: {
    ...T.displayLg,
    color: colors.textPrimary,
    fontWeight: '300',
    letterSpacing: -1,
    marginBottom: S.s1,
  },
  subtitle: {
    ...T.bodySm,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: S.s16,
  },
  loader: {
    marginTop: S.s12,
  },
});

export default SplashScreen;
