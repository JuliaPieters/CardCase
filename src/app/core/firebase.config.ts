import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app config, read at startup from public/firebase-config.json.
 * The values come from the Firebase console (Project settings → General → Your apps → SDK setup) and aren't secret:
 * they ship to every browser anyway. Access is controlled by the Firestore rules in firestore.rules.
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
