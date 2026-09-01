import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { vi } from 'vitest';
import { CardCatalogService } from '../../service/card-catalog.service';
import { Card } from '../../types/card';
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
  getCardDetail: ReturnType<typeof vi.fn>,
): ComponentFixture<CardDetail> {
  TestBed.configureTestingModule({
    imports: [CardDetail],
    providers: [
      { provide: CardCatalogService, useValue: { getCardDetail } },
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
    const fixture = createFixture({ tcg: 'pokemon', externalId: 'basep-1' }, getCardDetail);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(getCardDetail).toHaveBeenCalledWith('pokemon', 'basep-1');
    expect(text(fixture)).toContain('Pikachu');
    expect(text(fixture)).toContain('Wizards Black Star Promos');
  });

  it('toont een duidelijke melding als de kaart niet bestaat', async () => {
    const getCardDetail = vi.fn().mockResolvedValue(null);
    const fixture = createFixture({ tcg: 'pokemon', externalId: 'onbekend' }, getCardDetail);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain('bestaat niet');
  });

  it('toont een duidelijke melding bij een ongeldige tcg in de route, zonder de service aan te roepen', async () => {
    const getCardDetail = vi.fn();
    const fixture = createFixture({ tcg: 'yugioh', externalId: 'x' }, getCardDetail);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(getCardDetail).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('ongeldig');
  });
});
