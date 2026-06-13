/**
 * NightShade Revamp — Settings Screen (Module F3)
 * Clean list layout with Void Architecture design tokens.
 * No AccordionSection wrappers — flat grouped lists with separators.
 * Privacy section preserved and restyled.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { S, T, R, colors } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { AppTheme, PrivacyDensity } from '../types';
import { storageService } from '../services/StorageService';
import { overlayService } from '../services/OverlayService';
import { PrivacyFilterService } from '../services/PrivacyFilterService';
import { openBattery } from '../utils/helpers';

const DENSITY_OPTIONS: { value: PrivacyDensity; label: string }[] = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'standard', label: 'Standard' },
  { value: 'strong', label: 'Strong' },
];

// Section separator component
const SectionSeparator: React.FC = () => (
  <View style={ss.sectionSeparator} />
);

// Section label component — ALL CAPS with textMuted color
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <Text style={ss.sectionLabelText}>{label}</Text>
);

// Setting row — label on left, control on right, 52dp min height
const SettingRow: React.FC<{
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}> = ({ label, children, onPress, showChevron }) => (
  <TouchableOpacity
    style={ss.settingRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
    accessibilityRole={onPress ? 'button' : undefined}
  >
    <Text style={ss.settingLabel}>{label}</Text>
    <View style={ss.settingRight}>
      {children}
      {showChevron && <Icon name="chevron-right" size={20} color={colors.textMuted} style={{ marginLeft: S.s1 }} />}
    </View>
  </TouchableOpacity>
);

// Inline divider between rows
const RowDivider: React.FC = () => (
  <View style={ss.rowDivider} />
);

// Toggle switch — Void-styled
const VoidToggle: React.FC<{
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel?: string;
}> = ({ value, onValueChange, accessibilityLabel }) => (
  <TouchableOpacity
    onPress={() => onValueChange(!value)}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <View style={[ss.toggleTrack, { backgroundColor: value ? colors.accentAmber : colors.voidGhost }]}>
      <View style={[ss.toggleThumb, { backgroundColor: value ? colors.voidBlack : colors.textMuted, transform: [{ translateX: value ? 22 : 2 }] }]} />
    </View>
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const { theme, setTheme } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Settings state
  const [autoStart, setAutoStart] = useState(false);
  const [restoreFilter, setRestoreFilter] = useState(true);
  const [notifControls, setNotifControls] = useState(true);
  const [floatingBubble, setFloatingBubble] = useState(false);

  // Privacy state
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [privacyDensity, setPrivacyDensity] = useState<PrivacyDensity>('standard');
  const [privacyWallOpacity, setPrivacyWallOpacity] = useState(0.75);

  useEffect(() => {
    (async () => {
      setAutoStart(await storageService.getAutoStart());
      setRestoreFilter(await storageService.getRestoreFilter());
      setNotifControls(await storageService.getNotificationControls());
      setFloatingBubble(await storageService.getFloatingWidget());
      setPrivacyEnabled(await storageService.getPrivacyFilterEnabled());
      setPrivacyDensity((await storageService.getPrivacyDensity()) as PrivacyDensity);
      setPrivacyWallOpacity(await storageService.getPrivacyWallOpacity());
    })();
  }, []);

  const handleBubble = useCallback(async (v: boolean) => {
    setFloatingBubble(v);
    await storageService.setFloatingWidget(v);
    await storageService.setBubbleEnabled(v);
    try { if (v) await overlayService.showBubble(); else await overlayService.hideBubble(); } catch {}
  }, []);

  const handlePrivacyToggle = useCallback(async (v: boolean) => {
    setPrivacyEnabled(v);
    await storageService.setPrivacyFilterEnabled(v);
    try {
      if (v) {
        await PrivacyFilterService.start(privacyDensity, privacyWallOpacity);
      } else {
        await PrivacyFilterService.stop();
      }
    } catch {}
  }, [privacyDensity, privacyWallOpacity]);

  const handlePrivacyDensity = useCallback(async (d: PrivacyDensity) => {
    setPrivacyDensity(d);
    await storageService.setPrivacyDensity(d);
    if (privacyEnabled) {
      try { await PrivacyFilterService.start(d, privacyWallOpacity); } catch {}
    }
  }, [privacyEnabled, privacyWallOpacity]);

  const handlePrivacyOpacity = useCallback(async (o: number) => {
    setPrivacyWallOpacity(o);
    await storageService.setPrivacyWallOpacity(o);
    if (privacyEnabled) {
      try { await PrivacyFilterService.start(privacyDensity, o); } catch {}
    }
  }, [privacyEnabled, privacyDensity]);

  const showBatteryGuide = (mfr: string) => {
    const guides: Record<string, string> = {
      Samsung: '1. Settings \u2192 Apps \u2192 \u22EE \u2192 Special Access\n2. Optimize battery usage \u2192 All apps\n3. NightShade \u2192 "Don\'t optimize"',
      Xiaomi: '1. Settings \u2192 Apps \u2192 Manage Apps \u2192 NightShade\n2. Battery Saver \u2192 No restrictions\n3. Enable Autostart',
      Oppo: '1. Settings \u2192 Battery \u2192 Advanced Settings\n2. NightShade \u2192 Disable optimization\n3. Enable Autostart',
      Vivo: '1. Settings \u2192 More Settings \u2192 Applications \u2192 NightShade\n2. Disable battery optimization\n3. Allow Autostart',
      Huawei: '1. Settings \u2192 Apps \u2192 NightShade \u2192 Battery \u2192 Launch\n2. Set to "Manage manually"\n3. Enable all three options',
    };
    Alert.alert(`${mfr} Battery Guide`, guides[mfr] || 'Disable battery optimization for NightShade.');
  };

  return (
    <ScrollView
      style={[ss.root, { backgroundColor: colors.voidBlack }]}
      contentContainerStyle={{
        paddingTop: insets.top + S.s4,
        paddingBottom: insets.bottom + S.s8 + S.s16,
        paddingHorizontal: S.s4,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={ss.pageTitle}>Settings</Text>

      {/* ─── Appearance ─────────────────────────────────────────── */}
      <SectionLabel label="APPEARANCE" />
      <View style={ss.group}>
        <SettingRow label="Theme">
          <View style={ss.themeRow}>
            {([
              { value: 'system' as AppTheme, label: 'System', icon: 'theme-light-dark' },
              { value: 'light' as AppTheme, label: 'Light', icon: 'weather-sunny' },
              { value: 'dark' as AppTheme, label: 'Dark', icon: 'moon-waning-crescent' },
            ]).map(t => {
              const isActive = theme === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    ss.themeBtn,
                    {
                      backgroundColor: isActive ? colors.accentAmber : colors.voidRim,
                      borderColor: isActive ? colors.accentAmber : colors.voidGhost,
                    },
                  ]}
                  onPress={() => setTheme(t.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                >
                  <Icon name={t.icon} size={18} color={isActive ? colors.voidBlack : colors.textMuted} />
                  <Text style={{
                    ...T.labelSm,
                    color: isActive ? colors.voidBlack : colors.textSecondary,
                    fontWeight: '600',
                    marginLeft: S.s1,
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SettingRow>
      </View>

      <SectionSeparator />

      {/* ─── Overlay Controls ────────────────────────────────────── */}
      <SectionLabel label="OVERLAY CONTROLS" />
      <View style={ss.group}>
        <SettingRow label="Floating Bubble">
          <VoidToggle value={floatingBubble} onValueChange={handleBubble} accessibilityLabel="Floating bubble toggle" />
        </SettingRow>
        <RowDivider />
        <SettingRow label="Notification Controls">
          <VoidToggle
            value={notifControls}
            onValueChange={async v => { setNotifControls(v); await storageService.setNotificationControls(v); }}
            accessibilityLabel="Notification controls"
          />
        </SettingRow>
      </View>

      <SectionSeparator />

      {/* ─── Privacy ─────────────────────────────────────────── */}
      <SectionLabel label="PRIVACY" />
      <View style={ss.group}>
        <SettingRow label="Privacy Filter">
          <VoidToggle value={privacyEnabled} onValueChange={handlePrivacyToggle} accessibilityLabel="Privacy filter toggle" />
        </SettingRow>
        <RowDivider />

        {/* Density sub-section */}
        <View style={ss.subSection}>
          <Text style={ss.subLabel}>Density</Text>
          <View style={ss.densityRow}>
            {DENSITY_OPTIONS.map(opt => {
              const isActive = privacyDensity === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    ss.densityPill,
                    {
                      backgroundColor: isActive ? colors.accentAmber : colors.voidRim,
                      borderColor: isActive ? colors.accentAmber : colors.voidGhost,
                    },
                  ]}
                  onPress={() => handlePrivacyDensity(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                >
                  <Text style={{
                    ...T.labelSm,
                    color: isActive ? colors.voidBlack : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <RowDivider />

        {/* Wall Opacity sub-section */}
        <View style={ss.subSection}>
          <View style={ss.sliderHeader}>
            <Text style={ss.subLabel}>Wall Opacity</Text>
            <Text style={ss.sliderValue}>{Math.round(privacyWallOpacity * 100)}%</Text>
          </View>
          <Slider
            style={ss.slider}
            minimumValue={0.40}
            maximumValue={0.90}
            step={0.05}
            value={privacyWallOpacity}
            onValueChange={handlePrivacyOpacity}
            minimumTrackTintColor={colors.accentAmber}
            maximumTrackTintColor={colors.voidRim}
            thumbTintColor={colors.accentAmber}
            accessibilityLabel="Wall opacity"
          />
        </View>
      </View>
      <Text style={ss.disclaimer}>
        Software approximation only. Effect varies with ambient lighting and distance.
      </Text>

      <SectionSeparator />

      {/* ─── Startup ─────────────────────────────────────────────── */}
      <SectionLabel label="STARTUP" />
      <View style={ss.group}>
        <SettingRow label="Start on Boot">
          <VoidToggle
            value={autoStart}
            onValueChange={async v => { setAutoStart(v); await storageService.setAutoStart(v); }}
            accessibilityLabel="Auto start on boot"
          />
        </SettingRow>
        <RowDivider />
        <SettingRow label="Restore Previous Filter">
          <VoidToggle
            value={restoreFilter}
            onValueChange={async v => { setRestoreFilter(v); await storageService.setRestoreFilter(v); }}
            accessibilityLabel="Restore filter"
          />
        </SettingRow>
      </View>

      <SectionSeparator />

      {/* ─── Advanced ────────────────────────────────────────────── */}
      <SectionLabel label="ADVANCED" />

      <View style={ss.group}>
        {['Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei'].map((m, i, a) => (
          <React.Fragment key={m}>
            <SettingRow label={`${m} Battery`} onPress={() => showBatteryGuide(m)} showChevron />
            {i < a.length - 1 && <RowDivider />}
          </React.Fragment>
        ))}
      </View>

      <View style={ss.actionBtnContainer}>
        <TouchableOpacity
          style={[ss.actionBtn, { backgroundColor: colors.voidDeep, borderColor: colors.voidRim }]}
          onPress={openBattery}
        >
          <Icon name="battery-outline" size={18} color={colors.accentAmber} />
          <Text style={ss.actionBtnText}>Open Battery Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={ss.actionBtnContainer}>
        <TouchableOpacity
          style={[ss.actionBtn, { backgroundColor: colors.voidDeep, borderColor: colors.voidRim }]}
          onPress={async () => {
            const has = await overlayService.hasPermission();
            if (!has) await overlayService.requestPermission();
          }}
        >
          <Icon name="shield-check-outline" size={18} color={colors.accentAmber} />
          <Text style={ss.actionBtnText}>Check Overlay Permission</Text>
        </TouchableOpacity>
      </View>

      <SectionSeparator />

      {/* ─── About ───────────────────────────────────────────────── */}
      <SectionLabel label="ABOUT" />
      <View style={ss.group}>
        <View style={ss.aboutHeader}>
          <Icon name="moon-waning-crescent" size={24} color={colors.accentAmber} />
          <Text style={ss.aboutTitle}>NightShade</Text>
        </View>
        {[
          { label: 'Version', value: '3.0.0' },
          { label: 'Engine', value: 'WindowManager Overlay' },
          { label: 'Design', value: 'Void Architecture' },
          { label: 'Max Brightness', value: '180% Safe Extended' },
        ].map((item, i, a) => (
          <React.Fragment key={item.label}>
            <View style={ss.aboutRow}>
              <Text style={ss.aboutKey}>{item.label}</Text>
              <Text style={ss.aboutVal}>{item.value}</Text>
            </View>
            {i < a.length - 1 && <RowDivider />}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
};

const ss = StyleSheet.create({
  root: { flex: 1 },
  pageTitle: {
    ...T.heading1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: S.s6,
  },
  sectionLabelText: {
    ...T.labelLg,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: S.s2,
    paddingHorizontal: S.s1,
  },
  group: {
    backgroundColor: colors.voidDeep,
    borderRadius: R.radiusLg,
    borderWidth: 1,
    borderColor: colors.voidRim,
    paddingHorizontal: S.s4,
    paddingVertical: S.s1,
    overflow: 'hidden',
  },
  sectionSeparator: {
    height: S.s8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: S.s2,
  },
  settingLabel: {
    ...T.bodyLg,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.voidRim,
  },
  // Toggle
  toggleTrack: {
    width: 52,
    height: 32,
    borderRadius: R.radiusPill,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  // Theme row
  themeRow: {
    flexDirection: 'row',
    gap: S.s1,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.s3,
    paddingVertical: S.s2,
    borderRadius: R.radiusPill,
    borderWidth: 1,
  },
  // Privacy sub-sections
  subSection: {
    paddingVertical: S.s2,
  },
  subLabel: {
    ...T.labelSm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: S.s2,
    textTransform: 'uppercase',
  },
  densityRow: {
    flexDirection: 'row',
    gap: S.s2,
  },
  densityPill: {
    flex: 1,
    paddingVertical: S.s2,
    paddingHorizontal: S.s3,
    borderRadius: R.radiusPill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: S.s10,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.s1,
  },
  sliderValue: {
    ...T.monoNum,
    color: colors.accentAmber,
  },
  slider: {
    flex: 1,
    height: S.s12,
  },
  disclaimer: {
    ...T.bodySm,
    color: colors.textMuted,
    marginTop: S.s2,
    paddingHorizontal: S.s1,
  },
  // Action buttons
  actionBtnContainer: {
    marginTop: S.s3,
  },
  actionBtn: {
    flexDirection: 'row',
    borderRadius: R.radiusMd,
    paddingVertical: S.s3,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: S.s12,
    justifyContent: 'center',
    gap: S.s2,
  },
  actionBtnText: {
    ...T.labelLg,
    color: colors.accentAmber,
    fontWeight: '600',
  },
  // About
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: S.s3,
    minHeight: 52,
  },
  aboutTitle: {
    ...T.heading2,
    color: colors.textPrimary,
    fontWeight: '700',
    marginLeft: S.s2,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: S.s3,
    minHeight: 44,
  },
  aboutKey: {
    ...T.bodyLg,
    color: colors.textSecondary,
  },
  aboutVal: {
    ...T.bodyLg,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});

export default SettingsScreen;
