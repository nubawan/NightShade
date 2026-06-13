/**
 * NightShade Revamp — Type Definitions
 * Updated for Void Architecture, Cinema presets, Privacy filter
 */

// ─── Overlay ──────────────────────────────────────────────────────
export interface OverlaySettings {
  enabled: boolean;
  /** 0.0–1.80 (0%–180%) — values >1.0 trigger multi-layer overlay.
   *  Capped at 1.80 (not 2.0) to prevent screen lockout. */
  opacity: number;
  color: string;
  presetId: string | null;
}

// ─── Preset Categories (Revamp) ───────────────────────────────────
export type PresetCategory =
  | 'Cinema'
  | 'Clarity'
  | 'Warm'
  | 'Deep'
  | 'Cool'
  | 'Custom';

// Legacy category aliases (for migration from old lowercase values)
export type LegacyFilterCategory =
  | 'warm'
  | 'cool'
  | 'neutral'
  | 'cinema'
  | 'amoled'
  | 'red'
  | 'custom';

// ─── Filter Preset (Revamp) ───────────────────────────────────────
export interface FilterPreset {
  id: string;
  name: string;
  /** 0.0–1.80 (safety capped) */
  opacity: number;
  color: string;            // hex, e.g. "#C45B1A"
  category: PresetCategory | LegacyFilterCategory;
  description: string;      // max 80 chars, required
  isCinema?: boolean;       // true for the cinema/clarity categories
  isBuiltIn?: boolean;
  createdAt: number;
  lastUsedAt: number | null;
}

/** Backward-compatible alias — older components import Preset */
export type Preset = FilterPreset;

// Legacy FilterCategory export for backward compat
export type FilterCategory = PresetCategory | LegacyFilterCategory;

// ─── Privacy Filter ───────────────────────────────────────────────
export type PrivacyDensity = 'subtle' | 'standard' | 'strong';

// ─── Theme ────────────────────────────────────────────────────────
export type AppTheme = 'light' | 'dark' | 'system';

// ─── Navigation ───────────────────────────────────────────────────
export type BottomTab = 'home' | 'presets' | 'settings';

// ─── Settings Accordion ───────────────────────────────────────────
export type SettingsSection =
  | 'appearance'
  | 'overlay'
  | 'privacy'
  | 'startup'
  | 'advanced';

// ─── Brightness Mode ──────────────────────────────────────────────
export type BrightnessMode = 'normal' | 'strong' | 'ultra' | 'amoled';

// ─── Storage Keys ─────────────────────────────────────────────────
export enum StorageKeys {
  OVERLAY_SETTINGS      = 'ns_overlay_settings',
  PRESETS               = 'ns_presets',
  APP_THEME             = 'ns_app_theme',
  AUTO_START            = 'ns_auto_start',
  RESTORE_FILTER        = 'ns_restore_filter',
  NOTIFICATION_CONTROLS = 'ns_notification_controls',
  FLOATING_WIDGET       = 'ns_floating_widget',
  BUBBLE_AUTO_HIDE      = 'ns_bubble_auto_hide',
  BUBBLE_ENABLED        = 'ns_bubble_enabled',
  QUICK_TILE_ENABLED    = 'ns_quick_tile_enabled',
  PRIVACY_FILTER_ENABLED = 'ns_privacy_filter_enabled',
  PRIVACY_DENSITY        = 'ns_privacy_density',
  PRIVACY_WALL_OPACITY   = 'ns_privacy_wall_opacity',
}
