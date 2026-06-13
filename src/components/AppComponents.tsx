/**
 * NightShade V4 — Shared UI Components
 * Professional design system with:
 * - Dynamic bottom navigation (selected tab expands with label)
 * - Center dock FAB integrated into navigation
 * - MD3 Card, Switch, BrightnessCard
 * - Accordion component for Settings
 * - PresetChip with proper vector icons
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutAnimation, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { S, T, R, ANIM } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { BottomTab } from '../types';
import { pctStr, getBrightnessLabel } from '../utils/helpers';

// ─── MD3 Card ─────────────────────────────────────────────────────
export const Card: React.FC<{
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}> = ({ children, style, onPress }) => {
  const { palette } = useAppTheme();
  const inner = (
    <View style={[{ backgroundColor: palette.surfaceContainer, borderRadius: R.lg, padding: S.s4 }, style]}>
      {children}
    </View>
  );
  return onPress ? (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} accessibilityRole="button">{inner}</TouchableOpacity>
  ) : inner;
};

// ─── MD3 Toggle Switch (48dp touch target) ────────────────────────
export const Switch: React.FC<{
  value: boolean;
  onValueChange: (v: boolean) => void;
  label?: string;
  accessibilityLabel?: string;
}> = ({ value, onValueChange, label, accessibilityLabel }) => {
  const { palette } = useAppTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: ANIM.normal, useNativeDriver: false }).start();
  }, [value]);

  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [palette.outline, palette.primary] });

  return (
    <View style={sw.row}>
      {label && <Text style={[sw.label, { color: palette.onSurface }]}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onValueChange(!value)}
        accessibilityLabel={accessibilityLabel || label || 'Toggle'}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Animated.View style={[sw.track, { backgroundColor: bg }]}>
          <Animated.View style={[sw.thumb, { transform: [{ translateX: tx }] }]} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const sw = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: S.s12, paddingVertical: S.s2 },
  label: { ...T.bodyLg, fontWeight: '500', flex: 1, marginRight: S.s4 },
  track: { width: 52, height: 32, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 2 },
  thumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
});

// ─── Brightness Slider Card (0–180% Safe Extended) ─────────────
export const BrightnessCard: React.FC<{
  opacity: number;
  onValueChange: (v: number) => void;
  onSlidingComplete: (v: number) => void;
}> = ({ opacity, onValueChange, onSlidingComplete }) => {
  const { palette } = useAppTheme();
  const label = getBrightnessLabel(opacity);

  return (
    <Card>
      <View style={bs.header}>
        <View style={bs.headerLeft}>
          <Icon name="brightness-6" size={20} color={palette.primary} />
          <Text style={{ ...T.titleM, color: palette.onSurface, marginLeft: S.s1 }}>Brightness</Text>
        </View>
        <View style={bs.headerRight}>
          <Text style={{ ...T.titleM, color: palette.primary, fontWeight: '700' }}>{pctStr(opacity)}</Text>
          <View style={[bs.zoneBadge, { backgroundColor: palette.primaryContainer }]}>
            <Text style={{ ...T.labelS, color: palette.onPrimaryContainer, fontWeight: '600' }}>{label}</Text>
          </View>
        </View>
      </View>
      <View style={bs.row}>
        <Icon name="weather-sunny" size={20} color={palette.onSurfaceVariant} />
        <Slider
          style={bs.slider}
          minimumValue={0}
          maximumValue={1.80}
          step={0.01}
          value={opacity}
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={palette.primary}
          maximumTrackTintColor={palette.outlineVariant}
          thumbTintColor={palette.primary}
          accessibilityLabel="Brightness"
        />
        <Icon name="moon-waning-crescent" size={20} color={palette.onSurfaceVariant} />
      </View>
      <View style={bs.labels}>
        <Text style={{ ...T.labelS, color: palette.onSurfaceVariant }}>0%</Text>
        <Text style={{ ...T.labelS, color: palette.outline }}>100%</Text>
        <Text style={{ ...T.labelS, color: palette.onSurfaceVariant }}>180%</Text>
      </View>
    </Card>
  );
};

const bs = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.s3 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: S.s2 },
  zoneBadge: { borderRadius: R.xs, paddingHorizontal: S.s2, paddingVertical: S.s05 },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.s2 },
  slider: { flex: 1, height: S.s12 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: S.s4 },
});

// ─── Section Header ───────────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string;
  action?: { label: string; onPress: () => void };
}> = ({ title, action }) => {
  const { palette } = useAppTheme();
  return (
    <View style={sh.row}>
      <Text style={{ ...T.labelM, color: palette.onSurfaceVariant, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ ...T.labelM, color: palette.primary, fontWeight: '600' }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const sh = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.s2 } });

// ─── Preset Chip ──────────────────────────────────────────────────
export const PresetChip: React.FC<{
  name: string;
  color: string;
  active: boolean;
  onPress: () => void;
}> = ({ name, color, active, onPress }) => {
  const { palette } = useAppTheme();
  return (
    <TouchableOpacity
      style={[pc.chip, { backgroundColor: active ? palette.primary : palette.surfaceContainerHigh, borderColor: active ? palette.primary : palette.outlineVariant }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={[pc.dot, { backgroundColor: color }]} />
      <Text style={{ ...T.labelM, color: active ? palette.onPrimary : palette.onSurface, fontWeight: '500' }} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
};

const pc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s3, paddingVertical: S.s2, borderRadius: R.xl, borderWidth: 1, gap: S.s1, minHeight: S.s10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

// ─── Accordion Section (for Settings) ─────────────────────────────
export const AccordionSection: React.FC<{
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, expanded, onToggle, children }) => {
  const { palette } = useAppTheme();
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: ANIM.fast,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[acc.wrapper, { backgroundColor: palette.surfaceContainer, borderColor: palette.outlineVariant }]}>
      <TouchableOpacity
        style={acc.header}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title} section`}
        hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
      >
        <View style={acc.headerLeft}>
          <Icon name={icon} size={22} color={palette.primary} />
          <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '600', marginLeft: S.s3 }}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Icon name="chevron-down" size={24} color={palette.onSurfaceVariant} />
        </Animated.View>
      </TouchableOpacity>
      {expanded && (
        <View style={[acc.content, { borderTopColor: palette.outlineVariant }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const acc = StyleSheet.create({
  wrapper: { borderRadius: R.lg, borderWidth: 1, marginBottom: S.s3, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.s4, paddingVertical: S.s4, minHeight: S.s12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  content: { paddingHorizontal: S.s4, paddingBottom: S.s4, borderTopWidth: 1, paddingTop: S.s3 },
});

// ─── Dynamic Bottom Navigation ────────────────────────────────────
// Selected tab expands with label, unselected shows icon only.
// Center dock FAB for creating filters.

const TAB_CONFIG: { key: BottomTab; icon: string; iconActive: string; label: string }[] = [
  { key: 'home',     icon: 'home-outline',       iconActive: 'home',              label: 'Home' },
  { key: 'presets',  icon: 'palette-outline',     iconActive: 'palette',           label: 'Presets' },
  // Center slot is the FAB — not a tab
  { key: 'settings', icon: 'cog-outline',          iconActive: 'cog',              label: 'Settings' },
];

interface BottomNavProps {
  active: BottomTab;
  onTab: (t: BottomTab) => void;
  onFabPress: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ active, onTab, onFabPress }) => {
  const { palette, isDark } = useAppTheme();

  return (
    <View style={[bn.outer, { backgroundColor: palette.background }]}>
      <View style={[bn.bar, { backgroundColor: isDark ? palette.surfaceContainer : palette.surface, borderTopColor: palette.outlineVariant }]}>
        {TAB_CONFIG.map(t => {
          const isActive = active === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[bn.item, isActive && bn.itemActive]}
              onPress={() => onTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t.label}
              activeOpacity={0.7}
            >
              <View style={[bn.iconWrap, isActive && { backgroundColor: palette.secondaryContainer }]}>
                <Icon
                  name={isActive ? t.iconActive : t.icon}
                  size={22}
                  color={isActive ? palette.primary : palette.onSurfaceVariant}
                />
              </View>
              {isActive && (
                <Text style={{ ...T.labelS, color: palette.primary, fontWeight: '700', marginTop: 2 }}>
                  {t.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Center Dock FAB */}
      <TouchableOpacity
        style={[bn.fab, { backgroundColor: palette.primary, elevation: 8, shadowColor: palette.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }]}
        onPress={onFabPress}
        accessibilityLabel="Create new filter"
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <Icon name="plus" size={28} color={palette.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const bn = StyleSheet.create({
  outer: { position: 'relative' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, paddingBottom: Platform.select({ android: 4, ios: 20 }), paddingTop: S.s2, minHeight: 60 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: S.s1, minHeight: S.s12, borderRadius: R.lg },
  itemActive: { /* dynamic bg applied via style */ },
  iconWrap: { paddingHorizontal: S.s4, paddingVertical: S.s1, borderRadius: R.xl, minHeight: S.s8, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', top: -24, left: '50%', marginLeft: -28, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});

// ─── Empty State ──────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}> = ({ icon, title, subtitle, action }) => {
  const { palette } = useAppTheme();
  return (
    <View style={es.wrap}>
      <Icon name={icon} size={56} color={palette.outline} />
      <Text style={{ ...T.titleL, color: palette.onSurface, marginTop: S.s4, fontWeight: '600' }}>{title}</Text>
      {subtitle && <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginTop: S.s1, textAlign: 'center' }}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={[es.btn, { backgroundColor: palette.primary }]} onPress={action.onPress}>
          <Text style={{ color: palette.onPrimary, ...T.labelL, fontWeight: '700' }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: S.s8 },
  btn: { marginTop: S.s6, borderRadius: R.md, paddingHorizontal: S.s6, paddingVertical: S.s3, minHeight: S.s12, justifyContent: 'center', alignItems: 'center' },
});
