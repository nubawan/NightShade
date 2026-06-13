import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, S, T, R, ANIM } from '../theme';
import { opacityToPercent, debounce, getBrightnessLabel } from '../utils/helpers';

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
    <View style={[styles.container, { backgroundColor: colors.surfaceContainer }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.primary }]}>
          {opacityToPercent(opacity)}
        </Text>
      </View>
      <View style={styles.sliderRow}>
        <Text style={styles.iconSun}>☀️</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1.80}
          step={0.01}
          value={opacity}
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.outlineVariant}
          thumbTintColor={colors.primary}
          accessibilityLabel="Brightness level"
          accessibilityValue={{ text: `${opacityToPercent(opacity)} ${getBrightnessLabel(opacity)}` }}
        />
        <Text style={styles.iconMoon}>🌙</Text>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>0%</Text>
        <Text style={[styles.labelText, { color: colors.outline }]}>100%</Text>
        <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>180%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: R.radiusLg,
    padding: S.s4,
    marginVertical: S.s1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.s3,
  },
  title: {
    ...T.titleM,
  },
  value: {
    ...T.titleM,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.s2,
  },
  iconSun: {
    fontSize: 16,
  },
  iconMoon: {
    fontSize: 16,
  },
  slider: {
    flex: 1,
    height: 48, // Accessibility: minimum touch target
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  labelText: {
    ...T.labelS,
  },
});

export default BrightnessSlider;
