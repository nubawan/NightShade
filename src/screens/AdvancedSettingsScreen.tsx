import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Linking, useColorScheme,
} from 'react-native';
import Toggle from '../components/Toggle';
import { getThemeColors, Spacing, Typography, Shape } from '../theme';
import { storageService } from '../services/StorageService';
import { overlayService } from '../services/OverlayService';
import { openBatterySettings } from '../utils/helpers';
import { AppTheme } from '../types';

interface AdvancedSettingsScreenProps {
  onBack: () => void;
}

const AdvancedSettingsScreen: React.FC<AdvancedSettingsScreenProps> = ({ onBack }) => {
  const systemDark = useColorScheme() === 'dark';
  const colors = getThemeColors('system', systemDark);

  const [autoStart, setAutoStart] = useState(false);
  const [restoreFilter, setRestoreFilter] = useState(true);
  const [notificationControls, setNotificationControls] = useState(true);
  const [floatingWidget, setFloatingWidget] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>('system');

  useEffect(() => {
    (async () => {
      setAutoStart(await storageService.getAutoStart());
      setRestoreFilter(await storageService.getRestorePreviousFilter());
      setNotificationControls(await storageService.getNotificationControls());
      setFloatingWidget(await storageService.getFloatingWidget());
      setAppTheme(await storageService.getAppTheme());
    })();
  }, []);

  const handleAutoStart = async (val: boolean) => {
    setAutoStart(val);
    await storageService.setAutoStart(val);
  };

  const handleRestoreFilter = async (val: boolean) => {
    setRestoreFilter(val);
    await storageService.setRestorePreviousFilter(val);
  };

  const handleNotification = async (val: boolean) => {
    setNotificationControls(val);
    await storageService.setNotificationControls(val);
  };

  const handleFloatingWidget = async (val: boolean) => {
    setFloatingWidget(val);
    await storageService.setFloatingWidget(val);
    try {
      if (val) { await overlayService.showBubble(); }
      else { await overlayService.hideBubble(); }
    } catch {}
  };

  const handleThemeChange = async (theme: AppTheme) => {
    setAppTheme(theme);
    await storageService.setAppTheme(theme);
  };

  const showBatteryGuide = (manufacturer: string) => {
    const guides: Record<string, string> = {
      Samsung: '1. Settings → Apps → ⋮ → Special Access\n2. Optimize battery usage → All apps\n3. Find NightShade → "Don\'t optimize"',
      Xiaomi: '1. Settings → Apps → Manage Apps → NightShade\n2. Battery Saver → No restrictions\n3. Enable Autostart',
      Oppo: '1. Settings → Battery → Advanced Settings\n2. Find NightShade → Disable optimization\n3. Enable Autostart in App Management',
      Vivo: '1. Settings → More Settings → Applications → NightShade\n2. Disable battery optimization\n3. Allow Autostart',
      Huawei: '1. Settings → Apps → NightShade → Battery → Launch\n2. Set to "Manage manually"\n3. Enable all three options',
    };
    Alert.alert(`${manufacturer} Battery Guide`, guides[manufacturer] || 'Disable battery optimization for NightShade in your device settings.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Appearance ──────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.settingName, { color: colors.onSurface }]}>Theme</Text>
          <View style={styles.themeRow}>
            {(['system', 'light', 'dark'] as AppTheme[]).map(theme => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: appTheme === theme ? colors.primary : colors.surfaceContainerHigh,
                    borderColor: appTheme === theme ? colors.primary : colors.outlineVariant,
                  },
                ]}
                onPress={() => handleThemeChange(theme)}
                accessibilityRole="radio"
                accessibilityState={{ checked: appTheme === theme }}>
                <Text style={{
                  ...Typography.labelMedium,
                  fontWeight: '600',
                  color: appTheme === theme ? colors.onPrimary : colors.onSurfaceVariant,
                  textTransform: 'capitalize',
                }}>
                  {theme === 'system' ? '⚡ System' : theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Controls ────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Controls</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingName, { color: colors.onSurface }]}>Floating Bubble</Text>
              <Text style={[styles.settingDesc, { color: colors.onSurfaceVariant }]}>
                Movable bubble on screen. Tap for mini controls, double-tap to toggle, long-press to open app.
              </Text>
            </View>
            <Toggle enabled={floatingWidget} onToggle={() => handleFloatingWidget(!floatingWidget)} accessibilityLabel="Floating bubble" />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingName, { color: colors.onSurface }]}>Notification Controls</Text>
              <Text style={[styles.settingDesc, { color: colors.onSurfaceVariant }]}>
                Persistent notification with brightness +/-, toggle, and quick presets.
              </Text>
            </View>
            <Toggle enabled={notificationControls} onToggle={() => handleNotification(!notificationControls)} accessibilityLabel="Notification controls" />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingName, { color: colors.onSurface }]}>Quick Settings Tile</Text>
              <Text style={[styles.settingDesc, { color: colors.onSurfaceVariant }]}>
                Toggle filter from Android quick settings panel without opening the app.
              </Text>
            </View>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.tertiaryContainer }]}>
              <Text style={[styles.comingSoonText, { color: colors.onTertiaryContainer }]}>Enabled</Text>
            </View>
          </View>
        </View>

        {/* ── Startup ─────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Startup</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingName, { color: colors.onSurface }]}>Start on Boot</Text>
              <Text style={[styles.settingDesc, { color: colors.onSurfaceVariant }]}>
                Automatically start the filter service when your device restarts.
              </Text>
            </View>
            <Toggle enabled={autoStart} onToggle={() => handleAutoStart(!autoStart)} accessibilityLabel="Auto start on boot" />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingName, { color: colors.onSurface }]}>Restore Previous Filter</Text>
              <Text style={[styles.settingDesc, { color: colors.onSurfaceVariant }]}>
                Remember and restore your last filter settings when the app opens.
              </Text>
            </View>
            <Toggle enabled={restoreFilter} onToggle={() => handleRestoreFilter(!restoreFilter)} accessibilityLabel="Restore previous filter" />
          </View>
        </View>

        {/* ── Battery Optimization ─────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Battery Optimization</Text>
        <Text style={[styles.sectionDesc, { color: colors.onSurfaceVariant }]}>
          Some manufacturers kill background services. Follow the guide for your device if the filter stops unexpectedly.
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          {['Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei'].map((mfr, i, arr) => (
            <React.Fragment key={mfr}>
              <TouchableOpacity style={styles.batteryRow} onPress={() => showBatteryGuide(mfr)}>
                <Text style={[styles.batteryName, { color: colors.onSurface }]}>{mfr}</Text>
                <Text style={[styles.batteryArrow, { color: colors.onSurfaceVariant }]}>→</Text>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
            </React.Fragment>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.batteryBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}
          onPress={openBatterySettings}>
          <Text style={[styles.batteryBtnText, { color: colors.primary }]}>Open Battery Settings</Text>
        </TouchableOpacity>

        {/* ── About ───────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>About</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.onSurfaceVariant }]}>App Name</Text>
            <Text style={[styles.aboutValue, { color: colors.onSurface }]}>NightShade</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.onSurfaceVariant }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.onSurface }]}>2.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.onSurfaceVariant }]}>Overlay Engine</Text>
            <Text style={[styles.aboutValue, { color: colors.onSurface }]}>WindowManager</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.onSurfaceVariant }]}>Architecture</Text>
            <Text style={[styles.aboutValue, { color: colors.onSurface }]}>MVVM + Clean</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.onSurfaceVariant }]}>Design</Text>
            <Text style={[styles.aboutValue, { color: colors.onSurface }]}>Material Design 3</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  backBtn: { padding: Spacing.sm, minHeight: 48, justifyContent: 'center' },
  backText: { ...Typography.labelLarge, fontWeight: '600' },
  headerTitle: { ...Typography.titleMedium, fontWeight: '700' },
  headerSpacer: { width: 60 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.huge },
  sectionTitle: {
    ...Typography.labelMedium, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: Spacing.sm,
  },
  sectionDesc: { ...Typography.bodySmall, lineHeight: 18, marginBottom: Spacing.sm },
  card: { borderRadius: Shape.lg, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg,
  },
  settingInfo: { flex: 1, marginRight: Spacing.lg },
  settingName: { ...Typography.bodyLarge, fontWeight: '500', marginBottom: 2 },
  settingDesc: { ...Typography.bodySmall, lineHeight: 18 },
  divider: { height: 1, marginHorizontal: Spacing.lg },
  themeRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingTop: Spacing.sm },
  themeOption: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Shape.md, alignItems: 'center',
    borderWidth: 1, minHeight: 48, justifyContent: 'center',
  },
  comingSoonBadge: {
    borderRadius: Shape.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  comingSoonText: { ...Typography.labelSmall, fontWeight: '600' },
  batteryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 52,
  },
  batteryName: { ...Typography.bodyMedium, fontWeight: '500' },
  batteryArrow: { fontSize: 16 },
  batteryBtn: {
    borderRadius: Shape.md, paddingVertical: Spacing.md, alignItems: 'center',
    marginTop: Spacing.sm, borderWidth: 1, minHeight: 48, justifyContent: 'center',
  },
  batteryBtnText: { ...Typography.labelLarge, fontWeight: '600' },
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  aboutLabel: { ...Typography.bodyMedium },
  aboutValue: { ...Typography.bodyMedium, fontWeight: '500' },
});

export default AdvancedSettingsScreen;
