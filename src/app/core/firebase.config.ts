import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app config, read at startup from public/firebase-config.json.
 * The file is git-ignored: `npm run build` writes it from FIREBASE_* environment variables (scripts/write-firebase-config.mjs);
 * locally, copy public/firebase-config.example.json. The values reach every browser anyway, so protection comes from the
 * Firestore rules (firestore.rules) and from restricting the API key to this site and the Firebase APIs.
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
