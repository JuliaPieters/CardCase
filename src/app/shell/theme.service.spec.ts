import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gebruikt de systeemvoorkeur als er nog geen keuze is opgeslagen', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true } as MediaQueryList));

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('gebruikt een eerder opgeslagen keuze boven de systeemvoorkeur', () => {
    localStorage.setItem('cardcase-theme', 'light');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true } as MediaQueryList));

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('toggle() wisselt tussen licht en donker, en zet het data-theme-attribuut', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false } as MediaQueryList));
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');

    service.toggle();
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('onthoudt de keuze voor de volgende sessie', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false } as MediaQueryList));
    const service = TestBed.inject(ThemeService);

    service.toggle();
    TestBed.flushEffects();

    expect(localStorage.getItem('cardcase-theme')).toBe('dark');
  });
});
