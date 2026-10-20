// Writes public/firebase-config.json from environment variables (set them in Vercel → Settings → Environment Variables).
// Runs before every `npm run build`. Without the variables an existing local file is kept; without either the app runs in guest mode.
import { existsSync, writeFileSync } from 'node:fs';

const out = new URL('../public/firebase-config.json', import.meta.url);
const env = {
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  storageBucket: 'FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId: 'FIREBASE_APP_ID',
};

if (process.env.FIREBASE_API_KEY) {
  const config = Object.fromEntries(Object.entries(env).map(([k, v]) => [k, process.env[v] ?? '']));
  writeFileSync(out, JSON.stringify(config, null, 2) + '\n');
  console.log('[firebase-config] geschreven uit omgevingsvariabelen');
} else if (existsSync(out)) {
  console.log('[firebase-config] bestaand public/firebase-config.json gebruikt');
} else {
  console.warn('[firebase-config] geen FIREBASE_API_KEY: de app draait zonder inloggen (gastmodus)');
}
