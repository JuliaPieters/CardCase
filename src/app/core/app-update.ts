import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** How long after opening the app (or bringing it back) a finished download still switches over by itself. */
const AUTO_APPLY_MS = 15_000;

/**
 * Watches for a new deploy through the service worker. A home-screen app can stay open for days (iOS only pauses
 * it), so besides the check at startup it looks again whenever the app comes back to the foreground. The new
 * version (with its catalog) is downloaded in the background and switched to by itself when that can't interrupt
 * anything: right after opening or returning to the app, or the next time it comes back. Until then `ready` shows
 * a tap-to-load button.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private readonly sw = inject(SwUpdate);
  readonly ready = signal(false);
  /** Until when a version that finishes downloading is applied without asking. */
  private autoApplyUntil = Date.now() + AUTO_APPLY_MS;

  constructor() {
    if (!this.sw.isEnabled) return;
    this.sw.versionUpdates.subscribe((e) => {
      if (e.type !== 'VERSION_READY') return;
      this.ready.set(true);
      if (document.visibilityState === 'visible' && Date.now() < this.autoApplyUntil) this.apply();
    });
    // The cached app can no longer be served (e.g. its files were evicted): only a fresh load helps.
    this.sw.unrecoverable.subscribe(() => location.reload());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      // Downloaded while the app was in use or in the background: switch now, before it's used again.
      if (this.ready()) return void this.apply();
      this.autoApplyUntil = Date.now() + AUTO_APPLY_MS;
      this.sw.checkForUpdate().catch(() => {});
    });
  }

  async apply() {
    await this.sw.activateUpdate().catch(() => {});
    location.reload();
  }
}
