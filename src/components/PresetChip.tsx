import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { getThemeColors, Spacing, Typography, Shape } from '../theme';
import { Preset } from '../types';

interface PresetChipProps {
  preset: Preset;
  isActive: boolean;
  onPress: (preset: Preset) => void;
}

const PresetChip: React.FC<PresetChipProps> = ({ preset, isActive, onPress }) => {
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isActive ? colors.primary : colors.surfaceContainerHigh,
          borderColor: isActive ? colors.primary : colors.outlineVariant,
        },
      ]}
      onPress={() => onPress(preset)}
      accessibilityLabel={`${preset.name} preset`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}>
      <View
        style={[
          styles.chipDot,
          { backgroundColor: preset.color },
        ]}
      />
      <Text
        style={[
          styles.chipText,
          { color: isActive ? colors.onPrimary : colors.onSurface },
        ]}
        numberOfLines={1}>
        {preset.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.xl,
    borderWidth: 1,
    gap: Spacing.xs,
    minHeight: 40,
  },
  chipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chipText: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
});

export default PresetChip;
