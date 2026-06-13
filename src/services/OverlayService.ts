/**
 * NightShade V4 — Overlay Service Bridge
 * Extended opacity (0–2.0), brightness set (replaces +/-), bubble persistence
 */

import { NativeModules, Platform } from 'react-native';
import { OverlaySettings } from '../types';

const M = NativeModules.OverlayModule;

const guard = <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  if (Platform.OS !== 'android') return Promise.resolve(fallback);
  try { return fn(); } catch { return Promise.resolve(fallback); }
};

/** Clamp opacity to 0–MAX_SAFE_OPACITY range for safety */
const MAX_SAFE_OPACITY = 1.80; // Matches native OverlayService.MAX_SAFE_OPACITY
const clampOpacity = (o: number) => Math.max(0, Math.min(MAX_SAFE_OPACITY, o));

export const overlayService = {
  // ─── Overlay Control ──────────────────────────────────────────
  enable: (): Promise<void> => guard(() => M.enableOverlay(), undefined),
  disable: (): Promise<void> => guard(() => M.disableOverlay(), undefined),
  toggle: (): Promise<boolean> => guard(() => M.toggleOverlay(), false),
  isEnabled: (): Promise<boolean> => guard(() => M.isOverlayEnabled(), false),

  // ─── Overlay Properties ───────────────────────────────────────
  /** Set opacity 0.0–MAX_SAFE_OPACITY (extended brightness range with safety cap) */
  setOpacity: (o: number): Promise<void> => guard(() => M.setOpacity(clampOpacity(o)), undefined),
  setColor: (c: string): Promise<void> => guard(() => M.setColor(c), undefined),
  /** Full update with extended opacity support (safety capped) */
  update: (s: OverlaySettings): Promise<void> =>
    guard(() => M.updateOverlay(s.enabled, clampOpacity(s.opacity), s.color), undefined),

  // ─── Brightness Set (replaces +/-) ────────────────────────────
  /** Set brightness to a specific level 0.0–MAX_SAFE_OPACITY */
  setBrightness: (level: number): Promise<void> =>
    guard(() => M.setOpacity(clampOpacity(level)), undefined),
  brightnessUp: (): Promise<void> => guard(() => M.brightnessUp(), undefined),
  brightnessDown: (): Promise<void> => guard(() => M.brightnessDown(), undefined),

  // ─── Emergency Reset ──────────────────────────────────────────
  /** Emergency reset: reduces brightness to safe 50% if user is locked out */
  emergencyReset: (): Promise<void> => guard(() => M.emergencyReset(), undefined),

  // ─── Permissions ──────────────────────────────────────────────
  hasPermission: (): Promise<boolean> => guard(() => M.hasOverlayPermission(), false),
  requestPermission: (): Promise<void> => guard(() => M.requestOverlayPermission(), undefined),

  // ─── Service Control ──────────────────────────────────────────
  startService: (): Promise<void> => guard(() => M.startService(), undefined),
  stopService: (): Promise<void> => guard(() => M.stopService(), undefined),

  // ─── Floating Bubble ──────────────────────────────────────────
  showBubble: (): Promise<void> => guard(() => M.showBubble(), undefined),
  hideBubble: (): Promise<void> => guard(() => M.hideBubble(), undefined),
  isBubbleVisible: (): Promise<boolean> => guard(() => M.isBubbleVisible(), false),

  // ─── Quick Tile ───────────────────────────────────────────────
  updateTile: (e: boolean): Promise<void> => guard(() => M.updateTileState(e), undefined),

  // ─── System ───────────────────────────────────────────────────
  openBatterySettings: (): Promise<void> => guard(() => M.openBatterySettings(), undefined),
};
