import { Injectable, effect, signal } from '@angular/core';

// App-brede UI-concern (thema), geen bedrijfsdomein — vandaar buiten domains/ en providers/,
// zie docs/exec-plans/active/02-full-v1-site.md "Beslissingen tijdens uitvoering".
export type ThemeChoice = 'light' | 'dark';

const STORAGE_KEY = 'cardcase-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeChoice>(this.readInitialTheme());

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
      this.writeStoredTheme(this.theme());
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private readInitialTheme(): ThemeChoice {
    const stored = this.readStoredTheme();
    if (stored) {
      return stored;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private readStoredTheme(): ThemeChoice | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  private writeStoredTheme(theme: ThemeChoice): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Privacy-modus/quota — thema werkt dan gewoon niet persistent, geen harde fout.
    }
  }
}
