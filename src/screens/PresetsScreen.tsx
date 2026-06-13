/**
 * NightShade Revamp — Presets Screen (Module F1)
 * 2-column color swatch grid with category filter pills.
 * Void Architecture design tokens throughout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EmptyState } from '../components/AppComponents';
import { S, T, R, colors } from '../theme';
import { FilterPreset, PresetCategory } from '../types';
import { storageService } from '../services/StorageService';
import { overlayStore } from '../services/OverlayStateStore';
import { pctStr, colorLabel } from '../utils/helpers';

interface Props {
  onCreateFilter: () => void;
}

// Category tabs matching the spec
const CATEGORY_TABS: { key: 'All' | PresetCategory; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Cinema', label: 'Cinema' },
  { key: 'Clarity', label: 'Clarity' },
  { key: 'Warm', label: 'Warm' },
  { key: 'Deep', label: 'Deep' },
  { key: 'Cool', label: 'Cool' },
  { key: 'Custom', label: 'Custom' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
// Card width: (screenWidth - 48dp) / 2, with 16dp padding on each side and 16dp gap
const CARD_GAP = S.s4; // 16dp
const H_PADDING = S.s4; // 16dp each side
const CARD_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = 160;
const SWATCH_HEIGHT = CARD_HEIGHT * 0.6; // top 60%

const PresetsScreen: React.FC<Props> = ({ onCreateFilter }) => {
  const insets = useSafeAreaInsets();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<string>('All');

  // Subscribe to overlay store for real-time active preset tracking
  useEffect(() => {
    const unsubscribe = overlayStore.subscribe((state) => {
      setActiveId(state.presetId);
    });
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

  // Filter presets by selected category
  const filteredPresets = filterTab === 'All'
    ? presets
    : presets.filter(p => {
        const cat = (p.category || '').charAt(0).toUpperCase() + (p.category || '').slice(1);
        return cat === filterTab || p.category === filterTab;
      });

  // Long press to show actions
  const showActions = (item: FilterPreset) => {
    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Apply', onPress: () => apply(item) },
      { text: 'Duplicate', onPress: () => duplicate(item) },
    ];
    if (!item.isBuiltIn) {
      actions.push({
        text: 'Delete', onPress: () => remove(item.id, item.name), style: 'destructive',
      });
    }
    actions.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(item.name, undefined, actions);
  };

  const renderItem = ({ item }: { item: FilterPreset }) => {
    const isActive = activeId === item.id;
    const categoryLabel = (item.category || '').charAt(0).toUpperCase() + (item.category || '').slice(1);

    return (
      <TouchableOpacity
        style={[
          ps.card,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: colors.voidDeep,
            borderColor: isActive ? colors.accentAmber : colors.voidRim,
            borderWidth: isActive ? 2 : 1,
          },
        ]}
        onPress={() => apply(item)}
        onLongPress={() => showActions(item)}
        activeOpacity={0.7}
        accessibilityLabel={`${item.name} filter, ${pctStr(item.opacity)}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        {/* Color swatch — top 60%, rounded only top-left and top-right */}
        <View style={[ps.swatch, { height: SWATCH_HEIGHT }]}>
          <View style={[
            ps.swatchInner,
            {
              backgroundColor: item.color,
              opacity: Math.min(item.opacity, 1.0),
              borderTopLeftRadius: R.radiusLg - 1,
              borderTopRightRadius: R.radiusLg - 1,
            },
          ]} />
          {item.opacity > 1.0 && (
            <View style={[
              ps.swatchOverlay,
              {
                backgroundColor: item.color,
                opacity: item.opacity - 1.0,
                borderTopLeftRadius: R.radiusLg - 1,
                borderTopRightRadius: R.radiusLg - 1,
              },
            ]} />
          )}
          {/* Active indicator */}
          {isActive && (
            <View style={ps.activeBadge}>
              <Icon name="check-circle" size={18} color={colors.accentAmber} />
            </View>
          )}
        </View>

        {/* Info section — bottom 40% */}
        <View style={ps.info}>
          <Text style={ps.nameText} numberOfLines={1}>{item.name}</Text>
          <Text style={ps.metaText} numberOfLines={1}>
            <Text style={ps.monoNum}>{pctStr(item.opacity)}</Text>
            {' \u00B7 '}
            {categoryLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[ps.root, { backgroundColor: colors.voidBlack }]}>
      <FlatList
        data={filteredPresets}
        renderItem={renderItem}
        keyExtractor={item => `preset-${item.id}`}
        numColumns={2}
        columnWrapperStyle={ps.row}
        contentContainerStyle={{
          paddingTop: insets.top + S.s4,
          paddingBottom: insets.bottom + S.s8 + S.s16,
          paddingHorizontal: H_PADDING,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: S.s4 }}>
            <Text style={ps.title}>Filter Library</Text>
            <Text style={ps.subtitle}>
              {presets.length} filters · Tap to apply · Long press for options
            </Text>

            {/* Category filter pills — horizontally scrollable */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={ps.filterScroll}
              contentContainerStyle={ps.filterRow}
            >
              {CATEGORY_TABS.map(tab => {
                const isActive = filterTab === tab.key;
                const count = tab.key === 'All'
                  ? presets.length
                  : presets.filter(p => {
                      const cat = (p.category || '').charAt(0).toUpperCase() + (p.category || '').slice(1);
                      return cat === tab.key || p.category === tab.key;
                    }).length;
                return (
                  <TouchableOpacity
                    key={`cat-${tab.key}`}
                    style={[
                      ps.filterPill,
                      {
                        backgroundColor: isActive ? colors.accentAmber : colors.voidRim,
                        borderColor: isActive ? colors.accentAmber : colors.voidGhost,
                      },
                    ]}
                    onPress={() => setFilterTab(tab.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[
                      ps.filterPillText,
                      { color: isActive ? colors.voidBlack : colors.textSecondary },
                    ]}>
                      {tab.label}
                    </Text>
                    <Text style={[
                      ps.filterPillCount,
                      { color: isActive ? colors.voidBlack : colors.textMuted },
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  title: {
    ...T.heading1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...T.bodySm,
    color: colors.textSecondary,
    marginTop: S.s1,
  },
  filterScroll: {
    marginTop: S.s3,
    marginBottom: S.s2,
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: S.s2,
    paddingRight: S.s4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.s3,
    paddingVertical: S.s2,
    borderRadius: R.radiusPill,
    borderWidth: 1,
    gap: S.s1,
    minHeight: S.s10,
  },
  filterPillText: {
    ...T.labelSm,
    fontWeight: '600',
  },
  filterPillCount: {
    ...T.labelSm,
    fontWeight: '500',
    opacity: 0.7,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    borderRadius: R.radiusLg,
    overflow: 'hidden',
  },
  swatch: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  swatchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  activeBadge: {
    position: 'absolute',
    top: S.s1,
    right: S.s1,
  },
  info: {
    flex: 1,
    paddingHorizontal: S.s3,
    paddingVertical: S.s2,
    justifyContent: 'center',
  },
  nameText: {
    ...T.bodySm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  metaText: {
    ...T.labelSm,
    color: colors.textMuted,
    marginTop: S.s05,
  },
  monoNum: {
    ...T.monoNum,
    fontSize: T.labelSm.size,
    lineHeight: T.labelSm.line,
    color: colors.textSecondary,
  },
});

export default PresetsScreen;
