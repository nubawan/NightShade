/**
 * NightShade V5 — Overlay State Store
 *
 * SINGLE SOURCE OF TRUTH for overlay state.
 * All controls (Dashboard, Bubble, Notification, Tile) must read/write here.
 *
 * Architecture:
 *   - Native side owns the authoritative state (OverlayService.currentOpacity, etc.)
 *   - JS side reads native state on mount and after every change
 *   - EventBridge sends state changes from native → JS (via DeviceEventEmitter)
 *   - All JS UI surfaces subscribe to OverlayStateStore updates
 *
 * This eliminates the "toggle ON in bubble, still OFF in app" bug.
 */

import { NativeModules, DeviceEventEmitter } from 'react-native';
import { OverlaySettings } from '../types';

const M = NativeModules.OverlayModule;

export interface OverlayState {
  enabled: boolean;
  opacity: number;  // 0.0–2.0
  color: string;
  presetId: string | null;
}

type Listener = (state: OverlayState) => void;

class OverlayStateStore {
  private state: OverlayState = {
    enabled: false,
    opacity: 0.3,
    color: '#000000',
    presetId: null,
  };

  private listeners: Set<Listener> = new Set();
  private nativeListener: any = null;

  /** Initialize — call once at app start. Subscribes to native events. */
  init() {
    // Listen for state updates from native side (bubble, notification, tile)
    this.nativeListener = DeviceEventEmitter.addListener('NightShadeStateUpdate', (payload: OverlayState) => {
      this.state = { ...payload };
      this.notify();
    });

    // Also poll native state on init
    this.syncFromNative();
  }

  /** Cleanup */
  destroy() {
    this.nativeListener?.remove();
    this.listeners.clear();
  }

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** Get current state (synchronous snapshot) */
  getState(): OverlayState {
    return { ...this.state };
  }

  /** Sync state from native side (async read) */
  async syncFromNative(): Promise<OverlayState> {
    try {
      const enabled = await M.isOverlayEnabled();
      // Read persisted settings for the rest
      const { storageService } = require('../services/StorageService');
      const settings = await storageService.getOverlaySettings();
      this.state = {
        enabled,
        opacity: settings.opacity,
        color: settings.color,
        presetId: settings.presetId,
      };
      this.notify();
    } catch {}
    return this.state;
  }

  // ─── Write Methods (update both native + local state) ─────────

  /** Returns true if action succeeded, false if permission was denied */
  async setEnabled(enabled: boolean): Promise<boolean> {
    try {
      if (enabled) {
        // Check permission before enabling overlay
        const hasPermission = await M.hasOverlayPermission();
        if (!hasPermission) {
          // Permission lost — update state to reflect reality
          this.state = { ...this.state, enabled: false };
          this.notify();
          return false; // Signal: permission denied
        }
        await M.updateOverlay(true, this.state.opacity, this.state.color);
      } else {
        await M.disableOverlay();
      }
      await M.updateTileState(enabled);
      this.state = { ...this.state, enabled };
      await this.persistSettings();
      this.notify();
      return true;
    } catch { return false; }
  }

  /** Returns true if toggle succeeded, false if permission was denied */
  async toggle(): Promise<boolean> {
    return this.setEnabled(!this.state.enabled);
  }

  /** Returns true if action succeeded, false if permission was denied */
  async setOpacity(opacity: number): Promise<boolean> {
    const clamped = Math.max(0, Math.min(1.80, opacity)); // MAX_SAFE_OPACITY = 1.80
    try {
      // Check permission before enabling overlay (setOpacity auto-enables)
      const hasPermission = await M.hasOverlayPermission();
      if (!hasPermission) {
        this.state = { ...this.state, enabled: false };
        this.notify();
        return false; // Signal: permission denied
      }
      await M.setOpacity(clamped);
      this.state = { ...this.state, opacity: clamped, enabled: true };
      await this.persistSettings();
      this.notify();
      return true;
    } catch { return false; }
  }

  async setColor(color: string): Promise<void> {
    try {
      await M.setColor(color);
      this.state = { ...this.state, color, presetId: null, enabled: true };
      await this.persistSettings();
      this.notify();
    } catch {}
  }

  /** Returns true if action succeeded, false if permission was denied */
  async applyPreset(presetId: string, opacity: number, color: string): Promise<boolean> {
    try {
      // Check permission before enabling overlay
      const hasPermission = await M.hasOverlayPermission();
      if (!hasPermission) {
        this.state = { ...this.state, enabled: false };
        this.notify();
        return false; // Signal: permission denied
      }
      const newState: OverlaySettings = { enabled: true, opacity, color, presetId };
      await M.updateOverlay(true, opacity, color);
      await M.updateTileState(true);
      this.state = { enabled: true, opacity, color, presetId };
      const { storageService } = require('../services/StorageService');
      await storageService.markPresetUsed(presetId);
      await this.persistSettings();
      this.notify();
      return true;
    } catch { return false; }
  }

  async deleteActivePreset(): Promise<void> {
    // When active filter is deleted, disable overlay and reset
    try {
      await M.disableOverlay();
      await M.updateTileState(false);
      this.state = { enabled: false, opacity: 0.3, color: '#000000', presetId: null };
      await this.persistSettings();
      this.notify();
    } catch {}
  }

  // ─── Internal ──────────────────────────────────────────────────

  private async persistSettings(): Promise<void> {
    try {
      const { storageService } = require('../services/StorageService');
      await storageService.saveOverlaySettings({
        enabled: this.state.enabled,
        opacity: this.state.opacity,
        color: this.state.color,
        presetId: this.state.presetId,
      });
    } catch {}
  }

  private notify(): void {
    const snapshot = { ...this.state };
    this.listeners.forEach(fn => fn(snapshot));
  }
}

/** Singleton — import this everywhere */
export const overlayStore = new OverlayStateStore();
