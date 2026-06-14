/**
 * NightShade Revamp — Brightness Slider
 * Void Architecture design tokens. No emoji. Vector icons only.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, S, T, R } from '../theme';
import { opacityToPercent, getBrightnessLabel } from '../utils/helpers';

interface BrightnessSliderProps {
  opacity: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  label?: string;
}

const BrightnessSlider: React.FC<BrightnessSliderProps> = ({
  opacity,
  onValueChange,
  onSlidingComplete,
  label = 'Brightness',
}) => {

  return (
    <View style={[styles.container, { backgroundColor: colors.voidDeep, borderColor: colors.voidRim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.value}>
          {opacityToPercent(opacity)}
        </Text>
      </View>
      <View style={styles.sliderRow}>
        <Icon name="weather-sunny" size={18} color={colors.textMuted} />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1.80}
          step={0.01}
          value={opacity}
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={colors.accentAmber}
          maximumTrackTintColor={colors.voidRim}
          thumbTintColor={colors.accentAmber}
          accessibilityLabel="Brightness level"
          accessibilityValue={{ text: `${opacityToPercent(opacity)} ${getBrightnessLabel(opacity)}` }}
        />
        <Icon name="moon-waning-crescent" size={18} color={colors.textMuted} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.labelText}>0%</Text>
        <Text style={styles.labelText}>100%</Text>
        <Text style={styles.labelText}>180%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: R.radiusLg,
    padding: S.s4,
    marginVertical: S.s1,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.s3,
  },
  title: {
    ...T.heading2,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  value: {
    ...T.monoNum,
    color: colors.accentAmber,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.s2,
  },
  slider: {
    flex: 1,
    height: 48,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  labelText: {
    ...T.labelSm,
    color: colors.textMuted,
  },
});

export default BrightnessSlider;
