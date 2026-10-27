import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CardcaseStore } from './core/store';
import { CatalogService } from './core/catalog';
import { Leds } from './shared/bits';
import { Logo } from './shared/logo';
import { GameSwitcher } from './shared/game-switcher';
import { OnboardingScreen, OverviewScreen } from './screens/departments';
import { HomeScreen } from './screens/home';
import { SearchScreen } from './screens/search';
import { DetailScreen } from './screens/detail';
import { CollectionScreen } from './screens/collection';
import { ValueScreen } from './screens/value';
import { BindersScreen } from './screens/binders';
import { EditorScreen } from './screens/editor';
import { CreateScreen } from './screens/create';
import { RecipeScreen } from './screens/recipe';
import { ShiftScreen } from './screens/shift';
import { MovesScreen } from './screens/moves';
import { PageResultScreen } from './screens/page-result';
import { CropScreen } from './screens/crop';
import { PrintScreen } from './screens/print';
import { FriendsScreen } from './screens/friends';
import { ShareSheet } from './screens/share';
import { ScanOverlay } from './screens/scan';
import { ViewerOverlay } from './screens/viewer';
import { PageScanOverlay } from './screens/page-scan';
import { Sheets } from './screens/sheets';
import { AuthPanel } from './screens/auth-panel';
import { AuthService } from './core/auth';
import { AppUpdate } from './core/app-update';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    Leds,
    Logo,
    GameSwitcher,
    OnboardingScreen,
    OverviewScreen,
    HomeScreen,
    SearchScreen,
    DetailScreen,
    CollectionScreen,
    ValueScreen,
    BindersScreen,
    EditorScreen,
    CreateScreen,
    RecipeScreen,
    ShiftScreen,
    MovesScreen,
    PageResultScreen,
    CropScreen,
    PrintScreen,
    FriendsScreen,
    ShareSheet,
    ScanOverlay,
    ViewerOverlay,
    PageScanOverlay,
    Sheets,
    AuthPanel,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(CardcaseStore);
  protected readonly v = this.store.vals;
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');
  protected readonly user = inject(AuthService).user;
  protected readonly update = inject(AppUpdate);
  protected readonly initial = computed(() => (this.user()?.displayName || this.user()?.email || '?').charAt(0).toUpperCase());

  /** Card outlines floating up behind the home page: position, size, duration, start (negative: already on the way) and tilt. */
  protected readonly floaters = [
    ['6%', '64px', '52s', '-8s', '-10deg'],
    ['22%', '88px', '64s', '-40s', '6deg'],
    ['41%', '56px', '46s', '-22s', '-4deg'],
    ['63%', '80px', '58s', '-50s', '12deg'],
    ['80%', '68px', '50s', '-14s', '-14deg'],
    ['92%', '52px', '44s', '-32s', '4deg'],
  ].map(([x, w, t, d, r]) => ({ x, w, t, d, r }));

  protected openAccount() {
    this.store.setState({ authPanel: this.user() ? 'account' : 'login' });
  }

  constructor() {
    this.store.init();
    if (inject(CatalogService).sourceKind() === 'mock') this.store.toast('TCGdex niet bereikbaar · voorbeelddata geladen');
    effect(() => document.body.classList.toggle('cc-dark', !!this.store.state.dark));
    effect(() => {
      this.store.scrollTick();
      const el = this.main()?.nativeElement;
      if (el) el.scrollTop = 0;
    });
  }
}
