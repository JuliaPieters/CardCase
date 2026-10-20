import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CardcaseStore } from './core/store';
import { CatalogService } from './core/catalog';
import { Leds } from './shared/bits';
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
import { ScanOverlay } from './screens/scan';
import { ViewerOverlay } from './screens/viewer';
import { PageScanOverlay } from './screens/page-scan';
import { Sheets } from './screens/sheets';
import { AuthPanel } from './screens/auth-panel';
import { AuthService } from './core/auth';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    Leds,
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
  protected readonly initial = computed(() => (this.user()?.displayName || this.user()?.email || '?').charAt(0).toUpperCase());

  protected openAccount() {
    this.store.setState({ authPanel: this.user() ? 'account' : 'login' });
  }

  constructor() {
    this.store.init();
    if (inject(CatalogService).source() === 'mock') this.store.toast('TCGdex niet bereikbaar · voorbeelddata geladen');
    effect(() => document.body.classList.toggle('cc-dark', !!this.store.state.dark));
    effect(() => {
      this.store.scrollTick();
      const el = this.main()?.nativeElement;
      if (el) el.scrollTop = 0;
    });
  }
}
