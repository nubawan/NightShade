import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, useColorScheme } from 'react-native';
import { getThemeColors, Spacing, Typography, Shape, Animation } from '../theme';
import { ColorModes } from '../theme';
import { ColorMode } from '../types';

interface ColorSelectorProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onCustomPress?: () => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedColor,
  onSelectColor,
  onCustomPress,
}) => {
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);

  const renderColorItem = ({ item }: { item: typeof ColorModes[number] }) => {
    const isSelected = selectedColor === item.color;
    const isCustom = item.name === 'Custom';

    const handlePress = () => {
      if (isCustom && onCustomPress) {
        onCustomPress();
      } else {
        onSelectColor(item.color);
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.colorItem,
          {
            backgroundColor: isSelected
              ? colors.primaryContainer
              : colors.surfaceContainerHigh,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
        onPress={handlePress}
        accessibilityLabel={`${item.label} filter`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}>
        <View
          style={[
            styles.colorCircle,
            { backgroundColor: item.color },
            isSelected && {
              borderColor: colors.primary,
              borderWidth: 3,
            },
          ]}
        />
        <Text
          style={[
            styles.colorLabel,
            {
              color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
            },
          ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainer }]}>
      <Text style={[styles.title, { color: colors.onSurface }]}>Color Filter</Text>
      <FlatList
        data={ColorModes}
        renderItem={renderColorItem}
        keyExtractor={item => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Shape.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  title: {
    ...Typography.titleMedium,
    marginBottom: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  colorItem: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Shape.md,
    borderWidth: 2,
    minWidth: 68,
    minHeight: 80, // Accessibility: larger touch target
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: Spacing.xs,
  },
  colorLabel: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
});

export default ColorSelector;
