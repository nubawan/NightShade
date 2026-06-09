import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Slider from '@react-native-community/slider';
import { getThemeColors, Spacing, Typography, Shape, Animation } from '../theme';
import { opacityToPercent, debounce } from '../utils/helpers';

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
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);

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
          maximumValue={1}
          step={0.01}
          value={opacity}
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.outlineVariant}
          thumbTintColor={colors.primary}
          accessibilityLabel="Brightness level"
          accessibilityValue={{ text: opacityToPercent(opacity) }}
        />
        <Text style={styles.iconMoon}>🌙</Text>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>0%</Text>
        <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>100%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Shape.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleMedium,
  },
  value: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    ...Typography.labelSmall,
  },
});

export default BrightnessSlider;
