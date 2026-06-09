/**
 * NightShade V5 — Professional Design System
 *
 * Swappable palette architecture:
 *   - Multiple named palettes (NightBlue, Teal, Slate)
 *   - Each palette has Light + Dark variant
 *   - Components consume tokens only — never raw hex
 *   - Palette swap requires zero component changes
 *
 * Default palette: NightBlue (deep indigo / midnight blue)
 * Feel: Premium, technical, professional — aligned with a night/filter utility
 */

import { AppTheme, FilterCategory } from '../types';

// ─── Palette Architecture ─────────────────────────────────────────
// Each palette provides Light + Dark MD3 token sets.
// `activePalette` controls which palette the app uses.
// Components only ever read from `getPalette()`.

export type PaletteSet = {
  name: string;
  light: PaletteTokens;
  dark: PaletteTokens;
};

export type PaletteTokens = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  outline: string;
  outlineVariant: string;
  background: string;
  scrim: string;
  // Semantic
  success: string;
  warning: string;
  info: string;
};

export type Palette = PaletteTokens;

// ─── Palette A: Night Blue (DEFAULT — Premium, Technical) ─────────
const NightBlue: PaletteSet = {
  name: 'Night Blue',
  dark: {
    primary: '#B8C9FF',          // Soft periwinkle
    onPrimary: '#1B2A60',
    primaryContainer: '#354190',
    onPrimaryContainer: '#DEE1FF',
    secondary: '#BFC5DD',
    onSecondary: '#292F42',
    secondaryContainer: '#3F4560',
    onSecondaryContainer: '#DADEFF',
    tertiary: '#D7BEE4',
    onTertiary: '#3E2B4B',
    tertiaryContainer: '#564163',
    onTertiaryContainer: '#F3DAFF',
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',
    surface: '#0E1118',
    onSurface: '#E1E2E9',
    surfaceVariant: '#44474F',
    onSurfaceVariant: '#C4C6D0',
    surfaceContainerLow: '#191C24',
    surfaceContainer: '#1D2029',
    surfaceContainerHigh: '#282A34',
    surfaceContainerHighest: '#33353F',
    inverseSurface: '#E1E2E9',
    inverseOnSurface: '#2E3039',
    inversePrimary: '#4C5AA8',
    outline: '#8E909A',
    outlineVariant: '#44474F',
    background: '#0A0C13',
    scrim: '#000000',
    success: '#A5D6A7',
    warning: '#FFCC80',
    info: '#90CAF9',
  },
  light: {
    primary: '#4C5AA8',          // Deep indigo
    onPrimary: '#FFFFFF',
    primaryContainer: '#DEE1FF',
    onPrimaryContainer: '#0C1545',
    secondary: '#565D76',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DADEFF',
    onSecondaryContainer: '#131831',
    tertiary: '#71557D',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F3DAFF',
    onTertiaryContainer: '#291535',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    surface: '#FAFAFF',
    onSurface: '#1A1C21',
    surfaceVariant: '#E2E1EC',
    onSurfaceVariant: '#44474F',
    surfaceContainerLow: '#F4F3FB',
    surfaceContainer: '#EEEFF7',
    surfaceContainerHigh: '#E8E9F2',
    surfaceContainerHighest: '#E2E3EC',
    inverseSurface: '#2E3039',
    inverseOnSurface: '#F0F0F7',
    inversePrimary: '#B8C9FF',
    outline: '#74757F',
    outlineVariant: '#C4C6D0',
    background: '#FAFAFF',
    scrim: '#000000',
    success: '#2E7D32',
    warning: '#E65100',
    info: '#1565C0',
  },
};

// ─── Palette B: Teal + Cyan (Modern, Clean, Tech) ────────────────
const TealCyan: PaletteSet = {
  name: 'Teal',
  dark: {
    primary: '#80CBC4',
    onPrimary: '#003731',
    primaryContainer: '#004F49',
    onPrimaryContainer: '#A0F0E8',
    secondary: '#B0CCCA',
    onSecondary: '#1C3533',
    secondaryContainer: '#334B49',
    onSecondaryContainer: '#CCE8E6',
    tertiary: '#B5C5EE',
    onTertiary: '#1E2D5D',
    tertiaryContainer: '#354475',
    onTertiaryContainer: '#D3E0FF',
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',
    surface: '#0E1514',
    onSurface: '#DEE4E3',
    surfaceVariant: '#3F4948',
    onSurfaceVariant: '#BEC9C7',
    surfaceContainerLow: '#1A1F1E',
    surfaceContainer: '#1E2423',
    surfaceContainerHigh: '#282E2D',
    surfaceContainerHighest: '#333938',
    inverseSurface: '#DEE4E3',
    inverseOnSurface: '#2B3130',
    inversePrimary: '#006B63',
    outline: '#899392',
    outlineVariant: '#3F4948',
    background: '#0A0F0E',
    scrim: '#000000',
    success: '#A5D6A7',
    warning: '#FFCC80',
    info: '#90CAF9',
  },
  light: {
    primary: '#006B63',
    onPrimary: '#FFFFFF',
    primaryContainer: '#A0F0E8',
    onPrimaryContainer: '#00201E',
    secondary: '#4A6361',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CCE8E6',
    onSecondaryContainer: '#06201E',
    tertiary: '#445B91',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#D3E0FF',
    onTertiaryContainer: '#001B3E',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    surface: '#F4FAF9',
    onSurface: '#161D1C',
    surfaceVariant: '#DAE5E3',
    onSurfaceVariant: '#3F4948',
    surfaceContainerLow: '#EEF4F3',
    surfaceContainer: '#E8EFEE',
    surfaceContainerHigh: '#E2E9E8',
    surfaceContainerHighest: '#DCE3E2',
    inverseSurface: '#2B3130',
    inverseOnSurface: '#ECF2F1',
    inversePrimary: '#80CBC4',
    outline: '#6F7978',
    outlineVariant: '#BEC9C7',
    background: '#F4FAF9',
    scrim: '#000000',
    success: '#2E7D32',
    warning: '#E65100',
    info: '#1565C0',
  },
};

// ─── Palette C: Dark Slate + Electric Blue (Utility, Minimal) ─────
const SlateElectric: PaletteSet = {
  name: 'Slate',
  dark: {
    primary: '#82B1FF',
    onPrimary: '#002E6B',
    primaryContainer: '#00419E',
    onPrimaryContainer: '#BAD5FF',
    secondary: '#B6C4D7',
    onSecondary: '#202E3D',
    secondaryContainer: '#374454',
    onSecondaryContainer: '#D1E0F3',
    tertiary: '#D2BCE4',
    onTertiary: '#3A2850',
    tertiaryContainer: '#523F68',
    onTertiaryContainer: '#EEDAFF',
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',
    surface: '#101418',
    onSurface: '#E0E2E8',
    surfaceVariant: '#42474E',
    onSurfaceVariant: '#C2C7CF',
    surfaceContainerLow: '#1B1F23',
    surfaceContainer: '#1F2328',
    surfaceContainerHigh: '#2A2E33',
    surfaceContainerHighest: '#35393E',
    inverseSurface: '#E0E2E8',
    inverseOnSurface: '#2C3035',
    inversePrimary: '#1556B0',
    outline: '#8C919A',
    outlineVariant: '#42474E',
    background: '#0C1014',
    scrim: '#000000',
    success: '#A5D6A7',
    warning: '#FFCC80',
    info: '#90CAF9',
  },
  light: {
    primary: '#1556B0',
    onPrimary: '#FFFFFF',
    primaryContainer: '#BAD5FF',
    onPrimaryContainer: '#001B3E',
    secondary: '#545F71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D1E0F3',
    onSecondaryContainer: '#111C2B',
    tertiary: '#6B577B',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#EEDAFF',
    onTertiaryContainer: '#251437',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    surface: '#F8F9FF',
    onSurface: '#181C20',
    surfaceVariant: '#DFE2EB',
    onSurfaceVariant: '#42474E',
    surfaceContainerLow: '#F2F3FA',
    surfaceContainer: '#ECEDF4',
    surfaceContainerHigh: '#E6E8EF',
    surfaceContainerHighest: '#E0E2E8',
    inverseSurface: '#2C3035',
    inverseOnSurface: '#ECF0F6',
    inversePrimary: '#82B1FF',
    outline: '#72777F',
    outlineVariant: '#C2C7CF',
    background: '#F8F9FF',
    scrim: '#000000',
    success: '#2E7D32',
    warning: '#E65100',
    info: '#1565C0',
  },
};

// ─── Palette Registry ─────────────────────────────────────────────
// All available palettes. Add new palettes here — zero component changes needed.

export const PALETTE_REGISTRY: Record<string, PaletteSet> = {
  nightblue: NightBlue,
  teal: TealCyan,
  slate: SlateElectric,
};

/** Active palette key — change this to swap the entire app palette */
let activePaletteKey: string = 'nightblue';

export function setActivePaletteKey(key: string) {
  if (PALETTE_REGISTRY[key]) activePaletteKey = key;
}

export function getActivePaletteKey(): string {
  return activePaletteKey;
}

export function getPalette(theme: AppTheme, systemDark: boolean): Palette {
  const isDark = theme === 'system' ? systemDark : theme === 'dark';
  const set = PALETTE_REGISTRY[activePaletteKey] || NightBlue;
  return isDark ? set.dark : set.light;
}

// Convenience accessors
export const palettes = {
  get dark() { return (PALETTE_REGISTRY[activePaletteKey] || NightBlue).dark; },
  get light() { return (PALETTE_REGISTRY[activePaletteKey] || NightBlue).light; },
};

// ─── 8dp Spacing System ──────────────────────────────────────────
export const S = {
  s0: 0, s05: 2, s1: 4, s15: 6, s2: 8, s25: 10,
  s3: 12, s35: 14, s4: 16, s5: 20, s6: 24, s7: 28,
  s8: 32, s9: 36, s10: 40, s11: 44, s12: 48, s14: 56,
  s16: 64, s18: 72, s20: 80, s24: 96,
} as const;

// ─── Typography Scale ─────────────────────────────────────────────
export const T = {
  display:   { size: 57, weight: '400' as const, line: 64 },
  headline:  { size: 32, weight: '400' as const, line: 40 },
  titleL:    { size: 22, weight: '500' as const, line: 28 },
  titleM:    { size: 16, weight: '500' as const, line: 24 },
  titleS:    { size: 14, weight: '500' as const, line: 20 },
  bodyL:     { size: 16, weight: '400' as const, line: 24 },
  bodyM:     { size: 14, weight: '400' as const, line: 20 },
  bodyS:     { size: 12, weight: '400' as const, line: 16 },
  labelL:    { size: 14, weight: '500' as const, line: 20 },
  labelM:    { size: 12, weight: '500' as const, line: 16 },
  labelS:    { size: 11, weight: '500' as const, line: 16 },
} as const;

// ─── Shape ────────────────────────────────────────────────────────
export const R = {
  none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 28, full: 9999,
} as const;

// ─── Elevation ────────────────────────────────────────────────────
export const E = { none: 0, sm: 1, md: 3, lg: 6, xl: 8 } as const;

// ─── Animation ────────────────────────────────────────────────────
export const ANIM = {
  fast: 150, normal: 250, slow: 400,
  spring: { damping: 12, stiffness: 200 },
} as const;

// ─── Filter Presets (Unchanged — calibrated values) ───────────────
export interface FilterPresetDef {
  name: string;
  color: string;
  opacity: number;
  category: FilterCategory;
  description: string;
}

export const FILTER_PRESETS: FilterPresetDef[] = [
  { name: 'Night Reading', color: '#FFB74D', opacity: 0.35, category: 'warm', description: 'Warm amber tint for comfortable reading in low light. Mimics warm incandescent lighting at 2700K.' },
  { name: 'Sleep Mode', color: '#FF8A65', opacity: 0.55, category: 'warm', description: 'Reduced blue light with warm deep-orange tint. Promotes melatonin production before sleep.' },
  { name: 'Reading', color: '#FFCC80', opacity: 0.25, category: 'warm', description: 'Gentle sepia-like warmth optimized for long reading sessions. Reduces eye fatigue.' },
  { name: 'Cinema', color: '#1A1A2E', opacity: 0.45, category: 'cinema', description: 'Warm contrast style inspired by cinematic color grading. Teal-orange undertone for movie viewing.' },
  { name: 'Film', color: '#3E2723', opacity: 0.30, category: 'cinema', description: 'Soft vintage film look with brown undertones. Inspired by Kodak Portra 400 film stock.' },
  { name: 'HDR Style', color: '#1A237E', opacity: 0.12, category: 'cinema', description: 'Subtle deep blue tint simulating HDR clarity. Enhances perceived contrast without darkening.' },
  { name: '4K Style', color: '#0D1B2A', opacity: 0.15, category: 'cinema', description: 'Minimal contrast enhancement with cool-navy base. Simulates 4K display color accuracy.' },
  { name: 'AMOLED Dark', color: '#000000', opacity: 0.50, category: 'amoled', description: 'Pure black overlay for AMOLED screens. Saves battery while providing comfortable dimming.' },
  { name: 'Neutral Dim', color: '#1A1A1A', opacity: 0.40, category: 'neutral', description: 'Dark gray neutral dimming. Softer than pure black for IPS LCD screens.' },
  { name: 'Focus Mode', color: '#90CAF9', opacity: 0.12, category: 'cool', description: 'Subtle cool blue tint that promotes alertness and concentration during work sessions.' },
  { name: 'Red Light', color: '#D32F2F', opacity: 0.40, category: 'red', description: 'Deep red filter for astronomy and night vision preservation. Preserves dark adaptation.' },
  { name: 'Night Vision', color: '#B71C1C', opacity: 0.55, category: 'red', description: 'Intense dark red overlay for maximum night vision preservation during outdoor observations.' },
];

export const QUICK_COLORS: { color: string; label: string; category: FilterCategory }[] = [
  { color: '#FFB74D', label: 'Warm', category: 'warm' },
  { color: '#90CAF9', label: 'Cool', category: 'cool' },
  { color: '#1A1A1A', label: 'Neutral', category: 'neutral' },
  { color: '#1A1A2E', label: 'Cinema', category: 'cinema' },
  { color: '#000000', label: 'AMOLED', category: 'amoled' },
  { color: '#D32F2F', label: 'Red', category: 'red' },
];

export const BRIGHTNESS_ZONES = [
  { threshold: 0.0, label: 'Off' }, { threshold: 0.25, label: 'Subtle' },
  { threshold: 0.50, label: 'Normal' }, { threshold: 0.75, label: 'Strong' },
  { threshold: 1.0, label: 'Max' }, { threshold: 1.25, label: 'Ultra' },
  { threshold: 1.5, label: 'Deep' }, { threshold: 2.0, label: 'AMOLED Dark' },
] as const;
