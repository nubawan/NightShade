import { NativeModules, Linking, Platform } from 'react-native';
import { overlayService } from '../services/OverlayService';

/**
 * Check if the app has the SYSTEM_ALERT_WINDOW permission
 */
export async function checkOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  return overlayService.hasPermission();
}

/**
 * Request the SYSTEM_ALERT_WINDOW permission by opening system settings
 */
export async function requestOverlayPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    await overlayService.requestPermission();
  } catch (e) {
    // Fallback: open app settings directly
    Linking.openSettings();
  }
}

/**
 * Open battery optimization settings for the app
 */
export function openBatterySettings(): void {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    NativeModules.OverlayModule?.openBatterySettings?.();
  } catch {
    Linking.openSettings();
  }
}

/**
 * Generate a unique ID for presets
 */
export function generateId(): string {
  return 'preset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Convert opacity (0.0–2.0) to percentage string.
 * 1.0 = 100%, 2.0 = 200% (extended brightness)
 */
export function opacityToPercent(opacity: number): string {
  return `${Math.round(opacity * 100)}%`;
}

/**
 * Convert percentage to opacity (0.0–2.0 range for extended brightness).
 * 100% → 1.0, 200% → 2.0
 */
export function percentToOpacity(percent: number): number {
  return Math.max(0, Math.min(2, percent / 100));
}
