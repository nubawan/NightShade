/**
 * NightShade V5 — Overlay Permission Guard
 *
 * Monitors SYSTEM_ALERT_WINDOW permission continuously.
 * If the user revokes it (e.g. via system settings), the guard:
 * 1. Detects the permission loss
 * 2. Disables the overlay (prevents crash/ANR)
 * 3. Triggers the permission screen
 *
 * The guard also checks permission BEFORE any overlay action,
 * so users get a clear re-permission flow instead of a silent failure.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { overlayService } from '../services/OverlayService';

/** Hook: monitor overlay permission. Returns { hasPermission, checkNow } */
export function useOverlayPermission() {
  const [hasPermission, setHasPermission] = useState(true);
  const appState = useRef(AppState.currentState);

  const checkNow = useCallback(async (): Promise<boolean> => {
    try {
      const has = await overlayService.hasPermission();
      setHasPermission(has);
      if (!has) {
        // Permission was lost — disable overlay to prevent crash
        try { await overlayService.disable(); } catch {}
      }
      return has;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkNow();
  }, [checkNow]);

  // Re-check when app comes back to foreground (user may have toggled permission in settings)
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (appState.current !== 'active' && nextState === 'active') {
        checkNow();
      }
      appState.current = nextState;
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [checkNow]);

  return { hasPermission, checkNow };
}

/**
 * Guard: wraps any action that requires overlay permission.
 * If permission is missing, returns false and triggers the permission flow.
 * Use before: toggle, setOpacity, setColor, applyPreset, showBubble, etc.
 */
export async function guardOverlayPermission(): Promise<boolean> {
  try {
    const has = await overlayService.hasPermission();
    if (!has) {
      // Disable to prevent native crash
      try { await overlayService.disable(); } catch {}
    }
    return has;
  } catch {
    return false;
  }
}
