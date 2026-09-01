import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  let fixture: ComponentFixture<AppHeader>;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    await TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AppHeader);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('toont de wordmark en de zoek-navigatielink', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cardcase');
    expect(text).toContain('Zoeken');
  });

  it('bevat de thema-toggle', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('app-theme-toggle')).toBeTruthy();
  });
});
