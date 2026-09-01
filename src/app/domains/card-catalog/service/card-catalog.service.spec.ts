import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CARD_PROVIDERS } from '../../../providers/card-providers.provider';
import { CardProvider } from '../../../providers/card-provider';
import { Card } from '../types/card';
import { CardCatalogService } from './card-catalog.service';

function fakeCard(tcg: 'pokemon' | 'magic', name: string): Card {
  return {
    id: `${tcg}:${name}`,
    tcg,
    externalId: name,
    name,
    setCode: 'set',
    setName: 'Set',
    cardNumber: '1',
    variant: 'normal',
    imageUrl: 'https://example.com/card.png',
    rarity: 'common',
  };
}

function fakeProvider(tcg: 'pokemon' | 'magic', overrides: Partial<CardProvider> = {}): CardProvider {
  return {
    tcg,
    search: vi.fn().mockResolvedValue([fakeCard(tcg, `${tcg}-card`)]),
    getById: vi.fn().mockResolvedValue(null),
    getPrice: vi.fn().mockRejectedValue(new Error('niet geïmplementeerd')),
    ...overrides,
  };
}

function createService(providers: CardProvider[]): CardCatalogService {
  TestBed.configureTestingModule({ providers: [{ provide: CARD_PROVIDERS, useValue: providers }] });
  return TestBed.inject(CardCatalogService);
}

describe('CardCatalogService', () => {
  it('geeft een lege result terug voor een lege/witruimte-query, zonder providers aan te roepen', async () => {
    const pokemon = fakeProvider('pokemon');
    const service = createService([pokemon]);

    const result = await service.search('   ');

    expect(result).toEqual({ cards: [], failedTcgs: [] });
    expect(pokemon.search).not.toHaveBeenCalled();
  });

  it('voegt resultaten van meerdere providers samen', async () => {
    const service = createService([fakeProvider('pokemon'), fakeProvider('magic')]);

    const result = await service.search('pikachu');

    expect(result.cards).toHaveLength(2);
    expect(result.cards.map((card) => card.tcg).sort()).toEqual(['magic', 'pokemon']);
    expect(result.failedTcgs).toEqual([]);
  });

  it('respecteert een TCG-filter en roept alleen die provider aan', async () => {
    const pokemon = fakeProvider('pokemon');
    const magic = fakeProvider('magic');
    const service = createService([pokemon, magic]);

    await service.search('pikachu', 'pokemon');

    expect(pokemon.search).toHaveBeenCalledWith('pikachu');
    expect(magic.search).not.toHaveBeenCalled();
  });

  it('laat een falende provider de resultaten van de andere niet blokkeren', async () => {
    const pokemon = fakeProvider('pokemon', { search: vi.fn().mockRejectedValue(new Error('500')) });
    const magic = fakeProvider('magic');
    const service = createService([pokemon, magic]);

    const result = await service.search('pikachu');

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].tcg).toBe('magic');
    expect(result.failedTcgs).toEqual(['pokemon']);
  });

  it('beperkt het aantal resultaten per provider tot de geconfigureerde limiet', async () => {
    const manyCards = Array.from({ length: 50 }, (_, i) => fakeCard('pokemon', `card-${i}`));
    const pokemon = fakeProvider('pokemon', { search: vi.fn().mockResolvedValue(manyCards) });
    const service = createService([pokemon]);

    const result = await service.search('pikachu');

    expect(result.cards.length).toBeLessThan(50);
  });

  describe('getCardDetail', () => {
    it('roept getById van de juiste provider aan', async () => {
      const pokemon = fakeProvider('pokemon');
      const magic = fakeProvider('magic');
      const service = createService([pokemon, magic]);

      await service.getCardDetail('magic', 'external-id');

      expect(magic.getById).toHaveBeenCalledWith('external-id');
      expect(pokemon.getById).not.toHaveBeenCalled();
    });

    it('gooit een duidelijke error als er geen provider is voor de tcg', async () => {
      const service = createService([fakeProvider('pokemon')]);

      await expect(service.getCardDetail('magic', 'external-id')).rejects.toThrow(/magic/);
    });
  });
});
