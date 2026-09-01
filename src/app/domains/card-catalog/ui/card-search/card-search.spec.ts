import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CardCatalogService } from '../../service/card-catalog.service';
import { Card } from '../../types/card';
import { CardSearch } from './card-search';

const CARD: Card = {
  id: 'pokemon:basep-1',
  tcg: 'pokemon',
  externalId: 'basep-1',
  name: 'Pikachu',
  setCode: 'basep',
  setName: 'Wizards Black Star Promos',
  cardNumber: '1',
  variant: 'normal',
  imageUrl: 'https://images.pokemontcg.io/basep/1_hires.png',
  rarity: 'Promo',
};

describe('CardSearch', () => {
  let cardCatalogService: { search: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    cardCatalogService = { search: vi.fn().mockResolvedValue({ cards: [], failedTcgs: [] }) };

    await TestBed.configureTestingModule({
      imports: [CardSearch],
      providers: [provideRouter([]), { provide: CardCatalogService, useValue: cardCatalogService }],
    }).compileComponents();
  });

  function createFixture(): ComponentFixture<CardSearch> {
    return TestBed.createComponent(CardSearch);
  }

  function text(fixture: ComponentFixture<CardSearch>): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('toont automatisch voorbeeldkaarten bij binnenkomst, gelabeld als voorbeelden', async () => {
    cardCatalogService.search.mockResolvedValue({ cards: [CARD], failedTcgs: [] });

    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(cardCatalogService.search).toHaveBeenCalled();
    expect(text(fixture)).toContain('Voorbeeldkaarten');
    expect(text(fixture)).toContain('Pikachu');
  });

  it('roept de service aan met de ingevoerde query en toont de resultaten als "Resultaten voor"', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    cardCatalogService.search.mockResolvedValue({ cards: [CARD], failedTcgs: [] });
    const component = fixture.componentInstance;
    component.query.set('pikachu');
    component.isShowingExamples.set(false);

    await component.onSubmit();
    fixture.detectChanges();

    expect(cardCatalogService.search).toHaveBeenCalledWith('pikachu', undefined);
    expect(text(fixture)).toContain('Resultaten voor "pikachu"');
    expect(text(fixture)).toContain('Pikachu');
  });

  it('toont een duidelijke lege-staat als er geen resultaten zijn', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.query.set('onvindbaarekaart');

    await component.onSubmit();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Geen kaarten gevonden');
  });

  it('toont welke provider(s) faalden, zonder de geslaagde resultaten te verbergen', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    cardCatalogService.search.mockResolvedValue({ cards: [CARD], failedTcgs: ['pokemon'] });
    const component = fixture.componentInstance;
    component.query.set('pikachu');

    await component.onSubmit();
    fixture.detectChanges();

    expect(text(fixture)).toContain('pokemon');
    expect(text(fixture)).toContain('Pikachu');
  });
});
