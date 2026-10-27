import { Injectable, signal } from '@angular/core';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';
import { REMOTE_FIELD, remoteUser } from './persist';

export type SyncStatus = 'guest' | 'loading' | 'saving' | 'saved' | 'error';

/** Firebase Authentication + the user's document in Firestore (users/{uid}, field REMOTE_FIELD; see core/persist). */
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
    return remoteUser(snap.data());
  }

  /**
   * Calls `onChange` with the account's Cardcase data whenever it changes on the server (e.g. saved on another device),
   * including once right away. This device's own unconfirmed writes are skipped. Returns a function that stops it.
   */
  async watchRemote(uid: string, onChange: (data: Record<string, unknown> | null) => void): Promise<() => void> {
    const { fsMod } = await this.requireSdk();
    return fsMod.onSnapshot(
      fsMod.doc(this.db!, 'users', uid),
      (snap) => {
        if (!snap.metadata.hasPendingWrites) onChange(remoteUser(snap.data()));
      },
      (err) => console.warn('[sync] live bijwerken gestopt', err),
    );
  }

  /**
   * Writes the Cardcase data into users/{uid}, leaving any other fields in that document alone. The field is replaced
   * as a whole: with `merge: true` its maps would be merged, so a removed card would stay in the account.
   */
  async saveRemote(uid: string, data: Record<string, unknown>) {
    const { fsMod } = await this.requireSdk();
    await fsMod.setDoc(fsMod.doc(this.db!, 'users', uid), { [REMOTE_FIELD]: data, updatedAt: fsMod.serverTimestamp() }, { mergeFields: [REMOTE_FIELD, 'updatedAt'] });
  }

  /** Stores an uploaded picture in its own document, users/{uid}/images/{id} (see core/images). */
  async saveImage(uid: string, img: { id: string; name: string; data: string; added: number }) {
    const { fsMod } = await this.requireSdk();
    await fsMod.setDoc(fsMod.doc(this.db!, 'users', uid, 'images', img.id), img);
  }

  async deleteImage(uid: string, id: string) {
    const { fsMod } = await this.requireSdk();
    await fsMod.deleteDoc(fsMod.doc(this.db!, 'users', uid, 'images', id));
  }

  /** An uploaded picture of this account, or null when there's none with that id. */
  async loadImage(uid: string, id: string): Promise<{ id: string; name: string; data: string; added: number } | null> {
    const { fsMod } = await this.requireSdk();
    const snap = await fsMod.getDoc(fsMod.doc(this.db!, 'users', uid, 'images', id));
    return (snap.data() as any) ?? null;
  }

  /** Firestore and its functions, for the other services that keep data there (core/friends). */
  async firestore() {
    const { fsMod } = await this.requireSdk();
    return { fs: fsMod, db: this.db! };
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
