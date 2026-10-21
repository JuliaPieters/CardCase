import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/**
 * Watches for a new deploy through the service worker. A home-screen app can stay open for days, so besides the
 * check at startup it looks again whenever the app comes back to the foreground. The new version (with its
 * catalog) is downloaded in the background; `ready` turns true once it can be switched to.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private readonly sw = inject(SwUpdate);
  readonly ready = signal(false);

  constructor() {
    if (!this.sw.isEnabled) return;
    this.sw.versionUpdates.subscribe((e) => {
      if (e.type === 'VERSION_READY') this.ready.set(true);
    });
    // The cached app can no longer be served (e.g. its files were evicted): only a fresh load helps.
    this.sw.unrecoverable.subscribe(() => location.reload());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.sw.checkForUpdate().catch(() => {});
    });
  }

  async apply() {
    await this.sw.activateUpdate();
    location.reload();
  }
}
