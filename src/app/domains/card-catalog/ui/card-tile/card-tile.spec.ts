import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card } from '../../types/card';
import { CardTile } from './card-tile';

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

describe('CardTile', () => {
  let fixture: ComponentFixture<CardTile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardTile] }).compileComponents();
    fixture = TestBed.createComponent(CardTile);
    fixture.componentRef.setInput('card', CARD);
    await fixture.whenStable();
  });

  it('toont de naam en set van de kaart', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pikachu');
    expect(text).toContain('Wizards Black Star Promos');
  });

  it('gebruikt de kaartafbeelding met de kaartnaam als alt-tekst', () => {
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.getAttribute('src')).toBe(CARD.imageUrl);
    expect(img?.getAttribute('alt')).toBe(CARD.name);
  });

  it('geeft een kaart met een bijzondere zeldzaamheid een opvallende rand', () => {
    fixture.componentRef.setInput('card', { ...CARD, rarity: 'Rare Holo VMAX' });
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.classList.contains('card-tile__image--notable')).toBe(true);
  });

  it('geeft een gewone kaart (common/uncommon) geen opvallende rand', () => {
    fixture.componentRef.setInput('card', { ...CARD, rarity: 'Common' });
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.classList.contains('card-tile__image--notable')).toBe(false);
  });
});
