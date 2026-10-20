import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app config, read at startup from public/firebase-config.json.
 * That file is git-ignored (this repo is public); copy public/firebase-config.example.json and fill it with the values from
 * the Firebase console: Project settings → General → Your apps → SDK setup (Config).
 * The values aren't secret (they ship in the browser bundle anyway); access is controlled by the Firestore rules.
 * Without the file, or with an empty `apiKey`, login is disabled and the app runs in guest mode.
 */
export let firebaseConfig: FirebaseOptions = {};

export async function loadFirebaseConfig(): Promise<void> {
  try {
    const res = await fetch('firebase-config.json');
    if (res.ok) firebaseConfig = await res.json();
  } catch {
    // No config: guest mode.
  }
}
