import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { CardcaseStore } from './core/store';
import { mockCatalog, setCatalog } from './core/data';

// Tests run offline against the prototype's mock catalog.
const mock = mockCatalog();
setCatalog(mock.sets, mock.cards);

const SCREENS = ['home', 'search', 'detail', 'collection', 'value', 'binders', 'recipe', 'create', 'editor', 'decorate', 'crop', 'print', 'shift', 'moves', 'pageresult', 'viewer', 'scan', 'pagescan'];

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
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
    store.setScan({ phase: 'sheet', qty: 2 });
    store.addScan();
    expect(store.vals().totalCards).toBe(before + 2);
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
