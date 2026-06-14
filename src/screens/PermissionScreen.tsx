/**
 * NightShade Revamp — Permission Screen
 * Void Architecture design tokens. No emoji. Honest copy.
 * Spec: "NightShade draws a color filter over your screen.
 *        It needs permission to appear over other apps."
 */

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, S, T, R, ANIM, E } from '../theme';
import { checkOverlayPermission, requestOverlayPermission } from '../utils/helpers';

interface PermissionScreenProps {
  onPermissionGranted: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({ onPermissionGranted }) => {
  const [checking, setChecking] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

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
        'Overlay permission required. Open Settings → Apps → NightShade → Permissions.',
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
    <Animated.View style={[ps.root, { backgroundColor: colors.voidBlack, opacity: fadeAnim }]}>
      <View style={[ps.content, { paddingTop: insets.top + S.s16, paddingBottom: insets.bottom + S.s8 }]}>
        {/* Icon — no emoji, use MaterialCommunityIcons shield */}
        <View style={[ps.iconCircle, { backgroundColor: colors.voidMid, borderColor: colors.voidRim }]}>
          <Icon name="shield-lock-outline" size={36} color={colors.accentAmber} />
        </View>

        {/* Title — honest and direct */}
        <Text style={ps.title}>Overlay Permission</Text>

        {/* Single-sentence pitch per spec */}
        <Text style={ps.description}>
          NightShade draws a color filter over your screen. It needs permission to appear over other apps.
        </Text>

        {/* Steps — compact, no fluff */}
        <View style={[ps.stepsCard, { backgroundColor: colors.voidDeep, borderColor: colors.voidRim }]}>
          <Text style={ps.stepsTitle}>HOW TO GRANT</Text>
          <View style={ps.stepRow}>
            <Text style={ps.stepNum}>1</Text>
            <Text style={ps.stepText}>Tap "Grant Permission" below</Text>
          </View>
          <View style={ps.stepRow}>
            <Text style={ps.stepNum}>2</Text>
            <Text style={ps.stepText}>Find "NightShade" in the list</Text>
          </View>
          <View style={ps.stepRow}>
            <Text style={ps.stepNum}>3</Text>
            <Text style={ps.stepText}>Toggle "Allow display over other apps"</Text>
          </View>
          <View style={ps.stepRow}>
            <Text style={ps.stepNum}>4</Text>
            <Text style={ps.stepText}>Return to this app</Text>
          </View>
        </View>

        {/* Grant button — pill shape, accent amber */}
        <TouchableOpacity
          style={[ps.grantButton, { backgroundColor: colors.accentAmber }, E.elevation1]}
          onPress={handleRequest}
          disabled={checking}
          accessibilityLabel="Grant overlay permission"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <Text style={ps.grantButtonText}>
            {checking ? 'Checking...' : 'Grant Permission'}
          </Text>
        </TouchableOpacity>

        {/* Secondary — open settings directly */}
        <TouchableOpacity
          style={[ps.settingsButton, { backgroundColor: colors.voidMid, borderColor: colors.voidRim }]}
          onPress={() => Linking.openSettings()}
          accessibilityLabel="Open app settings"
          activeOpacity={0.7}
        >
          <Text style={ps.settingsButtonText}>Open App Settings</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const ps = StyleSheet.create({
  root: { flex: 1 },
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
    borderWidth: 1,
  },
  title: {
    ...T.heading1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: S.s3,
    textAlign: 'center',
  },
  description: {
    ...T.bodyLg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: S.s6,
  },
  stepsCard: {
    borderRadius: R.radiusLg,
    padding: S.s4,
    width: '100%',
    marginBottom: S.s8,
    borderWidth: 1,
  },
  stepsTitle: {
    ...T.labelLg,
    color: colors.textMuted,
    marginBottom: S.s3,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.s3,
    paddingVertical: S.s1,
  },
  stepNum: {
    ...T.labelLg,
    color: colors.accentAmber,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  stepText: {
    ...T.bodySm,
    color: colors.textSecondary,
  },
  grantButton: {
    borderRadius: R.radiusPill,
    paddingVertical: S.s4,
    paddingHorizontal: S.s8,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: S.s3,
  },
  grantButtonText: {
    ...T.labelLg,
    color: colors.voidBlack,
    fontWeight: '700',
  },
  settingsButton: {
    borderRadius: R.radiusPill,
    paddingVertical: S.s3,
    paddingHorizontal: S.s8,
    width: '100%',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
  },
  settingsButtonText: {
    ...T.labelLg,
    color: colors.accentAmber,
    fontWeight: '600',
  },
});

export default PermissionScreen;
