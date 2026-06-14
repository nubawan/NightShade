/**
 * NightShade Revamp — Utility Helpers
 * Void Architecture design system utilities + legacy compat
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

// Legacy aliases for old components
export const checkOverlayPermission = checkPermission;
export const requestOverlayPermission = requestPermission;
export const openBatterySettings = openBattery;

// ─── ID / Formatting ─────────────────────────────────────────────
export const genId = () => `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Convert opacity (0.0–2.0) to display percentage string.
 * 1.0 = 100%, 2.0 = 200%
 */
export const pctStr = (o: number) => `${Math.round(o * 100)}%`;

/**
 * Legacy: Convert opacity to percent number.
 */
export const opacityToPercent = (o: number) => Math.round(o * 100);

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

/**
 * Revamp: Two-word opacity description for labels.
 * 0.10 → "Subtle Tint", 0.55 → "Strong Dim"
 */
export const opacityToLabel = (o: number): string => {
  if (o <= 0) return 'Off';
  if (o <= 0.10) return 'Subtle Tint';
  if (o <= 0.20) return 'Light Tint';
  if (o <= 0.35) return 'Moderate Dim';
  if (o <= 0.50) return 'Standard Dim';
  if (o <= 0.65) return 'Strong Dim';
  if (o <= 0.80) return 'Deep Dim';
  if (o <= 1.0) return 'Maximum Dim';
  if (o <= 1.30) return 'Extended Dim';
  if (o <= 1.60) return 'Ultra Dim';
  return 'Extreme Dim';
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
    '#C45B1A': 'Orange Teal', '#050B18': 'Cine Black',
    '#0A1428': 'Anamorphic', '#D4A855': 'Kodak', '#C45000': 'Amber',
    '#0F0F12': 'Noir', '#1A2840': '4K Ref', '#12182E': '8K HDR',
    '#C8E8FF': 'Arctic', '#FF6A40': 'Sleep', '#FFB03A': 'Golden Hour',
    '#C8903A': 'Tobacco', '#0A0505': 'Midnight Oil', '#1A0000': 'Observatory',
    '#5BB8D4': 'Ice Blue',
  };
  return m[hex.toUpperCase()] || m[hex.toLowerCase()] || 'Custom';
};

// Legacy alias
export const getColorName = colorLabel;

// ─── Live Canvas Blending ─────────────────────────────────────────

/**
 * Blends a filter color at a given opacity over #08090B (void-black).
 * Returns the resulting hex color for use as the Live Canvas background.
 * Clamps opacity to 0.0–0.60 for the UI background (even if filter is higher).
 */
export function blendFilterOverBlack(filterHex: string, filterOpacity: number): string {
  const clampedOp = Math.min(filterOpacity, 0.60);
  const base = { r: 8, g: 9, b: 11 }; // #08090B
  const filter = hexToRgb(filterHex);
  const r = Math.round(base.r * (1 - clampedOp) + filter.r * clampedOp);
  const g = Math.round(base.g * (1 - clampedOp) + filter.g * clampedOp);
  const b = Math.round(base.b * (1 - clampedOp) + filter.b * clampedOp);
  return rgbToHex(r, g, b);
}

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
