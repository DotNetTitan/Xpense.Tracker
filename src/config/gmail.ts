/**
 * Gmail configuration.
 *
 * Auth is handled by @react-native-google-signin/google-signin (native SDK).
 * The Android OAuth client in GCP (package + SHA-1) is what makes sign-in
 * work — no client secret or redirect URI needed in JS code.
 *
 * GCP Android client:
 *   ID:      399444816579-9jso2357r99ha3ab8oei1m7ad203da9k.apps.googleusercontent.com
 *   Package: com.xpensetracker.app
 *   SHA-1:   80:F5:F9:A5:CA:2D:E0:04:D8:AA:5F:18:AE:48:E2:99:63:27:2B:36
 */

export const GMAIL_CONFIG = {
  /** Gmail read-only scope — we only ever read receipts, never write. */
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
} as const;
