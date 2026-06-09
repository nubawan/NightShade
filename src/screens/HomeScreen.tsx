/**
 * NightShade V5 — Home Screen
 * Uses OverlayStateStore as single source of truth.
 * State changes from bubble/notification/tile propagate here automatically.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, Switch, BrightnessCard, PresetChip } from '../components/AppComponents';
import { S, T, R, QUICK_COLORS } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { FilterPreset } from '../types';
import { overlayStore } from '../services/OverlayStateStore';
import { storageService } from '../services/StorageService';
import { pctStr, debounce, colorLabel, getBrightnessLabel } from '../utils/helpers';

interface Props {
  onCreateFilter: () => void;
  onColorPicker: () => void;
}

const HomeScreen: React.FC<Props> = ({ onCreateFilter, onColorPicker }) => {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(() => overlayStore.getState());
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const heroScale = useRef(new Animated.Value(1)).current;

  // Subscribe to OverlayStateStore — updates from ANY source (bubble, notification, tile, this screen)
  useEffect(() => {
    const unsubscribe = overlayStore.subscribe((state) => {
      setSettings(state);
    });
    // Initial sync from native
    overlayStore.syncFromNative().then(() => setLoading(false));
    // Load presets
    storageService.getPresets().then(setPresets);
    return unsubscribe;
  }, []);

  // Periodic preset reload (for changes from other screens)
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await storageService.getPresets();
      setPresets(prev => {
        if (fresh.length !== prev.length) return fresh;
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const save = useRef(debounce(async () => {
    await storageService.saveOverlaySettings(overlayStore.getState());
  }, 300)).current;

  const toggle = useCallback(async () => {
    Animated.sequence([
      Animated.timing(heroScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(heroScale, { toValue: 1, damping: 0.6, useNativeDriver: true }),
    ]).start();
    await overlayStore.toggle();
    save();
  }, [heroScale, save]);

  const onOpacity = useCallback((o: number) => {
    // Optimistic local update for smooth slider
    setSettings(prev => ({ ...prev, opacity: o }));
  }, []);

  const onOpacityDone = useCallback(async (o: number) => {
    await overlayStore.setOpacity(o);
    save();
  }, [save]);

  const applyPreset = useCallback(async (p: FilterPreset) => {
    await overlayStore.applyPreset(p.id, p.opacity, p.color);
    save();
  }, [save]);

  const selectColor = useCallback(async (color: string) => {
    await overlayStore.setColor(color);
    save();
  }, [save]);

  if (loading) return <View style={[styles.root, { backgroundColor: palette.background }]} />;

  const activePreset = presets.find(p => p.id === settings.presetId);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + S.s4,
        paddingBottom: insets.bottom + S.s8 + S.s16,
        paddingHorizontal: S.s4,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Toggle Card */}
      <Animated.View style={{ transform: [{ scale: heroScale }] }}>
        <Card style={{
          backgroundColor: settings.enabled ? palette.primaryContainer : palette.surfaceContainer,
        }}>
          <View style={styles.heroRow}>
            <View style={styles.heroInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.s2 }}>
                <Icon
                  name={settings.enabled ? 'moon-waning-crescent' : 'weather-sunny'}
                  size={28}
                  color={settings.enabled ? palette.primary : palette.onSurfaceVariant}
                />
                <Text style={{
                  ...T.headline,
                  color: settings.enabled ? palette.onPrimaryContainer : palette.onSurface,
                  fontWeight: '700',
                }}>
                  NightShade
                </Text>
              </View>
              <Text style={{
                ...T.bodyM,
                color: settings.enabled ? palette.primary : palette.onSurfaceVariant,
                marginTop: S.s1,
                marginLeft: S.s8,
              }}>
                {settings.enabled ? 'Active' : 'Inactive'}{activePreset ? ` · ${activePreset.name}` : ''}
              </Text>
            </View>
            <Switch value={settings.enabled} onValueChange={toggle} accessibilityLabel="Toggle filter" />
          </View>

          {settings.enabled && (
            <View style={[styles.heroDetails, { borderTopColor: palette.outlineVariant }]}>
              <View style={styles.detailItem}>
                <Text style={{ ...T.labelS, color: palette.onSurfaceVariant }}>Dim Level</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: S.s1 }}>
                  <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '600' }}>
                    {pctStr(settings.opacity)}
                  </Text>
                  <Text style={{ ...T.labelS, color: palette.primary }}>
                    {getBrightnessLabel(settings.opacity)}
                  </Text>
                </View>
              </View>
              <View style={[styles.detailDiv, { backgroundColor: palette.outlineVariant }]} />
              <View style={styles.detailItem}>
                <Text style={{ ...T.labelS, color: palette.onSurfaceVariant }}>Filter</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.s1 }}>
                  <View style={{
                    width: 12, height: 12, borderRadius: 6,
                    backgroundColor: settings.color,
                    borderWidth: 1, borderColor: palette.outline,
                  }} />
                  <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '600' }}>
                    {colorLabel(settings.color)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Brightness Card */}
      <View style={{ marginTop: S.s3 }}>
        <BrightnessCard opacity={settings.opacity} onValueChange={onOpacity} onSlidingComplete={onOpacityDone} />
      </View>

      {/* Color Quick Select */}
      <Card style={{ marginTop: S.s3 }}>
        <View style={styles.colorHeader}>
          <Icon name="palette" size={18} color={palette.primary} />
          <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '600', marginLeft: S.s1 }}>Filter Color</Text>
        </View>
        <View style={styles.colorRow}>
          {QUICK_COLORS.map(qc => (
            <TouchableOpacity
              key={`qc-${qc.color}-${qc.label}`}
              style={[
                styles.colorBtn,
                {
                  backgroundColor: qc.color,
                  borderColor: settings.color === qc.color ? palette.primary : 'transparent',
                  borderWidth: 2,
                },
              ]}
              onPress={() => selectColor(qc.color)}
              accessibilityLabel={`${qc.label} filter`}
              accessibilityRole="button"
            >
              <Text style={{
                ...T.labelS,
                color: ['#000000', '#1A1A1A', '#0D1B2A', '#1A1A2E', '#3E2723'].includes(qc.color) ? '#FFF' : '#000',
                fontWeight: '600',
              }}>
                {qc.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            key="qc-custom"
            style={[styles.colorBtn, { backgroundColor: palette.surfaceContainerHigh, borderColor: palette.outlineVariant, borderWidth: 1 }]}
            onPress={onColorPicker}
            accessibilityLabel="Custom color"
          >
            <Icon name="eyedropper" size={16} color={palette.primary} />
            <Text style={{ ...T.labelS, color: palette.primary, fontWeight: '600', marginLeft: 2 }}>Custom</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Quick Presets */}
      <View style={{ marginTop: S.s6 }}>
        <View style={styles.presetsHeader}>
          <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '600' }}>Quick Presets</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.s2, paddingBottom: S.s2 }}>
          {presets.slice(0, 8).map(p => (
            <PresetChip key={`preset-${p.id}`} name={p.name} color={p.color} active={settings.presetId === p.id} onPress={() => applyPreset(p)} />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroInfo: { flex: 1 },
  heroDetails: { flexDirection: 'row', marginTop: S.s4, paddingTop: S.s4, borderTopWidth: 1 },
  detailItem: { flex: 1 },
  detailDiv: { width: 1, marginHorizontal: S.s4 },
  colorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: S.s3 },
  colorRow: { flexDirection: 'row', gap: S.s2, flexWrap: 'wrap' },
  colorBtn: {
    paddingHorizontal: S.s3, paddingVertical: S.s2,
    borderRadius: R.xl, minHeight: S.s10,
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row',
  },
  presetsHeader: { marginBottom: S.s2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

export default HomeScreen;
