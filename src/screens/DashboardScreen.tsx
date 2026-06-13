import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useColorScheme,
} from 'react-native';
import Toggle from '../components/Toggle';
import { BrightnessCard } from '../components/AppComponents';
import ColorSelector from '../components/ColorSelector';
import PresetChip from '../components/PresetChip';
import { getThemeColors, Spacing, Typography, Shape, Animation } from '../theme';
import { OverlaySettings, Preset } from '../types';
import { overlayService } from '../services/OverlayService';
import { storageService } from '../services/StorageService';
import { pctStr, getColorName, debounce } from '../utils/helpers';

interface DashboardScreenProps {
  onNavigatePresets: () => void;
  onNavigateAdvanced: () => void;
  onNavigateColorPicker: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigatePresets,
  onNavigateAdvanced,
  onNavigateColorPicker,
}) => {
  const [settings, setSettings] = useState<OverlaySettings>({
    enabled: false,
    opacity: 0.3,
    color: '#000000',
    presetId: null,
  });
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
  const [quickPresets, setQuickPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);

  // Animation refs
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const statusFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await storageService.getOverlaySettings();
        const isEnabled = await overlayService.isOverlayEnabled();
        setSettings({ ...saved, enabled: isEnabled });
        if (saved.presetId) {
          const presets = await storageService.getPresets();
          const active = presets.find(p => p.id === saved.presetId);
          if (active) setActivePresetName(active.name);
        }
        const presets = await storageService.getPresets();
        setQuickPresets(presets);
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
        Animated.timing(statusFadeAnim, {
          toValue: 1,
          duration: Animation.durationMedium,
          useNativeDriver: true,
        }).start();
      }
    };
    load();
  }, [statusFadeAnim]);

  // Debounced save
  const debouncedSave = useRef(
    debounce((s: OverlaySettings) => {
      storageService.saveOverlaySettings(s);
    }, 300)
  ).current;

  useEffect(() => {
    if (!loading) debouncedSave(settings);
  }, [settings, loading, debouncedSave]);

  const handleToggle = useCallback(async () => {
    const newEnabled = !settings.enabled;
    // Animate the hero card
    Animated.sequence([
      Animated.timing(cardScaleAnim, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        damping: Animation.springDamping,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (newEnabled) {
        await overlayService.updateOverlay({ ...settings, enabled: true });
      } else {
        await overlayService.disableOverlay();
      }
      setSettings(prev => ({ ...prev, enabled: newEnabled }));
      await overlayService.updateTileState(newEnabled);
    } catch (e) {
      console.error('Toggle overlay failed:', e);
    }
  }, [settings, cardScaleAnim]);

  const handleOpacityChange = useCallback((opacity: number) => {
    setSettings(prev => ({ ...prev, opacity }));
  }, []);

  const debouncedOverlayUpdate = useRef(
    debounce(async (opacity: number, enabled: boolean) => {
      if (enabled) {
        try { await overlayService.setOpacity(opacity); } catch {}
      }
    }, 50)
  ).current;

  const handleOpacityComplete = useCallback(async (opacity: number) => {
    if (settings.enabled) {
      try { await overlayService.setOpacity(opacity); } catch {}
    }
  }, [settings.enabled]);

  const handleColorSelect = useCallback(async (color: string) => {
    setSettings(prev => ({ ...prev, color, presetId: null }));
    setActivePresetName(null);
    if (settings.enabled) {
      try { await overlayService.setColor(color); } catch {}
    }
  }, [settings.enabled]);

  const handlePresetPress = useCallback(async (preset: Preset) => {
    try {
      const newSettings: OverlaySettings = {
        enabled: true,
        opacity: preset.opacity,
        color: preset.color,
        presetId: preset.id,
      };
      await overlayService.updateOverlay(newSettings);
      await overlayService.updateTileState(true);
      setSettings(newSettings);
      setActivePresetName(preset.name);
    } catch (e) {
      console.error('Apply preset failed:', e);
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.onSurfaceVariant }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Hero Card ─────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.heroCard,
          {
            backgroundColor: settings.enabled ? colors.primaryContainer : colors.surfaceContainer,
            transform: [{ scale: cardScaleAnim }],
            opacity: statusFadeAnim,
          },
        ]}>
        <View style={styles.heroRow}>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroTitle, { color: settings.enabled ? colors.onPrimaryContainer : colors.onSurface }]}>
              NightShade
            </Text>
            <Text style={[styles.heroStatus, { color: settings.enabled ? colors.primary : colors.onSurfaceVariant }]}>
              {settings.enabled ? 'Active' : 'Inactive'}
              {activePresetName ? ` • ${activePresetName}` : ''}
            </Text>
          </View>
          <Toggle enabled={settings.enabled} onToggle={handleToggle} accessibilityLabel="Toggle screen filter" />
        </View>

        {settings.enabled && (
          <View style={[styles.heroDetails, { borderTopColor: colors.outlineVariant }]}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Dim Level</Text>
              <Text style={[styles.detailValue, { color: settings.enabled ? colors.onPrimaryContainer : colors.onSurface }]}>
                {pctStr(settings.opacity)}
              </Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Filter</Text>
              <View style={styles.detailColorRow}>
                <View style={[styles.detailColorDot, { backgroundColor: settings.color }]} />
                <Text style={[styles.detailValue, { color: settings.enabled ? colors.onPrimaryContainer : colors.onSurface }]}>
                  {getColorName(settings.color)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Brightness Card ───────────────────────────────────── */}
      <BrightnessCard
        opacity={settings.opacity}
        onValueChange={handleOpacityChange}
        onSlidingComplete={handleOpacityComplete}
      />

      {/* ── Filter Card ───────────────────────────────────────── */}
      <ColorSelector
        selectedColor={settings.color}
        onSelectColor={handleColorSelect}
        onCustomPress={onNavigateColorPicker}
      />

      {/* ── Presets Chips ─────────────────────────────────────── */}
      <View style={[styles.presetsCard, { backgroundColor: colors.surfaceContainer }]}>
        <View style={styles.presetsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Presets</Text>
          <TouchableOpacity onPress={onNavigatePresets} accessibilityLabel="Manage presets">
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {quickPresets.map(preset => (
            <PresetChip
              key={preset.id}
              preset={preset}
              isActive={settings.presetId === preset.id}
              onPress={handlePresetPress}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surfaceContainer }]}
          onPress={onNavigatePresets}
          accessibilityLabel="Create or manage presets">
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Presets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surfaceContainer }]}
          onPress={onNavigateAdvanced}
          accessibilityLabel="Open settings">
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surfaceContainer }]}
          onPress={onNavigateColorPicker}
          accessibilityLabel="Custom color picker">
          <Text style={styles.actionIcon}>🎨</Text>
          <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Colors</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hero Card
  heroCard: {
    borderRadius: Shape.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroInfo: { flex: 1 },
  heroTitle: {
    ...Typography.headlineSmall,
    fontWeight: '700',
  },
  heroStatus: {
    ...Typography.bodyMedium,
    marginTop: 2,
  },
  heroDetails: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  detailItem: { flex: 1 },
  detailDivider: { width: 1, marginHorizontal: Spacing.lg },
  detailLabel: {
    ...Typography.labelSmall,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.titleMedium,
    fontWeight: '600',
  },
  detailColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // Presets
  presetsCard: {
    borderRadius: Shape.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  presetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    fontWeight: '600',
  },
  seeAll: {
    ...Typography.labelMedium,
    fontWeight: '600',
  },
  chipsRow: {
    gap: Spacing.sm,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    borderRadius: Shape.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 80,
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 24 },
  actionLabel: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
});

export default DashboardScreen;
