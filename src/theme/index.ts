/**
 * NightShade Revamp — Void Architecture Design System
 *
 * Single dark palette: The Void Architecture.
 * No multi-palette system. One palette. Dark. Precise.
 * Light mode is a stretch goal — dark-only for now.
 *
 * All color references in components must use these tokens.
 * No raw hex strings in any component file.
 */

import { AppTheme } from '../types';

// ─── Void Architecture — Core Color Tokens ─────────────────────────

export const colors = {
  // Surfaces
  voidBlack:      '#08090B',  // Deepest background
  voidDeep:       '#0D0F14',  // Card surface
  voidMid:        '#14171F',  // Elevated card
  voidRim:        '#1C2030',  // Border / separator
  voidGhost:      '#2A2E3E',  // Muted surface, input fields

  // Text
  textPrimary:    '#F0F2F7',  // Main text — not pure white
  textSecondary:  '#8A90A8',  // Subtext, labels
  textMuted:      '#4A5068',  // Disabled, hint text

  // Accent
  accentAmber:    '#E8A040',  // Primary accent — warm, precise
  accentAmberDim: '#A86820',  // Secondary accent state
  accentIce:      '#5BB8D4',  // Cool accent, contrast pair to amber

  // Status
  statusOn:       '#3DDC84',  // Android green — filter active
  statusOff:      '#4A5068',  // Filter inactive
  danger:         '#E85540',  // Emergency reset, warnings

  // Legacy compat (redirected to void tokens)
  primary:        '#E8A040',
  onPrimary:      '#08090B',
  primaryContainer: '#2A2E3E',
  onPrimaryContainer: '#F0F2F7',
  secondary:      '#5BB8D4',
  onSecondary:    '#08090B',
  secondaryContainer: '#1C2030',
  onSecondaryContainer: '#F0F2F7',
  tertiary:       '#A86820',
  onTertiary:     '#F0F2F7',
  tertiaryContainer: '#2A2E3E',
  onTertiaryContainer: '#E8A040',
  error:          '#E85540',
  onError:        '#F0F2F7',
  errorContainer: '#3A1A1A',
  onErrorContainer: '#E85540',
  surface:        '#0D0F14',
  onSurface:      '#F0F2F7',
  surfaceVariant: '#2A2E3E',
  onSurfaceVariant: '#8A90A8',
  surfaceContainerLow: '#0D0F14',
  surfaceContainer: '#14171F',
  surfaceContainerHigh: '#1C2030',
  surfaceContainerHighest: '#2A2E3E',
  inverseSurface: '#F0F2F7',
  inverseOnSurface: '#08090B',
  inversePrimary: '#A86820',
  outline:        '#2A2E3E',
  outlineVariant: '#1C2030',
  background:     '#08090B',
  scrim:          '#000000',
  success:        '#3DDC84',
  warning:        '#E8A040',
  info:           '#5BB8D4',
} as const;

// ─── Palette Type (backward compat) ────────────────────────────────

export type PaletteTokens = typeof colors;
export type Palette = PaletteTokens;
export type PaletteSet = { name: string; light: PaletteTokens; dark: PaletteTokens };

// Single palette — the Void
const VoidPalette: PaletteSet = {
  name: 'Void',
  dark: colors,
  light: colors, // Light mode not implemented — same as dark
};

// ─── Palette Registry (backward compat) ────────────────────────────

export const PALETTE_REGISTRY: Record<string, PaletteSet> = {
  nightblue: VoidPalette,
  teal: VoidPalette,
  slate: VoidPalette,
  void: VoidPalette,
};

let activePaletteKey: string = 'void';

export function setActivePaletteKey(key: string) {
  if (PALETTE_REGISTRY[key]) activePaletteKey = key;
}

export function getActivePaletteKey(): string {
  return activePaletteKey;
}

export function getPalette(_theme: AppTheme, _systemDark: boolean): Palette {
  return VoidPalette.dark;
}

// Convenience accessors
export const palettes = {
  get dark() { return VoidPalette.dark; },
  get light() { return VoidPalette.dark; }, // Same — dark-only for now
};

// ─── Typography Scale (Revamp) ─────────────────────────────────────
// Replaces the old MD3 type scale with precise, restrained typography.
// Font family: Inter (primary), fallback SF Pro Display / Roboto.

export const T = {
  displayXl:  { size: 64, weight: '300' as const, line: 72, letterSpacing: -1.5 },
  displayLg:  { size: 48, weight: '300' as const, line: 56, letterSpacing: -1.0 },
  heading1:   { size: 28, weight: '500' as const, line: 36, letterSpacing: -0.3 },
  heading2:   { size: 20, weight: '500' as const, line: 28, letterSpacing: 0 },
  bodyLg:     { size: 16, weight: '400' as const, line: 24, letterSpacing: 0 },
  bodySm:     { size: 13, weight: '400' as const, line: 18, letterSpacing: 0.1 },
  labelLg:    { size: 12, weight: '600' as const, line: 16, letterSpacing: 0.8 },
  labelSm:    { size: 11, weight: '500' as const, line: 16, letterSpacing: 0.5 },
  monoNum:    { size: 18, weight: '500' as const, line: 24, letterSpacing: -0.2 },

  // Legacy aliases for backward compat with existing components
  display:    { size: 57, weight: '400' as const, line: 64, letterSpacing: 0 },
  headline:   { size: 32, weight: '400' as const, line: 40, letterSpacing: 0 },
  titleL:     { size: 22, weight: '500' as const, line: 28, letterSpacing: 0 },
  titleM:     { size: 16, weight: '500' as const, line: 24, letterSpacing: 0 },
  titleS:     { size: 14, weight: '500' as const, line: 20, letterSpacing: 0 },
  bodyM:      { size: 14, weight: '400' as const, line: 20, letterSpacing: 0 },
  bodyS:      { size: 12, weight: '400' as const, line: 16, letterSpacing: 0 },
  labelL:     { size: 14, weight: '500' as const, line: 20, letterSpacing: 0 },
  labelM:     { size: 12, weight: '500' as const, line: 16, letterSpacing: 0 },
  labelS:     { size: 11, weight: '500' as const, line: 16, letterSpacing: 0 },
} as const;

// ─── Spacing System ────────────────────────────────────────────────

export const S = {
  s0: 0, s05: 2, s1: 4, s15: 6, s2: 8, s25: 10,
  s3: 12, s35: 14, s4: 16, s5: 20, s6: 24, s7: 28,
  s8: 32, s9: 36, s10: 40, s11: 44, s12: 48, s14: 56,
  s16: 64, s18: 72, s20: 80, s24: 96,
} as const;

// ─── Shape System (Revamp) ─────────────────────────────────────────

export const R = {
  radius0:   0,
  radiusXs:  4,
  radiusSm:  8,
  radiusMd:  12,
  radiusLg:  16,
  radiusXl:  24,
  radiusPill: 9999,
  // Legacy aliases
  none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
} as const;

// ─── Elevation (Revamp — single shadow, no stacking) ───────────────

export const E = {
  none: 0, sm: 1, md: 3, lg: 6, xl: 8,
  // Revamp shadow styles for StyleSheet
  elevation1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 2,
  },
  elevation2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

// ─── Animation ─────────────────────────────────────────────────────

export const ANIM = {
  fast: 150, normal: 250, slow: 400,
  spring: { damping: 12, stiffness: 200 },
} as const;

// ─── Filter Presets (Updated for Cinema Revamp) ────────────────────

export interface FilterPresetDef {
  name: string;
  color: string;
  opacity: number;
  category: string;
  description: string;
  isCinema?: boolean;
}

export const FILTER_PRESETS: FilterPresetDef[] = [
  // ─── Cinema Category ───────────────────────────────────────
  { name: 'Orange & Teal',       color: '#C45B1A', opacity: 0.20, category: 'Cinema',  description: 'Hollywood color grade. Warm highlights, teal-shifted shadows.', isCinema: true },
  { name: 'Cinematic Black',     color: '#050B18', opacity: 0.48, category: 'Cinema',  description: 'Dark viewing room simulation. Crushes blacks, lifts perceived contrast.', isCinema: true },
  { name: 'Anamorphic Night',    color: '#0A1428', opacity: 0.35, category: 'Cinema',  description: 'Simulates anamorphic lens rendering. Deep blue cast in shadow zones.', isCinema: true },
  { name: 'Kodak Vision3 250D', color: '#D4A855', opacity: 0.18, category: 'Cinema',  description: 'Daylight film stock. Golden-amber midtones, lifted shadow floor.', isCinema: true },
  { name: 'Blade Runner Amber', color: '#C45000', opacity: 0.40, category: 'Cinema',  description: 'High-opacity amber. Atmospheric haze. Designed for late-night reading.', isCinema: true },
  { name: 'Noir Veil',          color: '#0F0F12', opacity: 0.58, category: 'Cinema',  description: 'Near-black neutral. Maximum shadow depth. Classic film noir light ratio.', isCinema: true },

  // ─── Clarity Category ──────────────────────────────────────
  { name: '4K Reference',       color: '#1A2840', opacity: 0.10, category: 'Clarity', description: 'Minimal cool overlay. Increases perceived micro-contrast. Near-transparent.', isCinema: true },
  { name: '8K HDR',             color: '#12182E', opacity: 0.12, category: 'Clarity', description: 'Deep indigo shadow boost. Simulates HDR expanded shadow range.', isCinema: true },
  { name: 'Arctic Monitor',     color: '#C8E8FF', opacity: 0.12, category: 'Clarity', description: 'Ice-cold white point. Reduces perceived amber cast on warm displays.', isCinema: true },

  // ─── Warm Category ─────────────────────────────────────────
  { name: 'Night Reading',      color: '#FFB74D', opacity: 0.35, category: 'Warm',    description: 'Amber-shifted for melatonin preservation. 2700K equivalent.' },
  { name: 'Sleep Mode',         color: '#FF6A40', opacity: 0.55, category: 'Warm',    description: 'Deep orange. Eliminates blue spectrum for sleep preparation.' },
  { name: 'Golden Hour',        color: '#FFB03A', opacity: 0.22, category: 'Warm',    description: 'Magic-hour photography warmth. Flattering on all display types.' },
  { name: 'Tobacco',            color: '#C8903A', opacity: 0.18, category: 'Warm',    description: 'Vintage Fujifilm warmth. Slightly desaturated amber cast.' },

  // ─── Deep Category ─────────────────────────────────────────
  { name: 'Ultra Dark',         color: '#000000', opacity: 0.65, category: 'Deep',    description: 'Single-layer maximum dim. Near-off state for dark adaptation.' },
  { name: 'Midnight Oil',       color: '#0A0505', opacity: 1.10, category: 'Deep',    description: 'Dual-layer extreme dim. For dark-adapted eyes only. Red-tinted void.' },
  { name: 'Observatory',        color: '#1A0000', opacity: 0.80, category: 'Deep',    description: 'Deep red-black. Preserves scotopic vision for stargazing.' },

  // ─── Cool Category (legacy) ────────────────────────────────
  { name: 'Focus Mode',         color: '#5BB8D4', opacity: 0.12, category: 'Cool',    description: 'Subtle cool tint that promotes alertness and concentration.' },
  { name: 'Red Light',          color: '#D32F2F', opacity: 0.40, category: 'Cool',    description: 'Deep red filter for astronomy and night vision preservation.' },
];

export const QUICK_COLORS: { color: string; label: string; category: string }[] = [
  { color: '#C45B1A', label: 'Orange Teal', category: 'Cinema' },
  { color: '#050B18', label: 'Cine Black',  category: 'Cinema' },
  { color: '#FFB74D', label: 'Warm',        category: 'Warm' },
  { color: '#FF6A40', label: 'Sleep',       category: 'Warm' },
  { color: '#000000', label: 'AMOLED',      category: 'Deep' },
  { color: '#5BB8D4', label: 'Cool',        category: 'Cool' },
  { color: '#C8E8FF', label: 'Arctic',      category: 'Clarity' },
  { color: '#D32F2F', label: 'Red',         category: 'Cool' },
];

export const BRIGHTNESS_ZONES = [
  { threshold: 0.0,  label: 'Off' },
  { threshold: 0.15, label: 'Subtle Tint' },
  { threshold: 0.30, label: 'Light Dim' },
  { threshold: 0.50, label: 'Moderate' },
  { threshold: 0.70, label: 'Strong Dim' },
  { threshold: 0.85, label: 'Deep' },
  { threshold: 1.0,  label: 'Maximum' },
  { threshold: 1.30, label: 'Ultra' },
  { threshold: 1.60, label: 'Extreme' },
  { threshold: 1.80, label: 'AMOLED Dark' },
] as const;
