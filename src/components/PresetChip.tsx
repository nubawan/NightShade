import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, S, T, R } from '../theme';
import { Preset } from '../types';

interface PresetChipProps {
  preset: Preset;
  isActive: boolean;
  onPress: (preset: Preset) => void;
}

const PresetChip: React.FC<PresetChipProps> = ({ preset, isActive, onPress }) => {

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
    paddingHorizontal: S.s3,
    paddingVertical: S.s2,
    borderRadius: R.radiusXl,
    borderWidth: 1,
    gap: S.s1,
    minHeight: 40,
  },
  chipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chipText: {
    ...T.labelM,
    fontWeight: '500',
  },
});

export default PresetChip;
