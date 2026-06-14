/**
 * NightShade — Crashlytics Service
 *
 * Wraps Firebase Crashlytics for production crash reporting.
 * Falls back silently in development or when Crashlytics is not configured.
 *
 * Best practices:
 * - Set a non-PII user identifier for support ticket correlation
 * - Add breadcrumb logs before risky operations
 * - Record non-fatal errors, not just crashes
 * - NEVER log PII (emails, names, addresses, tokens)
 */

import { Platform } from 'react-native';

// Lazy import — Crashlytics native module may not be available
// until Firebase is configured (google-services.json)
let crashlytics: any = null;
try {
  crashlytics = require('@react-native-firebase/crashlytics').default;
} catch {
  // Crashlytics not configured — silent fallback
}

class CrashlyticsService {
  private enabled: boolean = false;

  constructor() {
    this.enabled = Platform.OS === 'android' && crashlytics !== null;
  }

  /**
   * Initialize Crashlytics. Call once on app startup.
   * Sets collection enabled/disabled based on build config.
   */
  async init(): Promise<void> {
    if (!this.enabled || !crashlytics) return;

    try {
      // Enable automatic crash collection
      await crashlytics().setCrashlyticsCollectionEnabled(true);
    } catch {
      // Silently fail — Crashlytics may not be configured yet
    }
  }

  /**
   * Set a non-PII user identifier for crash report correlation.
   * Use a hashed ID, never email or name.
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.enabled || !crashlytics) return;
    try {
      await crashlytics().setUserId(userId);
    } catch {}
  }

  /**
   * Log a breadcrumb — appears in crash timeline.
   * NEVER log PII here.
   */
  log(message: string): void {
    if (!this.enabled || !crashlytics) return;
    try {
      crashlytics().log(message);
    } catch {}
  }

  /**
   * Record a non-fatal error.
   * Use in catch blocks for important flows.
   */
  recordError(error: Error): void {
    if (!this.enabled || !crashlytics) return;
    try {
      crashlytics().recordError(error);
    } catch {}
  }

  /**
   * Trigger a test crash. REMOVE before production release.
   * Only for verifying Crashlytics integration.
   */
  testCrash(): void {
    if (!this.enabled || !crashlytics) return;
    crashlytics().crash();
  }
}

export const crashlyticsService = new CrashlyticsService();
