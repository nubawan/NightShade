/**
 * NightShade — Notification Permission Utility
 *
 * On Android 13+ (API 33), POST_NOTIFICATIONS is a runtime permission.
 * Without it, foreground service notifications are silently blocked —
 * the filter notification never appears, so the user has nothing to tap.
 *
 * This module provides a single `ensureNotificationPermission()` function
 * that should be called BEFORE starting any foreground service.
 */

import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';

/**
 * Request POST_NOTIFICATIONS permission on Android 13+.
 * On older versions, the permission is automatically granted.
 *
 * @returns true if permission is granted (or not required), false if denied
 */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  // Android 12 and below — permission is automatic, skip
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const already = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (already) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: 'Notification Permission',
      message:
        'Allow notifications so you can control the filter opacity from the status bar.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Permission needed',
      'Please enable Notifications for this app in Settings \u2192 Apps \u2192 Notifications.',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
    return false;
  }

  return result === PermissionsAndroid.RESULTS.GRANTED;
};
