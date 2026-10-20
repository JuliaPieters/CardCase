import { Injectable, signal } from '@angular/core';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';

export type SyncStatus = 'guest' | 'loading' | 'saving' | 'saved' | 'error';

/** Firebase Authentication + the user's document in Firestore (users/{uid}, field `cardcase`). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** False while firebase.config.ts is not filled in: the app then only offers guest mode. */
  readonly enabled = !!firebaseConfig.apiKey;
  /** Signed-in user, or null for guest. */
  readonly user = signal<User | null>(null);
  /** True once Firebase has told us whether a session was restored. */
  readonly ready = signal(!this.enabled);
  readonly syncStatus = signal<SyncStatus>('guest');

  private auth?: Auth;
  private db?: Firestore;
  /** Firebase is loaded on demand so it stays out of the initial bundle. */
  private readonly sdk = this.enabled ? loadSdk() : null;

  constructor() {
    this.sdk?.then(({ app, authMod, fsMod }) => {
      const a = app.initializeApp(firebaseConfig);
      this.auth = authMod.getAuth(a);
      this.auth.languageCode = 'nl';
      this.db = fsMod.getFirestore(a);
      authMod.onAuthStateChanged(this.auth, (u) => {
        this.user.set(u);
        this.ready.set(true);
      });
    });
  }

  async login(email: string, password: string) {
    const { authMod } = await this.requireSdk();
    await authMod.signInWithEmailAndPassword(this.auth!, email.trim(), password);
  }

  async register(name: string, email: string, password: string) {
    const { authMod } = await this.requireSdk();
    const cred = await authMod.createUserWithEmailAndPassword(this.auth!, email.trim(), password);
    if (name.trim()) {
      await authMod.updateProfile(cred.user, { displayName: name.trim() });
      this.user.set(this.auth!.currentUser);
    }
  }

  async resetPassword(email: string) {
    const { authMod } = await this.requireSdk();
    await authMod.sendPasswordResetEmail(this.auth!, email.trim());
  }

  async logout() {
    const { authMod } = await this.requireSdk();
    await authMod.signOut(this.auth!);
  }

  /** The saved Cardcase data of this account, or null when it has none yet. */
  async loadRemote(uid: string): Promise<Record<string, unknown> | null> {
    const { fsMod } = await this.requireSdk();
    const snap = await fsMod.getDoc(fsMod.doc(this.db!, 'users', uid));
    return (snap.data()?.['cardcase'] as Record<string, unknown> | undefined) ?? null;
  }

  /** Writes the Cardcase data into users/{uid}, leaving any other fields in that document alone. */
  async saveRemote(uid: string, data: Record<string, unknown>) {
    const { fsMod } = await this.requireSdk();
    await fsMod.setDoc(fsMod.doc(this.db!, 'users', uid), { cardcase: data, updatedAt: fsMod.serverTimestamp() }, { merge: true });
  }

  private async requireSdk() {
    if (!this.sdk) throw new Error('Firebase is niet geconfigureerd (src/app/core/firebase.config.ts).');
    return this.sdk;
  }
}

async function loadSdk() {
  const [app, authMod, fsMod] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
  return { app, authMod, fsMod };
}

/** Dutch message for a Firebase Auth / Firestore error. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Dat e-mailadres klopt niet.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mailadres of wachtwoord klopt niet.';
    case 'auth/email-already-in-use':
      return 'Er bestaat al een account met dit e-mailadres. Log in of reset je wachtwoord.';
    case 'auth/weak-password':
      return 'Kies een wachtwoord van minstens 6 tekens.';
    case 'auth/too-many-requests':
      return 'Te veel pogingen. Wacht even en probeer het opnieuw.';
    case 'auth/network-request-failed':
      return 'Geen verbinding. Controleer je internet.';
    case 'auth/operation-not-allowed':
      return 'Deze inlogmethode staat uit in Firebase (Authentication → Sign-in method).';
    case 'permission-denied':
      return 'Geen toegang tot je gegevens. Controleer de Firestore-regels voor users/{uid}.';
    default:
      return err instanceof Error ? err.message : 'Er ging iets mis.';
  }
}
