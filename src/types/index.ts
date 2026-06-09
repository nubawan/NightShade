/**
 * NightShade V4 — Type Definitions
 * Extended brightness (0–200%), enhanced filter system, accordion settings
 */

// ─── Overlay ──────────────────────────────────────────────────────
export interface OverlaySettings {
  enabled: boolean;
  /** 0.0–2.0 (0%–200%) — values >1.0 trigger multi-layer overlay */
  opacity: number;
  color: string;
  presetId: string | null;
}

// ─── Filters ──────────────────────────────────────────────────────
export interface FilterPreset {
  id: string;
  name: string;
  /** 0.0–2.0 */
  opacity: number;
  color: string;
  isBuiltIn?: boolean;
  category?: FilterCategory;
  description?: string;
  createdAt: number;
  lastUsedAt: number | null;
}

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
