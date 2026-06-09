/**
 * NightShade V4 — Utility Helpers
 */

import { Linking } from 'react-native';
import { overlayService } from '../services/OverlayService';
import { BrightnessMode } from '../types';

// ─── Permissions ──────────────────────────────────────────────────
export const checkPermission = () => overlayService.hasPermission();
export const requestPermission = async () => {
  try { await overlayService.requestPermission(); } catch { Linking.openSettings(); }
};
export const openBattery = () => { try { overlayService.openBatterySettings(); } catch { Linking.openSettings(); } };

// ─── ID / Formatting ─────────────────────────────────────────────
export const genId = () => `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Convert opacity (0.0–2.0) to display percentage string.
 * 1.0 = 100%, 2.0 = 200%
 */
export const pctStr = (o: number) => `${Math.round(o * 100)}%`;

/** Get brightness mode label from opacity value */
export const getBrightnessMode = (o: number): BrightnessMode => {
  if (o <= 0) return 'normal';
  if (o <= 0.75) return 'normal';
  if (o <= 1.0) return 'strong';
  if (o <= 1.5) return 'ultra';
  return 'amoled';
};

/** Get human-friendly brightness zone label */
export const getBrightnessLabel = (o: number): string => {
  if (o <= 0) return 'Off';
  if (o <= 0.15) return 'Subtle';
  if (o <= 0.40) return 'Light';
  if (o <= 0.65) return 'Normal';
  if (o <= 0.85) return 'Strong';
  if (o <= 1.0) return 'Maximum';
  if (o <= 1.25) return 'Ultra';
  if (o <= 1.5) return 'Deep';
  if (o <= 1.75) return 'Intense';
  return 'AMOLED Dark';
};

// ─── Color Conversions ────────────────────────────────────────────
export const hexToRgb = (hex: string) => {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const n = parseInt(full.length === 8 ? full.slice(2) : full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');

export const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  const s = mx === 0 ? 0 : d / mx;
  if (d) { switch (mx) { case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break; case g: h = ((b - r) / d + 2) / 6; break; case b: h = ((r - g) / d + 4) / 6; break; } }
  return { h: h * 360, s: s * 100, v: mx * 100 };
};

export const hsvToRgb = (h: number, s: number, v: number) => {
  h /= 360; s /= 100; v /= 100;
  let r: number, g: number, b: number;
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break; default: r = v; g = p; b = q;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

export const colorLabel = (hex: string): string => {
  const m: Record<string, string> = {
    '#000000': 'Black', '#1A1A1A': 'Dark Gray', '#FFB74D': 'Amber',
    '#FF8A65': 'Deep Orange', '#FFCC80': 'Gold', '#D32F2F': 'Red',
    '#B71C1C': 'Dark Red', '#90CAF9': 'Blue', '#1A1A2E': 'Navy',
    '#3E2723': 'Brown', '#1A237E': 'Indigo', '#0D1B2A': 'Midnight',
  };
  return m[hex.toUpperCase()] || m[hex.toLowerCase()] || 'Custom';
};

// ─── Debounce ─────────────────────────────────────────────────────
export const debounce = <T extends (...a: any[]) => any>(fn: T, ms: number) => {
  let t: ReturnType<typeof setTimeout> | null;
  return (...a: Parameters<T>) => { if (t) clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

// ─── Date Formatting ──────────────────────────────────────────────
export const formatDate = (ts: number | null) => {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// ─── Clamp ────────────────────────────────────────────────────────
export const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));
