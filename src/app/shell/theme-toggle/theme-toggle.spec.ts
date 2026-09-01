import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let fixture: ComponentFixture<ThemeToggle>;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    await TestBed.configureTestingModule({ imports: [ThemeToggle] }).compileComponents();
    fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('wisselt van thema bij een klik en toont de volgende optie als labeltekst', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.textContent?.trim()).toBe('Donker');

    button.click();
    fixture.detectChanges();

    expect(button.textContent?.trim()).toBe('Licht');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
