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
  let fixture: ComponentFixture<CardSearch>;
  let cardCatalogService: { search: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    cardCatalogService = { search: vi.fn().mockResolvedValue({ cards: [], failedTcgs: [] }) };

    await TestBed.configureTestingModule({
      imports: [CardSearch],
      providers: [provideRouter([]), { provide: CardCatalogService, useValue: cardCatalogService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CardSearch);
    await fixture.whenStable();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('toont een uitnodigende hint voordat er gezocht is', () => {
    expect(text()).toContain('Zoek een kaart op naam om te beginnen.');
  });

  it('roept de service aan met de ingevoerde query en toont de resultaten', async () => {
    cardCatalogService.search.mockResolvedValue({ cards: [CARD], failedTcgs: [] });
    const component = fixture.componentInstance;
    component.query.set('pikachu');

    await component.onSubmit();
    fixture.detectChanges();

    expect(cardCatalogService.search).toHaveBeenCalledWith('pikachu', undefined);
    expect(text()).toContain('Pikachu');
  });

  it('toont een duidelijke lege-staat als er geen resultaten zijn', async () => {
    const component = fixture.componentInstance;
    component.query.set('onvindbaarekaart');

    await component.onSubmit();
    fixture.detectChanges();

    expect(text()).toContain('Geen kaarten gevonden');
  });

  it('toont welke provider(s) faalden, zonder de geslaagde resultaten te verbergen', async () => {
    cardCatalogService.search.mockResolvedValue({ cards: [CARD], failedTcgs: ['pokemon'] });
    const component = fixture.componentInstance;
    component.query.set('pikachu');

    await component.onSubmit();
    fixture.detectChanges();

    expect(text()).toContain('pokemon');
    expect(text()).toContain('Pikachu');
  });
});
