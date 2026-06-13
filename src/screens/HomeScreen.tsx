/**
 * NightShade Revamp — Home Screen (Module C)
 * C1: Live Canvas Background — filter color + opacity blended over void-black
 * C2: Command Strip (Zone 1) — top ~40%, big percentage, status, toggle, stop
 * C3: Controls Zone (Zone 2) — bottom ~60%, brightness, filter strip, presets, quick actions
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { S, T, R, colors, QUICK_COLORS, E, ANIM } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { FilterPreset } from '../types';
import { overlayStore } from '../services/OverlayStateStore';
import { storageService } from '../services/StorageService';
import { pctStr, debounce, blendFilterOverBlack } from '../utils/helpers';

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
    overlayStore.syncFromNative().then(() => setLoading(false));
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
      Animated.timing(heroScale, {
        toValue: 0.97,
        duration: ANIM.fast * 0.5,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        damping: 0.6,
        useNativeDriver: true,
      }),
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

  // ─── C1: Live Canvas computation ────────────────────────────────
  const canvasBg = useMemo(
    () => settings.enabled
      ? blendFilterOverBlack(settings.color, settings.opacity)
      : colors.voidBlack,
    [settings.color, settings.opacity, settings.enabled],
  );

  // ─── Derived values ─────────────────────────────────────────────
  const activePreset = presets.find(p => p.id === settings.presetId);
  const percentageNum = Math.round(settings.opacity * 100);

  // Quick action preset lookups
  const nightReadingPreset = presets.find(p => p.name === 'Night Reading');
  const sleepPreset = presets.find(p => p.name === 'Sleep Mode');

  if (loading) {
    return <View style={[styles.root, { backgroundColor: colors.voidBlack }]} />;
  }

  return (
    <View style={styles.root}>
      {/* ─── C1: Live Canvas Background ─────────────────────────── */}
      <View style={[styles.liveCanvas, { backgroundColor: canvasBg }]} />

      {/* ─── C2: Command Strip — Zone 1 (Top ~40%) ──────────────── */}
      <View style={[styles.zone1, { paddingTop: insets.top + S.s4 }]}>
        {/* Top Row: Brand + Circle Toggle */}
        <View style={styles.zone1TopRow}>
          <Text style={styles.brandLabel}>NIGHTSHADE</Text>
          <TouchableOpacity
            onPress={toggle}
            style={[
              styles.circleToggle,
              settings.enabled && styles.circleToggleActive,
            ]}
            activeOpacity={0.7}
            accessibilityLabel="Toggle filter"
            accessibilityRole="switch"
            accessibilityState={{ checked: settings.enabled }}
          >
            <Icon
              name={settings.enabled ? 'moon-waning-crescent' : 'weather-sunny'}
              size={22}
              color={settings.enabled ? colors.accentAmber : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Big Percentage Display */}
        <View style={styles.percentageRow}>
          <Animated.Text
            style={[styles.percentageNum, { transform: [{ scale: heroScale }] }]}
          >
            {percentageNum}
          </Animated.Text>
          <Text style={styles.percentageSymbol}>%</Text>
        </View>

        {/* Status Label */}
        <Text
          style={[
            styles.statusLabel,
            { color: settings.enabled ? colors.statusOn : colors.statusOff },
          ]}
        >
          {settings.enabled ? 'FILTER ACTIVE' : 'FILTER OFF'}
        </Text>

        {/* Preset / Filter Info */}
        <Text style={styles.presetInfo} numberOfLines={1}>
          {activePreset
            ? `${activePreset.category} \u00B7 ${activePreset.name}`
            : settings.enabled
              ? 'Custom Filter'
              : 'No filter applied'}
        </Text>

        {/* STOP Button — only visible when filter is active */}
        {settings.enabled && (
          <TouchableOpacity
            style={[styles.stopButton, E.elevation1]}
            onPress={toggle}
            activeOpacity={0.8}
            accessibilityLabel="Stop filter"
            accessibilityRole="button"
          >
            <Text style={styles.stopButtonText}>STOP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── C3: Controls Zone — Zone 2 (Bottom ~60%) ───────────── */}
      <ScrollView
        style={styles.zone2}
        contentContainerStyle={[
          styles.zone2Content,
          { paddingBottom: insets.bottom + S.s8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Brightness Control ─────────────────────────────── */}
        <View style={styles.brightnessSection}>
          <View style={styles.brightnessHeader}>
            <Text style={styles.brightnessLabel}>DIM LEVEL</Text>
            <Text style={styles.brightnessValue}>{pctStr(settings.opacity)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1.80}
            step={0.01}
            value={settings.opacity}
            onValueChange={onOpacity}
            onSlidingComplete={onOpacityDone}
            minimumTrackTintColor={colors.accentAmber}
            maximumTrackTintColor={colors.voidRim}
            thumbTintColor={colors.accentAmber}
            accessibilityLabel="Dim level"
          />
          <View style={styles.sliderTicks}>
            <Text style={styles.tickLabel}>0%</Text>
            <Text style={styles.tickLabel}>100%</Text>
            <Text style={styles.tickLabel}>180%</Text>
          </View>
        </View>

        {/* ── 2. Filter Strip ───────────────────────────────────── */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterStripContent}
          >
            {QUICK_COLORS.map(qc => (
              <TouchableOpacity
                key={`fc-${qc.color}-${qc.label}`}
                style={[
                  styles.colorChip,
                  { backgroundColor: qc.color },
                  settings.color === qc.color && styles.colorChipSelected,
                ]}
                onPress={() => selectColor(qc.color)}
                onLongPress={() =>
                  Alert.alert(qc.label, `Color: ${qc.color}\nCategory: ${qc.category}`)
                }
                accessibilityLabel={`${qc.label} filter color`}
                accessibilityRole="button"
              />
            ))}
            {/* Custom color "+" button */}
            <TouchableOpacity
              style={styles.colorChipAdd}
              onPress={onColorPicker}
              accessibilityLabel="Custom color"
              accessibilityRole="button"
            >
              <Icon name="plus" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── 3. Presets Row ────────────────────────────────────── */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionLabel}>PRESETS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsStripContent}
          >
            {presets.slice(0, 12).map(p => (
              <TouchableOpacity
                key={`preset-${p.id}`}
                style={[
                  styles.presetCard,
                  settings.presetId === p.id && styles.presetCardActive,
                ]}
                onPress={() => applyPreset(p)}
                accessibilityLabel={`${p.name} preset`}
                accessibilityRole="button"
              >
                <View style={[styles.presetSwatch, { backgroundColor: p.color }]} />
                <Text style={styles.presetName} numberOfLines={1}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── 4. Quick Actions Row ──────────────────────────────── */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionPill}
              onPress={() => nightReadingPreset && applyPreset(nightReadingPreset)}
              activeOpacity={0.7}
              accessibilityLabel="Night Reading preset"
              accessibilityRole="button"
            >
              <Text style={styles.quickActionText}>Night Reading</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionPill}
              onPress={() => sleepPreset && applyPreset(sleepPreset)}
              activeOpacity={0.7}
              accessibilityLabel="Sleep preset"
              accessibilityRole="button"
            >
              <Text style={styles.quickActionText}>Sleep</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionPill}
              onPress={onCreateFilter}
              activeOpacity={0.7}
              accessibilityLabel="Custom filter"
              accessibilityRole="button"
            >
              <Text style={styles.quickActionText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.voidBlack,
  },

  // ─── C1: Live Canvas ──────────────────────────────────────────
  liveCanvas: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },

  // ─── C2: Zone 1 — Command Strip ───────────────────────────────
  zone1: {
    zIndex: 1,
    paddingHorizontal: S.s6,
    paddingBottom: S.s6,
    justifyContent: 'flex-end',
    flex: 0,
    height: '40%',
  },
  zone1TopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.s5,
  },
  brandLabel: {
    fontSize: T.labelLg.size,
    fontWeight: T.labelLg.weight as any,
    lineHeight: T.labelLg.line,
    letterSpacing: T.labelLg.letterSpacing,
    color: colors.textMuted,
    textTransform: 'uppercase',
  } as any,
  circleToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.voidMid,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.voidRim,
  },
  circleToggleActive: {
    borderColor: colors.accentAmberDim,
    backgroundColor: colors.voidDeep,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: S.s2,
  },
  percentageNum: {
    fontSize: T.displayXl.size,
    fontWeight: T.displayXl.weight as any,
    lineHeight: T.displayXl.line,
    letterSpacing: T.displayXl.letterSpacing,
    color: colors.textPrimary,
  } as any,
  percentageSymbol: {
    fontSize: T.heading2.size,
    fontWeight: T.heading2.weight as any,
    lineHeight: T.heading2.line,
    letterSpacing: T.heading2.letterSpacing,
    color: colors.textPrimary,
    marginLeft: S.s05,
  } as any,
  statusLabel: {
    fontSize: T.labelLg.size,
    fontWeight: T.labelLg.weight as any,
    lineHeight: T.labelLg.line,
    letterSpacing: T.labelLg.letterSpacing,
    marginTop: S.s3,
  } as any,
  presetInfo: {
    fontSize: T.bodyLg.size,
    fontWeight: T.bodyLg.weight as any,
    lineHeight: T.bodyLg.line,
    letterSpacing: T.bodyLg.letterSpacing,
    color: colors.textSecondary,
    marginTop: S.s1,
  } as any,
  stopButton: {
    backgroundColor: colors.danger,
    borderRadius: R.radiusPill,
    paddingHorizontal: S.s8,
    paddingVertical: S.s3,
    alignSelf: 'center',
    marginTop: S.s5,
  },
  stopButtonText: {
    fontSize: T.labelLg.size,
    fontWeight: '700',
    lineHeight: T.labelLg.line,
    letterSpacing: T.labelLg.letterSpacing,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },

  // ─── C3: Zone 2 — Controls ────────────────────────────────────
  zone2: {
    zIndex: 1,
    flex: 1,
    backgroundColor: colors.voidBlack,
    borderTopLeftRadius: R.radiusLg,
    borderTopRightRadius: R.radiusLg,
  },
  zone2Content: {
    paddingHorizontal: S.s6,
    paddingTop: S.s6,
  },

  // ── Brightness ───────────────────────────────────────────────
  brightnessSection: {
    // No card wrapper per spec
  },
  brightnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.s3,
  },
  brightnessLabel: {
    fontSize: T.labelLg.size,
    fontWeight: T.labelLg.weight as any,
    lineHeight: T.labelLg.line,
    letterSpacing: T.labelLg.letterSpacing,
    color: colors.textMuted,
    textTransform: 'uppercase',
  } as any,
  brightnessValue: {
    fontSize: T.monoNum.size,
    fontWeight: T.monoNum.weight as any,
    lineHeight: T.monoNum.line,
    letterSpacing: T.monoNum.letterSpacing,
    color: colors.textPrimary,
  } as any,
  slider: {
    width: '100%',
    height: S.s12,
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: S.s05,
  },
  tickLabel: {
    fontSize: T.labelSm.size,
    fontWeight: T.labelSm.weight as any,
    lineHeight: T.labelSm.line,
    letterSpacing: T.labelSm.letterSpacing,
    color: colors.textMuted,
  } as any,

  // ── Filter Strip ─────────────────────────────────────────────
  filterSection: {
    marginTop: S.s7,
  },
  filterStripContent: {
    gap: S.s3,
    paddingVertical: S.s2,
  },
  colorChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipSelected: {
    borderColor: colors.voidRim,
  },
  colorChipAdd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.voidMid,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.voidRim,
  },

  // ── Presets Row ──────────────────────────────────────────────
  presetsSection: {
    marginTop: S.s7,
  },
  sectionLabel: {
    fontSize: T.labelLg.size,
    fontWeight: T.labelLg.weight as any,
    lineHeight: T.labelLg.line,
    letterSpacing: T.labelLg.letterSpacing,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: S.s3,
  } as any,
  presetsStripContent: {
    gap: S.s3,
    paddingVertical: S.s1,
  },
  presetCard: {
    width: 80,
    height: 100,
    borderRadius: R.radiusMd,
    backgroundColor: colors.voidDeep,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
  },
  presetCardActive: {
    borderColor: colors.accentAmber,
  },
  presetSwatch: {
    width: '100%',
    height: 64,
  },
  presetName: {
    fontSize: T.bodySm.size,
    fontWeight: T.bodySm.weight as any,
    lineHeight: T.bodySm.line,
    letterSpacing: T.bodySm.letterSpacing,
    color: colors.textSecondary,
    marginTop: S.s1,
    textAlign: 'center',
    paddingHorizontal: S.s1,
  } as any,

  // ── Quick Actions ────────────────────────────────────────────
  quickActionsSection: {
    marginTop: S.s7,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: S.s3,
  },
  quickActionPill: {
    flex: 1,
    backgroundColor: colors.voidMid,
    borderRadius: R.radiusPill,
    paddingVertical: S.s3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.voidRim,
  },
  quickActionText: {
    fontSize: T.labelLg.size,
    fontWeight: T.labelLg.weight as any,
    lineHeight: T.labelLg.line,
    letterSpacing: T.labelLg.letterSpacing,
    color: colors.textPrimary,
  } as any,
});

export default HomeScreen;
