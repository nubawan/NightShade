/**
 * NightShade V5 — Type Definitions
 * Extended brightness (0–180%), enhanced filter system, accordion settings
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

// ─── Filters ──────────────────────────────────────────────────────
export interface FilterPreset {
  id: string;
  name: string;
  /** 0.0–1.80 (safety capped) */
  opacity: number;
  color: string;
  isBuiltIn?: boolean;
  category?: FilterCategory;
  description?: string;
  createdAt: number;
  lastUsedAt: number | null;
}

/** Backward-compatible alias — older components import Preset */
export type Preset = FilterPreset;

export type FilterCategory =
  | 'warm'
  | 'cool'
  | 'neutral'
  | 'cinema'
  | 'amoled'
  | 'red'
  | 'custom';

// ─── Theme ────────────────────────────────────────────────────────
export type AppTheme = 'light' | 'dark' | 'system';

// ─── Navigation ───────────────────────────────────────────────────
export type BottomTab = 'home' | 'presets' | 'settings';

// ─── Settings Accordion ───────────────────────────────────────────
export type SettingsSection =
  | 'appearance'
  | 'overlay'
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
}
