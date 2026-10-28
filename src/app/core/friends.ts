import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from './auth';
import { IMG_DATA, imageRefs, rememberImage } from './images';

/**
 * Friends, and what is shared with them or with a link. In Firestore (see firestore.rules):
 *  - profiles/{uid}: { username, name } — everyone signed in can read them, to search by username.
 *  - usernames/{username}: { uid } — makes a username unique: whoever creates the document has it.
 *  - friendships/{uidA_uidB} (uids sorted): { users, from, status: 'pending' | 'accepted', invite? }.
 *  - invites/{code}: { uid } — an invite link; opening it makes you friends with its owner right away.
 *  - shared/{uid}: { owned, binders } — what friends see: the collection, and the binders marked for friends.
 *  - publicBinders/{shareId}: { owner, binder, owned, by } — a binder shared by link, readable without an account.
 *  - publicImages/{id}: { owner, data } — the uploaded pictures on those binders.
 */
export interface Profile {
  uid: string;
  username: string;
  name: string;
}

export interface Friendship {
  id: string;
  other: string;
  status: 'pending' | 'accepted';
  /** A request someone else sent (to accept or decline). */
  incoming: boolean;
  profile: Profile | null;
}

/** What a friend shares: their collection and the binders they show friends (saved form, see core/persist). */
export interface FriendData {
  owned: Record<string, any>;
  binders: any[];
  /** The other departments (Lorcana…): their collection and the binders shown to friends. */
  games?: Record<string, { owned: Record<string, any>; binders: any[] }>;
}

export interface PublicBinder {
  owner: string;
  by: string;
  binder: any;
  owned: Record<string, any>;
  /** Department of the binder; missing on links made before departments (Pokémon). */
  game?: string;
}

export const USERNAME = /^[a-z0-9_.]{3,20}$/;
export const pairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const INVITE_KEY = 'cc-invite';

/** Random code for invite and share links, without look-alike characters. */
export function randomCode(n = 10) {
  const abc = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => abc[x % abc.length]).join('');
}

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private readonly auth = inject(AuthService);
  /** The signed-in user's profile: undefined while unknown (or logged out), null when they haven't chosen one yet. */
  readonly profile = signal<Profile | null | undefined>(undefined);
  readonly friendships = signal<Friendship[]>([]);
  private unwatch: (() => void) | null = null;
  private readonly profiles = new Map<string, Promise<Profile | null>>();
  /** What was last written per document, so unchanged data isn't sent again. */
  private readonly published = new Map<string, string>();
  private readonly imagesPublished = new Set<string>();

  constructor() {
    effect(() => {
      const u = this.auth.user();
      untracked(() => this.onUser(u?.uid ?? null));
    });
  }

  private get uid() {
    return this.auth.user()?.uid ?? null;
  }

  private async onUser(uid: string | null) {
    this.unwatch?.();
    this.unwatch = null;
    this.friendships.set([]);
    this.profile.set(undefined);
    this.published.clear();
    this.imagesPublished.clear();
    if (!uid) return;
    try {
      const p = await this.loadProfile(uid);
      if (this.uid !== uid) return;
      this.profile.set(p);
    } catch (err) {
      console.warn('[friends]', err);
      return;
    }
    const { fs, db } = await this.auth.firestore();
    const stop = fs.onSnapshot(
      fs.query(fs.collection(db, 'friendships'), fs.where('users', 'array-contains', uid)),
      async (snap) => {
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const x = d.data();
            const other = (x['users'] as string[]).find((u) => u !== uid) ?? uid;
            return { id: d.id, other, status: x['status'], incoming: x['from'] !== uid, profile: await this.profileOf(other) } as Friendship;
          }),
        );
        if (this.uid === uid) this.friendships.set(list.sort((a, b) => (a.profile?.name || '').localeCompare(b.profile?.name || '')));
      },
      (err) => console.warn('[friends]', err),
    );
    if (this.uid === uid) this.unwatch = stop;
    else stop();
  }

  private async loadProfile(uid: string): Promise<Profile | null> {
    const { fs, db } = await this.auth.firestore();
    const d = (await fs.getDoc(fs.doc(db, 'profiles', uid))).data();
    return d ? { uid, username: d['username'], name: d['name'] } : null;
  }

  profileOf(uid: string) {
    if (!this.profiles.has(uid)) this.profiles.set(uid, this.loadProfile(uid).catch(() => null));
    return this.profiles.get(uid)!;
  }

  /** Whether nobody else has this username (asked before creating an account, so it works logged out too). */
  async usernameFree(username: string) {
    const { fs, db } = await this.auth.firestore();
    const d = (await fs.getDoc(fs.doc(db, 'usernames', username.trim().toLowerCase()))).data();
    return !d || d['uid'] === this.uid;
  }

  /** Resolves once the signed-in user's profile has been looked up (or after a few seconds). */
  async whenProfileKnown() {
    for (let i = 0; i < 50 && (!this.uid || this.profile() === undefined); i++) await new Promise((r) => setTimeout(r, 100));
  }

  /**
   * Chooses the username (once: it can't be changed afterwards) and the name friends see, which can be changed any time.
   * Throws with a Dutch message when it can't.
   */
  async saveProfile(usernameIn: string, nameIn: string) {
    const uid = this.uid;
    if (!uid) throw new Error('Log eerst in.');
    const old = this.profile()?.username;
    const username = old ?? usernameIn.trim().toLowerCase();
    const name = nameIn.trim().slice(0, 40);
    if (!USERNAME.test(username)) throw new Error('Een gebruikersnaam heeft 3 tot 20 tekens: letters, cijfers, _ of .');
    if (!name) throw new Error('Vul je naam in.');
    const { fs, db } = await this.auth.firestore();
    await fs.runTransaction(db, async (tx) => {
      const taken = await tx.get(fs.doc(db, 'usernames', username));
      if (taken.exists() && taken.data()['uid'] !== uid) throw new Error('Die gebruikersnaam is al bezet.');
      if (!taken.exists()) tx.set(fs.doc(db, 'usernames', username), { uid });
      tx.set(fs.doc(db, 'profiles', uid), { username, name });
    });
    const p = { uid, username, name };
    this.profiles.set(uid, Promise.resolve(p));
    this.profile.set(p);
  }

  /** Profiles whose username starts with `q` (not your own). */
  async search(q: string): Promise<Profile[]> {
    const term = q.trim().toLowerCase().replace(/^@/, '');
    if (term.length < 2) return [];
    const { fs, db } = await this.auth.firestore();
    const snap = await fs.getDocs(
      fs.query(fs.collection(db, 'profiles'), fs.where('username', '>=', term), fs.where('username', '<=', term + ''), fs.limit(10)),
    );
    return snap.docs.filter((d) => d.id !== this.uid).map((d) => ({ uid: d.id, username: d.data()['username'], name: d.data()['name'] }));
  }

  /** Sends a friend request; when they already sent you one, accepts it instead. */
  async request(other: string) {
    const uid = this.uid;
    if (!uid) return;
    const existing = this.friendships().find((f) => f.other === other);
    if (existing) {
      if (existing.incoming && existing.status === 'pending') await this.accept(existing);
      return;
    }
    const { fs, db } = await this.auth.firestore();
    await fs.setDoc(fs.doc(db, 'friendships', pairId(uid, other)), { users: [uid, other], from: uid, status: 'pending', created: fs.serverTimestamp() });
  }

  async accept(f: Friendship) {
    const { fs, db } = await this.auth.firestore();
    await fs.updateDoc(fs.doc(db, 'friendships', f.id), { status: 'accepted', since: fs.serverTimestamp() });
  }

  /** Declines a request, withdraws your own, or ends a friendship. */
  async remove(f: Friendship) {
    const { fs, db } = await this.auth.firestore();
    await fs.deleteDoc(fs.doc(db, 'friendships', f.id));
  }

  /** Your invite link (made the first time it's asked for). */
  async inviteLink(): Promise<string> {
    const uid = this.uid;
    if (!uid) throw new Error('Log eerst in.');
    const { fs, db } = await this.auth.firestore();
    const snap = await fs.getDocs(fs.query(fs.collection(db, 'invites'), fs.where('uid', '==', uid), fs.limit(1)));
    let code = snap.docs[0]?.id;
    if (!code) {
      code = randomCode(12);
      await fs.setDoc(fs.doc(db, 'invites', code), { uid, created: fs.serverTimestamp() });
    }
    return `${location.origin}/?invite=${code}`;
  }

  /** Remembers an invite opened before logging in, for acceptPendingInvite(). */
  keepInvite(code: string) {
    try {
      localStorage.setItem(INVITE_KEY, code);
    } catch {}
  }

  pendingInvite(): string | null {
    try {
      return localStorage.getItem(INVITE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Becomes friends with whoever made the invite. Returns their profile and whether you already were friends, or null
   * for your own invite. Throws when the invite doesn't exist.
   */
  async acceptInvite(code: string): Promise<{ profile: Profile | null; already: boolean } | null> {
    const uid = this.uid;
    if (!uid) throw new Error('Log eerst in.');
    try {
      localStorage.removeItem(INVITE_KEY);
    } catch {}
    const { fs, db } = await this.auth.firestore();
    const inv = (await fs.getDoc(fs.doc(db, 'invites', code))).data();
    if (!inv) throw new Error('Deze uitnodiging bestaat niet (meer).');
    const other = inv['uid'] as string;
    if (other === uid) return null;
    const ref = fs.doc(db, 'friendships', pairId(uid, other));
    const cur = (await fs.getDoc(ref)).data();
    if (cur?.['status'] === 'accepted') return { profile: await this.profileOf(other), already: true };
    if (cur) await fs.updateDoc(ref, { status: 'accepted', invite: code, since: fs.serverTimestamp() });
    else await fs.setDoc(ref, { users: [uid, other], from: uid, status: 'accepted', invite: code, created: fs.serverTimestamp(), since: fs.serverTimestamp() });
    return { profile: await this.profileOf(other), already: false };
  }

  /** What a friend shares, or null when they share nothing (yet). */
  async friendData(uid: string): Promise<FriendData | null> {
    const { fs, db } = await this.auth.firestore();
    const d = (await fs.getDoc(fs.doc(db, 'shared', uid))).data();
    return d ? { owned: d['owned'] || {}, binders: d['binders'] || [], games: d['games'] || {} } : null;
  }

  /** A binder shared by link, or null when the link doesn't (or no longer) work. Needs no account. */
  async publicBinder(shareId: string): Promise<PublicBinder | null> {
    const { fs, db } = await this.auth.firestore();
    const d = (await fs.getDoc(fs.doc(db, 'publicBinders', shareId))).data();
    return d ? (d as PublicBinder) : null;
  }

  /** Fetches the uploaded pictures on someone else's binders that this browser doesn't have. */
  async loadImages(binders: any[]) {
    const have = IMG_DATA();
    const missing = imageRefs(binders).filter((id) => !have[id]);
    if (!missing.length) return;
    const { fs, db } = await this.auth.firestore();
    await Promise.all(
      missing.map(async (id) => {
        const d = (await fs.getDoc(fs.doc(db, 'publicImages', id)).catch(() => null))?.data();
        if (d?.['data']) rememberImage(id, d['data']);
      }),
    );
  }

  /**
   * Brings what friends and links see up to date with the saved collection (the form of core/persist): shared/{uid},
   * a publicBinders document per binder shared by link (removing those no longer shared), and their pictures.
   */
  async publish(uid: string, saved: Record<string, any>) {
    if (this.uid !== uid) return;
    const { fs, db } = await this.auth.firestore();
    // Pokémon in the form the version online reads (see persist.shareForm); the other departments under `games`.
    const binders: any[] = saved['binders'] || [];
    const forFriends = binders.filter((b) => b.friends);
    const others = Object.entries((saved['games'] || {}) as Record<string, any>).filter(([g]) => g !== 'pokemon');
    const gamesShared = Object.fromEntries(others.map(([g, d]) => [g, { owned: d.owned || {}, binders: (d.binders || []).filter((b: any) => b.friends) }]));
    // Every binder shared by link, with the collection of its own department.
    const byLink = [
      ...binders.filter((b) => b.shareId).map((b) => ({ b, owned: saved['owned'] || {} })),
      ...others.flatMap(([g, d]) => (d.binders || []).filter((b: any) => b.shareId).map((b: any) => ({ b: { ...b, game: g }, owned: d.owned || {} }))),
    ];
    const writes: Promise<unknown>[] = [];
    const put = (key: string, ref: any, data: any) => {
      const json = JSON.stringify(data);
      if (this.published.get(key) === json) return;
      writes.push(
        fs.setDoc(ref, data).then(
          () => this.published.set(key, json),
          (err) => console.warn('[share]', key, err),
        ),
      );
    };

    put('shared', fs.doc(db, 'shared', uid), { owned: saved['owned'] || {}, binders: forFriends, games: gamesShared });
    const by = this.profile()?.name || this.auth.user()?.displayName || '';
    for (const { b, owned: all } of byLink) {
      const inB = new Set(b.slots.filter((x: unknown) => typeof x === 'string' && x.startsWith('U:')).map((x: string) => x.slice(2)));
      const owned = Object.fromEntries(Object.entries(all).filter(([k]) => inB.has(k)));
      put('b:' + b.shareId, fs.doc(db, 'publicBinders', b.shareId), { owner: uid, by, binder: b, owned, game: b.game || 'pokemon' });
    }

    // Links that were turned off, or whose binder was deleted.
    const listKey = 'cc-shares:' + uid;
    let before: string[] = [];
    try {
      before = JSON.parse(localStorage.getItem(listKey) || '[]');
    } catch {}
    const now = byLink.map(({ b }) => b.shareId as string);
    for (const id of before.filter((id) => !now.includes(id))) {
      this.published.delete('b:' + id);
      writes.push(fs.deleteDoc(fs.doc(db, 'publicBinders', id)).catch((err) => console.warn('[share]', err)));
    }
    try {
      localStorage.setItem(listKey, JSON.stringify(now));
    } catch {}

    const data = IMG_DATA();
    for (const id of imageRefs([...forFriends, ...Object.values(gamesShared).flatMap((g: any) => g.binders), ...byLink.map(({ b }) => b)])) {
      if (this.imagesPublished.has(id) || !data[id]) continue;
      this.imagesPublished.add(id);
      const ref = fs.doc(db, 'publicImages', id);
      writes.push(
        fs
          .getDoc(ref)
          .then((snap) => (snap.exists() ? null : fs.setDoc(ref, { owner: uid, data: data[id] })))
          .catch((err) => {
            this.imagesPublished.delete(id);
            console.warn('[share]', err);
          }),
      );
    }
    await Promise.all(writes);
  }
}
