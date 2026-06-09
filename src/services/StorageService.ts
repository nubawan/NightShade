/**
 * NightShade V4 — Storage Service
 * Extended opacity 0–2.0, more presets, bubble persistence, deletion safety
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { OverlaySettings, FilterPreset, AppTheme, StorageKeys } from '../types';
import { FILTER_PRESETS } from '../theme';

const DEFAULT_SETTINGS: OverlaySettings = {
  enabled: false,
  opacity: 0.3,
  color: '#000000',
  presetId: null,
};

const BUILT_IN_PRESETS: FilterPreset[] = FILTER_PRESETS.map((p, i) => ({
  id: `ns_builtin_${i}_${p.name.replace(/\s+/g, '_').toLowerCase()}`,
  name: p.name,
  opacity: p.opacity,
  color: p.color,
  isBuiltIn: true,
  category: p.category,
  description: p.description,
  createdAt: Date.now(),
  lastUsedAt: null,
}));

class StorageService {
  // ─── Overlay Settings ────────────────────────────────────────
  async getOverlaySettings(): Promise<OverlaySettings> {
    try {
      const raw = await AsyncStorage.getItem(StorageKeys.OVERLAY_SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
  }

  async saveOverlaySettings(s: OverlaySettings): Promise<void> {
    try { await AsyncStorage.setItem(StorageKeys.OVERLAY_SETTINGS, JSON.stringify(s)); } catch {}
  }

  // ─── Presets ─────────────────────────────────────────────────
  async getPresets(): Promise<FilterPreset[]> {
    try {
      const raw = await AsyncStorage.getItem(StorageKeys.PRESETS);
      if (raw) {
        const stored = JSON.parse(raw) as FilterPreset[];
        // Merge new built-in presets if app was updated
        const existingNames = new Set(stored.filter(p => p.isBuiltIn).map(p => p.name));
        const newBuiltIns = BUILT_IN_PRESETS.filter(b => !existingNames.has(b.name));
        if (newBuiltIns.length > 0) {
          const merged = [...stored, ...newBuiltIns];
          await this.savePresets(merged);
          return merged;
        }
        return stored;
      }
      await this.savePresets(BUILT_IN_PRESETS);
      return [...BUILT_IN_PRESETS];
    } catch { return [...BUILT_IN_PRESETS]; }
  }

  async savePresets(p: FilterPreset[]): Promise<void> {
    try { await AsyncStorage.setItem(StorageKeys.PRESETS, JSON.stringify(p)); } catch {}
  }

  async addPreset(p: FilterPreset): Promise<FilterPreset[]> {
    const all = await this.getPresets();
    all.push(p);
    await this.savePresets(all);
    return all;
  }

  async updatePreset(u: FilterPreset): Promise<FilterPreset[]> {
    const all = await this.getPresets();
    const i = all.findIndex(p => p.id === u.id);
    if (i !== -1) { all[i] = u; await this.savePresets(all); }
    return all;
  }

  /**
   * Delete a preset. If the deleted preset is currently active,
   * this method also disables the overlay and resets to default settings.
   * Returns the updated preset list.
   */
  async deletePreset(id: string): Promise<{ presets: FilterPreset[]; wasActive: boolean; resetSettings: OverlaySettings | null }> {
    const settings = await this.getOverlaySettings();
    const wasActive = settings.presetId === id;

    let all = await this.getPresets();
    all = all.filter(p => p.id !== id);
    await this.savePresets(all);

    let resetSettings: OverlaySettings | null = null;
    if (wasActive) {
      // Reset to default — disable overlay, clear preset reference
      resetSettings = {
        enabled: false,
        opacity: 0.3,
        color: '#000000',
        presetId: null,
      };
      await this.saveOverlaySettings(resetSettings);
    }

    return { presets: all, wasActive, resetSettings };
  }

  async markPresetUsed(id: string): Promise<void> {
    const all = await this.getPresets();
    const i = all.findIndex(p => p.id === id);
    if (i !== -1) { all[i].lastUsedAt = Date.now(); await this.savePresets(all); }
  }

  async duplicatePreset(id: string): Promise<FilterPreset[]> {
    const all = await this.getPresets();
    const source = all.find(p => p.id === id);
    if (!source) return all;
    const dup: FilterPreset = {
      ...source,
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${source.name} (Copy)`,
      isBuiltIn: false,
      createdAt: Date.now(),
      lastUsedAt: null,
    };
    all.push(dup);
    await this.savePresets(all);
    return all;
  }

  // ─── Theme ───────────────────────────────────────────────────
  async getAppTheme(): Promise<AppTheme> {
    try { const v = await AsyncStorage.getItem(StorageKeys.APP_THEME); return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'; } catch { return 'system'; }
  }
  async setAppTheme(t: AppTheme): Promise<void> { await AsyncStorage.setItem(StorageKeys.APP_THEME, t); }

  // ─── Startup ─────────────────────────────────────────────────
  async getAutoStart(): Promise<boolean> { try { return (await AsyncStorage.getItem(StorageKeys.AUTO_START)) === 'true'; } catch { return false; } }
  async setAutoStart(v: boolean): Promise<void> { await AsyncStorage.setItem(StorageKeys.AUTO_START, String(v)); }

  async getRestoreFilter(): Promise<boolean> { try { const v = await AsyncStorage.getItem(StorageKeys.RESTORE_FILTER); return v === null ? true : v === 'true'; } catch { return true; } }
  async setRestoreFilter(v: boolean): Promise<void> { await AsyncStorage.setItem(StorageKeys.RESTORE_FILTER, String(v)); }

  // ─── Overlay Controls ────────────────────────────────────────
  async getNotificationControls(): Promise<boolean> { try { const v = await AsyncStorage.getItem(StorageKeys.NOTIFICATION_CONTROLS); return v === null ? true : v === 'true'; } catch { return true; } }
  async setNotificationControls(v: boolean): Promise<void> { await AsyncStorage.setItem(StorageKeys.NOTIFICATION_CONTROLS, String(v)); }

  async getFloatingWidget(): Promise<boolean> { try { return (await AsyncStorage.getItem(StorageKeys.FLOATING_WIDGET)) === 'true'; } catch { return false; } }
  async setFloatingWidget(v: boolean): Promise<void> { await AsyncStorage.setItem(StorageKeys.FLOATING_WIDGET, String(v)); }

  // ─── Bubble Persistence ──────────────────────────────────────
  async getBubbleEnabled(): Promise<boolean> { try { return (await AsyncStorage.getItem(StorageKeys.BUBBLE_ENABLED)) === 'true'; } catch { return false; } }
  async setBubbleEnabled(v: boolean): Promise<void> { await AsyncStorage.setItem(StorageKeys.BUBBLE_ENABLED, String(v)); }
}

export const storageService = new StorageService();
