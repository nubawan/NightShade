import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, useColorScheme } from 'react-native';
import { getThemeColors, Spacing, Typography, Shape, Animation } from '../theme';
import { Preset } from '../types';
import { opacityToPercent } from '../utils/helpers';

interface PresetCardProps {
  preset: Preset;
  onApply: (preset: Preset) => void;
  onEdit: (preset: Preset) => void;
  onDelete: (preset: Preset) => void;
  isActive: boolean;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onApply,
  onEdit,
  onDelete,
  isActive,
}) => {
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);

  const handleDelete = () => {
    if (preset.isBuiltIn) {
      Alert.alert('Cannot Delete', 'Built-in presets cannot be deleted.');
      return;
    }
    Alert.alert(
      'Delete Preset',
      `Are you sure you want to delete "${preset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(preset) },
      ],
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isActive ? colors.primaryContainer : colors.surfaceContainer,
          borderColor: isActive ? colors.primary : 'transparent',
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.info}>
          {/* Thumbnail color circle */}
          <View
            style={[
              styles.colorDot,
              {
                backgroundColor: preset.color,
                borderColor: colors.outline,
              },
            ]}
          />
          <View style={styles.textInfo}>
            <Text style={[styles.name, { color: isActive ? colors.onPrimaryContainer : colors.onSurface }]}>
              {preset.name}
            </Text>
            <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
              {opacityToPercent(preset.opacity)} dim
            </Text>
          </View>
        </View>
        {isActive && (
          <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => onApply(preset)}
          accessibilityLabel={`Apply ${preset.name} preset`}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
        {!preset.isBuiltIn && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            onPress={() => onEdit(preset)}
            accessibilityLabel={`Edit ${preset.name} preset`}>
            <Text style={[styles.editText, { color: colors.onSurface }]}>Edit</Text>
          </TouchableOpacity>
        )}
        {!preset.isBuiltIn && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.errorContainer }]}
            onPress={handleDelete}
            accessibilityLabel={`Delete ${preset.name} preset`}>
            <Text style={[styles.deleteText, { color: colors.onErrorContainer }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Shape.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  colorDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  textInfo: {
    gap: 2,
  },
  name: {
    ...Typography.titleSmall,
    fontWeight: '600',
  },
  detail: {
    ...Typography.bodySmall,
  },
  activeBadge: {
    borderRadius: Shape.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.sm,
    alignItems: 'center',
    minHeight: 44, // Accessibility
    justifyContent: 'center',
  },
  applyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    ...Typography.labelMedium,
  },
  editText: {
    fontWeight: '600',
    ...Typography.labelMedium,
  },
  deleteText: {
    fontWeight: '600',
    ...Typography.labelMedium,
  },
});

export default PresetCard;
