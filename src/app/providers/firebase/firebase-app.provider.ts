import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

// Enige plek die de Firebase-SDK initialiseert (zie docs/governance/ARCHITECTURE.md:
// "alleen Providers mag met Firebase praten"). Repo-bestanden injecteren FIRESTORE/
// FIREBASE_AUTH via deze tokens, nooit een eigen `getFirestore()`-aanroep.
const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');

// Emulator-poorten conform firebase.json.
const FIRESTORE_EMULATOR_PORT = 8080;
const AUTH_EMULATOR_PORT = 9099;

function createFirestore(app: FirebaseApp): Firestore {
  const firestore = getFirestore(app);
  if (environment.useFirebaseEmulator) {
    connectFirestoreEmulator(firestore, 'localhost', FIRESTORE_EMULATOR_PORT);
  }
  return firestore;
}

function createAuth(app: FirebaseApp): Auth {
  const auth = getAuth(app);
  if (environment.useFirebaseEmulator) {
    connectAuthEmulator(auth, `http://localhost:${AUTH_EMULATOR_PORT}`, { disableWarnings: true });
  }
  return auth;
}

export function provideFirebase(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: FIREBASE_APP, useFactory: () => initializeApp(environment.firebase) },
    { provide: FIRESTORE, useFactory: createFirestore, deps: [FIREBASE_APP] },
    { provide: FIREBASE_AUTH, useFactory: createAuth, deps: [FIREBASE_APP] },
  ]);
}
