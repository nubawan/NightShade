/**
 * NightShade V5 — Presets Screen
 * Uses OverlayStateStore for single source of truth.
 * Fixed duplicate keys — all keys use unique preset IDs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, EmptyState } from '../components/AppComponents';
import { S, T, R } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { FilterPreset } from '../types';
import { storageService } from '../services/StorageService';
import { overlayStore } from '../services/OverlayStateStore';
import { pctStr, formatDate, colorLabel } from '../utils/helpers';

interface Props {
  onCreateFilter: () => void;
}

const PresetsScreen: React.FC<Props> = ({ onCreateFilter }) => {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'built-in' | 'custom'>('all');

  // Subscribe to overlay store for real-time active preset tracking
  useEffect(() => {
    const unsubscribe = overlayStore.subscribe((state) => {
      setActiveId(state.presetId);
    });
    // Initial load
    (async () => {
      const p = await storageService.getPresets();
      setPresets(p);
      const state = overlayStore.getState();
      setActiveId(state.presetId);
    })();
    return unsubscribe;
  }, []);

  const apply = useCallback(async (p: FilterPreset) => {
    await overlayStore.applyPreset(p.id, p.opacity, p.color);
  }, []);

  const remove = useCallback(async (id: string, name: string) => {
    Alert.alert(
      'Delete Filter',
      `Delete "${name}"?${activeId === id ? ' This filter is currently active and will be disabled.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const result = await storageService.deletePreset(id);
            setPresets(result.presets);
            if (result.wasActive) {
              await overlayStore.deleteActivePreset();
            }
          },
        },
      ],
    );
  }, [activeId]);

  const duplicate = useCallback(async (p: FilterPreset) => {
    const updated = await storageService.duplicatePreset(p.id);
    setPresets(updated);
  }, []);

  const filteredPresets = filterTab === 'all'
    ? presets
    : filterTab === 'built-in'
      ? presets.filter(p => p.isBuiltIn)
      : presets.filter(p => !p.isBuiltIn);

  const renderItem = ({ item }: { item: FilterPreset }) => {
    const isActive = activeId === item.id;
    return (
      <Card style={{
        marginBottom: S.s2,
        backgroundColor: isActive ? palette.primaryContainer : palette.surfaceContainer,
      }}>
        <View style={ps.topRow}>
          <View style={ps.swatchWrap}>
            <View style={[ps.swatch, { backgroundColor: item.color, opacity: Math.min(item.opacity, 1.0) }]} />
            {item.opacity > 1.0 && <View style={[ps.swatchOverlay, { backgroundColor: item.color, opacity: item.opacity - 1.0 }]} />}
          </View>
          <View style={{ flex: 1, marginLeft: S.s3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.s2, flexWrap: 'wrap' }}>
              <Text style={{
                ...T.titleS,
                color: isActive ? palette.onPrimaryContainer : palette.onSurface,
                fontWeight: '600',
              }}>
                {item.name}
              </Text>
              {item.isBuiltIn && (
                <View key={`badge-builtin-${item.id}`} style={[ps.badge, { backgroundColor: palette.tertiaryContainer }]}>
                  <Text style={{ ...T.labelS, color: palette.onTertiaryContainer, fontWeight: '600' }}>Built-in</Text>
                </View>
              )}
              {isActive && (
                <View key={`badge-active-${item.id}`} style={[ps.badge, { backgroundColor: palette.primary }]}>
                  <Text style={{ ...T.labelS, color: palette.onPrimary, fontWeight: '700' }}>ACTIVE</Text>
                </View>
              )}
            </View>
            <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant, marginTop: S.s1 }}>
              {colorLabel(item.color)} · {pctStr(item.opacity)} dim · Used {formatDate(item.lastUsedAt)}
            </Text>
            {item.description ? (
              <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant, marginTop: S.s05 }} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={ps.actions}>
          <TouchableOpacity onPress={() => apply(item)} style={[ps.btn, { backgroundColor: palette.primary }]}>
            <Icon name="check" size={14} color={palette.onPrimary} />
            <Text style={{ color: palette.onPrimary, ...T.labelS, fontWeight: '700', marginLeft: S.s1 }}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => duplicate(item)} style={[ps.btn, { backgroundColor: palette.surfaceContainerHigh }]}>
            <Icon name="content-copy" size={14} color={palette.onSurface} />
            <Text style={{ color: palette.onSurface, ...T.labelS, fontWeight: '600', marginLeft: S.s1 }}>Duplicate</Text>
          </TouchableOpacity>
          {!item.isBuiltIn && (
            <TouchableOpacity onPress={() => remove(item.id, item.name)} style={[ps.btn, { backgroundColor: palette.errorContainer }]}>
              <Icon name="delete-outline" size={14} color={palette.onErrorContainer} />
              <Text style={{ color: palette.onErrorContainer, ...T.labelS, fontWeight: '600', marginLeft: S.s1 }}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[ps.root, { backgroundColor: palette.background }]}>
      <FlatList
        data={filteredPresets}
        renderItem={renderItem}
        keyExtractor={item => `preset-${item.id}`}
        contentContainerStyle={{
          paddingTop: insets.top + S.s4,
          paddingBottom: insets.bottom + S.s8 + S.s16,
          paddingHorizontal: S.s4,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: S.s4 }}>
            <Text style={{ ...T.headline, color: palette.onSurface, fontWeight: '700' }}>Filter Library</Text>
            <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginTop: S.s1 }}>
              {presets.length} filters · Tap to apply
            </Text>
            <View style={ps.filterRow}>
              {(['all', 'built-in', 'custom'] as const).map(f => (
                <TouchableOpacity
                  key={`filter-tab-${f}`}
                  style={[ps.filterBtn, { backgroundColor: filterTab === f ? palette.primary : palette.surfaceContainerHigh, borderColor: filterTab === f ? palette.primary : palette.outlineVariant }]}
                  onPress={() => setFilterTab(f)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: filterTab === f }}
                >
                  <Text style={{
                    ...T.labelM,
                    color: filterTab === f ? palette.onPrimary : palette.onSurfaceVariant,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}>
                    {f === 'all' ? `All (${presets.length})` : f === 'built-in' ? `Built-in (${presets.filter(p => p.isBuiltIn).length})` : `Custom (${presets.filter(p => !p.isBuiltIn).length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="palette-outline"
            title="No Filters Yet"
            subtitle="Create your first custom filter to get started"
            action={{ label: 'Create Filter', onPress: onCreateFilter }}
          />
        }
      />
    </View>
  );
};

const ps = StyleSheet.create({
  root: { flex: 1 },
  filterRow: { flexDirection: 'row', gap: S.s2, marginTop: S.s3 },
  filterBtn: { flex: 1, paddingVertical: S.s2, borderRadius: R.md, alignItems: 'center', borderWidth: 1, minHeight: S.s10, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  swatchWrap: { position: 'relative' },
  swatch: { width: 48, height: 48, borderRadius: R.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  swatchOverlay: { position: 'absolute', top: 0, left: 0, width: 48, height: 48, borderRadius: R.md },
  badge: { borderRadius: R.xs, paddingHorizontal: S.s2, paddingVertical: S.s05 },
  actions: { flexDirection: 'row', gap: S.s2, marginTop: S.s3, flexWrap: 'wrap' },
  btn: { flexDirection: 'row', borderRadius: R.sm, paddingHorizontal: S.s3, paddingVertical: S.s2, minHeight: S.s10, justifyContent: 'center', alignItems: 'center' },
});

export default PresetsScreen;
