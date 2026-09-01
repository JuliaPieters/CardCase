import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { vi } from 'vitest';
import { CardCatalogService } from '../../service/card-catalog.service';
import { Card, PriceSnapshot } from '../../types/card';
import { CardDetail } from './card-detail';

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

function createFixture(
  params: Record<string, string>,
  overrides: {
    getCardDetail?: ReturnType<typeof vi.fn>;
    getVariantPrices?: ReturnType<typeof vi.fn>;
  } = {},
): ComponentFixture<CardDetail> {
  TestBed.configureTestingModule({
    imports: [CardDetail],
    providers: [
      {
        provide: CardCatalogService,
        useValue: {
          getCardDetail: overrides.getCardDetail ?? vi.fn().mockResolvedValue(null),
          getVariantPrices: overrides.getVariantPrices ?? vi.fn().mockResolvedValue([]),
        },
      },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
    ],
  });

  return TestBed.createComponent(CardDetail);
}

function text(fixture: ComponentFixture<CardDetail>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('CardDetail', () => {
  it('toont de kaartgegevens zodra ze geladen zijn', async () => {
    const getCardDetail = vi.fn().mockResolvedValue(CARD);
    const fixture = createFixture({ tcg: 'pokemon', externalId: 'basep-1' }, { getCardDetail });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(getCardDetail).toHaveBeenCalledWith('pokemon', 'basep-1');
    expect(text(fixture)).toContain('Pikachu');
    expect(text(fixture)).toContain('Wizards Black Star Promos');
  });

  it('toont de bekende varianten met prijs, in euro-notatie', async () => {
    const getCardDetail = vi.fn().mockResolvedValue(CARD);
    const prices: PriceSnapshot[] = [
      { cardId: CARD.id, variant: 'normal', currency: 'EUR', price: 1.5, asOf: '2026-01-01', source: 'pokemon' },
      { cardId: CARD.id, variant: 'reverseFoil', currency: 'USD', price: 7.93, asOf: '2026-01-01', source: 'pokemon' },
    ];
    const getVariantPrices = vi.fn().mockResolvedValue(prices);
    const fixture = createFixture({ tcg: 'pokemon', externalId: 'basep-1' }, { getCardDetail, getVariantPrices });

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getVariantPrices).toHaveBeenCalledWith(CARD);
    expect(text(fixture)).toContain('Normaal');
    expect(text(fixture)).toContain('Reverse foil');
    expect(text(fixture)).toContain('€');
  });

  it('toont een duidelijke melding als geen enkele variant een prijs heeft', async () => {
    const getCardDetail = vi.fn().mockResolvedValue(CARD);
    const fixture = createFixture({ tcg: 'pokemon', externalId: 'basep-1' }, { getCardDetail });

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Geen prijzen bekend');
  });

  it('toont een duidelijke melding als de kaart niet bestaat', async () => {
    const getCardDetail = vi.fn().mockResolvedValue(null);
    const fixture = createFixture({ tcg: 'pokemon', externalId: 'onbekend' }, { getCardDetail });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain('bestaat niet');
  });

  it('toont een duidelijke melding bij een ongeldige tcg in de route, zonder de service aan te roepen', async () => {
    const getCardDetail = vi.fn();
    const fixture = createFixture({ tcg: 'yugioh', externalId: 'x' }, { getCardDetail });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(getCardDetail).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('ongeldig');
  });
});
