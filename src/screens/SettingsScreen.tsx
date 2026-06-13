/**
 * NightShade V4 — Settings Screen (Accordion Layout)
 * Only one section expanded at a time. Clean, organized, professional.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, Switch, AccordionSection } from '../components/AppComponents';
import { S, T, R } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, SettingsSection } from '../types';
import { storageService } from '../services/StorageService';
import { overlayService } from '../services/OverlayService';
import { openBattery } from '../utils/helpers';

const SettingsScreen: React.FC = () => {
  const { palette, theme, setTheme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Accordion state — only one section expanded at a time
  const [expanded, setExpanded] = useState<SettingsSection | null>('appearance');

  const toggleSection = (s: SettingsSection) => {
    setExpanded(prev => prev === s ? null : s);
  };

  // Settings state
  const [autoStart, setAutoStart] = useState(false);
  const [restoreFilter, setRestoreFilter] = useState(true);
  const [notifControls, setNotifControls] = useState(true);
  const [floatingBubble, setFloatingBubble] = useState(false);

  useEffect(() => {
    (async () => {
      setAutoStart(await storageService.getAutoStart());
      setRestoreFilter(await storageService.getRestoreFilter());
      setNotifControls(await storageService.getNotificationControls());
      setFloatingBubble(await storageService.getFloatingWidget());
    })();
  }, []);

  const handleBubble = useCallback(async (v: boolean) => {
    setFloatingBubble(v);
    await storageService.setFloatingWidget(v);
    await storageService.setBubbleEnabled(v);
    try { if (v) await overlayService.showBubble(); else await overlayService.hideBubble(); } catch {}
  }, []);

  const showBatteryGuide = (mfr: string) => {
    const guides: Record<string, string> = {
      Samsung: '1. Settings → Apps → ⋮ → Special Access\n2. Optimize battery usage → All apps\n3. NightShade → "Don\'t optimize"',
      Xiaomi: '1. Settings → Apps → Manage Apps → NightShade\n2. Battery Saver → No restrictions\n3. Enable Autostart',
      Oppo: '1. Settings → Battery → Advanced Settings\n2. NightShade → Disable optimization\n3. Enable Autostart',
      Vivo: '1. Settings → More Settings → Applications → NightShade\n2. Disable battery optimization\n3. Allow Autostart',
      Huawei: '1. Settings → Apps → NightShade → Battery → Launch\n2. Set to "Manage manually"\n3. Enable all three options',
    };
    Alert.alert(`${mfr} Battery Guide`, guides[mfr] || 'Disable battery optimization for NightShade.');
  };

  return (
    <ScrollView
      style={[ss.root, { backgroundColor: palette.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + S.s4,
        paddingBottom: insets.bottom + S.s8 + S.s16,
        paddingHorizontal: S.s4,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ ...T.headline, color: palette.onSurface, fontWeight: '700', marginBottom: S.s6 }}>Settings</Text>

      {/* ─── Appearance ─────────────────────────────────────────── */}
      <AccordionSection
        title="Appearance"
        icon="palette-outline"
        expanded={expanded === 'appearance'}
        onToggle={() => toggleSection('appearance')}
      >
        <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginBottom: S.s3 }}>
          Choose how NightShade looks. System follows your device's dark mode setting.
        </Text>
        <View style={ss.themeRow}>
          {([
            { value: 'system' as AppTheme, label: 'System', icon: 'theme-light-dark' },
            { value: 'light' as AppTheme, label: 'Light', icon: 'weather-sunny' },
            { value: 'dark' as AppTheme, label: 'Dark', icon: 'moon-waning-crescent' },
          ]).map(t => (
            <TouchableOpacity
              key={t.value}
              style={[
                ss.themeBtn,
                {
                  backgroundColor: theme === t.value ? palette.primary : palette.surfaceContainerHigh,
                  borderColor: theme === t.value ? palette.primary : palette.outlineVariant,
                },
              ]}
              onPress={() => setTheme(t.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: theme === t.value }}
            >
              <Icon name={t.icon} size={20} color={theme === t.value ? palette.onPrimary : palette.onSurfaceVariant} />
              <Text style={{
                ...T.labelM,
                color: theme === t.value ? palette.onPrimary : palette.onSurfaceVariant,
                fontWeight: '600',
                marginTop: S.s05,
              }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AccordionSection>

      {/* ─── Overlay Controls ────────────────────────────────────── */}
      <AccordionSection
        title="Overlay Controls"
        icon="layer-outline"
        expanded={expanded === 'overlay'}
        onToggle={() => toggleSection('overlay')}
      >
        <Switch value={floatingBubble} onValueChange={handleBubble} label="Floating Bubble" accessibilityLabel="Floating bubble toggle" />
        <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant, marginLeft: 0, marginBottom: S.s3 }}>
          Quick-access bubble overlay. Tap to show mini panel with brightness slider and toggle.
        </Text>
        <View style={{ height: 1, backgroundColor: palette.outlineVariant, marginVertical: S.s2 }} />
        <Switch value={notifControls} onValueChange={async v => { setNotifControls(v); await storageService.setNotificationControls(v); }} label="Notification Controls" accessibilityLabel="Notification controls" />
        <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant, marginLeft: 0 }}>
          Show brightness slider and filter toggle in the persistent notification.
        </Text>
      </AccordionSection>

      {/* ─── Startup ─────────────────────────────────────────────── */}
      <AccordionSection
        title="Startup"
        icon="rocket-launch-outline"
        expanded={expanded === 'startup'}
        onToggle={() => toggleSection('startup')}
      >
        <Switch value={autoStart} onValueChange={async v => { setAutoStart(v); await storageService.setAutoStart(v); }} label="Start on Boot" accessibilityLabel="Auto start on boot" />
        <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant, marginLeft: 0, marginBottom: S.s3 }}>
          Automatically restore the last active filter when your device restarts.
        </Text>
        <View style={{ height: 1, backgroundColor: palette.outlineVariant, marginVertical: S.s2 }} />
        <Switch value={restoreFilter} onValueChange={async v => { setRestoreFilter(v); await storageService.setRestoreFilter(v); }} label="Restore Previous Filter" accessibilityLabel="Restore filter" />
        <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant, marginLeft: 0 }}>
          When you open NightShade, restore the filter state from your last session.
        </Text>
      </AccordionSection>

      {/* ─── Advanced ────────────────────────────────────────────── */}
      <AccordionSection
        title="Advanced"
        icon="wrench-outline"
        expanded={expanded === 'advanced'}
        onToggle={() => toggleSection('advanced')}
      >
        <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginBottom: S.s3 }}>
          Battery optimization can kill NightShade's overlay service. Disable it for reliable operation.
        </Text>
        {['Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei'].map((m, i, a) => (
          <React.Fragment key={m}>
            <TouchableOpacity style={ss.battRow} onPress={() => showBatteryGuide(m)}>
              <Text style={{ ...T.bodyM, color: palette.onSurface }}>{m}</Text>
              <Icon name="chevron-right" size={20} color={palette.onSurfaceVariant} />
            </TouchableOpacity>
            {i < a.length - 1 && <View style={{ height: 1, backgroundColor: palette.outlineVariant }} />}
          </React.Fragment>
        ))}
        <TouchableOpacity
          style={[ss.battBtn, { backgroundColor: palette.surfaceContainerHigh, borderColor: palette.outline }]}
          onPress={openBattery}
        >
          <Icon name="battery-outline" size={18} color={palette.primary} />
          <Text style={{ color: palette.primary, ...T.labelL, fontWeight: '600', marginLeft: S.s2 }}>Open Battery Settings</Text>
        </TouchableOpacity>

        {/* Permissions */}
        <View style={{ height: 1, backgroundColor: palette.outlineVariant, marginVertical: S.s4 }} />
        <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginBottom: S.s3 }}>
          NightShade requires overlay permission to draw the screen filter.
        </Text>
        <TouchableOpacity
          style={[ss.battBtn, { backgroundColor: palette.surfaceContainerHigh, borderColor: palette.outline }]}
          onPress={async () => {
            const has = await overlayService.hasPermission();
            if (!has) await overlayService.requestPermission();
          }}
        >
          <Icon name="shield-check-outline" size={18} color={palette.primary} />
          <Text style={{ color: palette.primary, ...T.labelL, fontWeight: '600', marginLeft: S.s2 }}>Check Overlay Permission</Text>
        </TouchableOpacity>
      </AccordionSection>

      {/* ─── About ───────────────────────────────────────────────── */}
      <Card style={{ marginTop: S.s6 }}>
        <View style={ss.aboutHeader}>
          <Icon name="moon-waning-crescent" size={24} color={palette.primary} />
          <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '700', marginLeft: S.s2 }}>NightShade</Text>
        </View>
        {[
          { label: 'Version', value: '3.0.0' },
          { label: 'Engine', value: 'WindowManager Overlay' },
          { label: 'Design', value: 'Material Design 3' },
          { label: 'Max Brightness', value: '180% Safe Extended' },
        ].map((item, i, a) => (
          <React.Fragment key={item.label}>
            <View style={ss.aboutRow}>
              <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant }}>{item.label}</Text>
              <Text style={{ ...T.bodyM, color: palette.onSurface, fontWeight: '500' }}>{item.value}</Text>
            </View>
            {i < a.length - 1 && <View style={{ height: 1, backgroundColor: palette.outlineVariant }} />}
          </React.Fragment>
        ))}
      </Card>
    </ScrollView>
  );
};

const ss = StyleSheet.create({
  root: { flex: 1 },
  themeRow: { flexDirection: 'row', gap: S.s2 },
  themeBtn: {
    flex: 1, paddingVertical: S.s3, borderRadius: R.md,
    alignItems: 'center', borderWidth: 1, minHeight: S.s14,
    justifyContent: 'center',
  },
  battRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: S.s3, minHeight: S.s12 },
  battBtn: { flexDirection: 'row', borderRadius: R.md, paddingVertical: S.s3, alignItems: 'center', borderWidth: 1, minHeight: S.s12, justifyContent: 'center', marginTop: S.s3 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: S.s3 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: S.s3 },
});

export default SettingsScreen;
