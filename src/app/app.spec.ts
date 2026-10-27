import { TestBed } from '@angular/core/testing';
import { provideServiceWorker } from '@angular/service-worker';
import { App } from './app';
import { CardcaseStore } from './core/store';
import { applyGameConfig, mockCatalog, setCatalog } from './core/data';
import { config } from './games/pokemon/config';

// Tests run offline against the prototype's mock catalog.
applyGameConfig(config);
const mock = mockCatalog();
setCatalog(mock.sets, mock.cards);

const SCREENS = ['home', 'search', 'detail', 'collection', 'value', 'binders', 'recipe', 'create', 'editor', 'decorate', 'crop', 'print', 'shift', 'moves', 'pageresult', 'viewer', 'scan', 'pagescan'];

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [provideServiceWorker('ngsw-worker.js', { enabled: false })] }).compileComponents();
  });

  it('renders the dashboard', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Welkom terug. Je collectie groeit.');
  });

  it.each(SCREENS)('renders the %s screen', async (screen) => {
    const fixture = TestBed.createComponent(App);
    const store = TestBed.inject(CardcaseStore);
    store.go(screen);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(store.vals()).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);
  });
});

describe('CardcaseStore', () => {
  it('adds a scanned card to the collection', () => {
    const store = TestBed.inject(CardcaseStore);
    const before = store.vals().totalCards;
    store.scanFound([{ id: 1, conf: 99 }, { id: 2, conf: 60 }]);
    store.setScan({ phase: 'sheet', qty: 2 });
    store.addScan();
    expect(store.vals().totalCards).toBe(before + 2);
  });

  it('checks a scanned binder page against the plan', () => {
    const store = TestBed.inject(CardcaseStore);
    const b = store.state.binders.find((x: any) => x.slots.some((s: any) => typeof s === 'number'));
    store.startPageScan(b.id, [0, 1]);
    const { idxs, expect: exp } = store.pageScanTarget();
    const full = idxs.filter((i) => exp(i) != null);
    expect(full.length).toBeGreaterThan(1);
    const [a, c] = full;
    // Every slot read correctly, except two cards that are swapped and one left empty.
    const res: any = {};
    idxs.forEach((i) => (res[i] = { got: exp(i), conf: 95, cands: [] }));
    res[a] = { got: exp(c), conf: 95, cands: [] };
    res[c] = { got: null, conf: 0, cands: [] };
    store.pageScanned(res);
    const det: any = store.resultModel().det;
    expect(det[a].st).toBe('swap');
    expect(det[c].st).toBe('empty');
    expect(store.vals().rsIssues.length).toBe(2);
  });

  it('places a card in a binder slot by tap', () => {
    const store = TestBed.inject(CardcaseStore);
    store.go('editor', { edId: 'b3', edSpread: 0 });
    const empty: any = store.vals().edLeft.slots.find((s: any) => s.isEmpty);
    store.setState({ sel: 0 });
    empty.onClick();
    expect(store.state.binders.find((b: any) => b.id === 'b3').slots[empty.key]).toBe(0);
  });
});
