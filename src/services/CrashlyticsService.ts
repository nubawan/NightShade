/**
 * NightShade — Crashlytics Service (STUB)
 *
 * Firebase Crashlytics has been removed from this app.
 * This stub preserves the API surface so existing call sites
 * continue to compile without errors.
 *
 * If crash reporting is needed in the future, replace this
 * with a real implementation (e.g., Sentry, Firebase Crashlytics).
 */

class CrashlyticsService {
  private enabled: boolean = false;

  constructor() {
    this.enabled = false;
  }

  /**
   * No-op init. Kept for API compatibility.
   */
  async init(): Promise<void> {
    // No-op: Firebase removed
  }

  /**
   * No-op setUserId. Kept for API compatibility.
   */
  async setUserId(_userId: string): Promise<void> {
    // No-op: Firebase removed
  }

  /**
   * No-op log. Kept for API compatibility.
   */
  log(_message: string): void {
    // No-op: Firebase removed
  }

  /**
   * No-op recordError. Kept for API compatibility.
   */
  recordError(_error: Error): void {
    // No-op: Firebase removed
  }

  /**
   * No-op testCrash. Kept for API compatibility.
   */
  testCrash(): void {
    // No-op: Firebase removed
  }
}

export const crashlyticsService = new CrashlyticsService();
