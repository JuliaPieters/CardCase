import { matchRows, normName, normNum, parseFile, versionOf } from './import';

const pika = (id: number, set: string, setName: string, localId: string) => ({ id, set, setName, localId, num: parseInt(localId, 10), names: { EN: 'Pikachu', DE: 'Pikachu' }, avail: ['EN', 'DE'] });
const POKEMON = [pika(0, 'sv08', 'Surging Sparks', '063'), pika(1, 'sv03.5', '151', '025'), pika(2, 'sv01', 'Scarlet & Violet', '063')];
const MAGIC = [
  { id: 0, set: 'dmu', setName: 'Dominaria United', localId: '107', names: { EN: 'Shivan Devastator' }, avail: ['EN', 'DE', 'FR'], scryfallId: 'aaaa-1' },
  { id: 1, set: 'lea', setName: 'Limited Edition Alpha', localId: '161', names: { EN: 'Lightning Bolt' }, avail: ['EN'] },
];
const FOIL = [{ key: '', label: 'Gewoon' }, { key: 'foil', label: 'Foil' }];

describe('import', () => {
  it('reads quoted CSV, semicolons and JSON', () => {
    expect(parseFile('﻿Name,Quantity\r\n"Bolt, Lightning",2\r\n')).toEqual([{ Name: 'Bolt, Lightning', Quantity: '2' }]);
    expect(parseFile('Name;Aantal\nPikachu;3')).toEqual([{ Name: 'Pikachu', Aantal: '3' }]);
    expect(parseFile('[{"name":"Pikachu","qty":1}]')).toEqual([{ name: 'Pikachu', qty: '1' }]);
  });

  it('compares names and numbers loosely', () => {
    expect(normName('Charizard ex - 199/165')).toBe('charizard ex');
    expect(normName('Elsa – Snow Queen')).toBe(normName('Elsa - Snow Queen'));
    expect(normNum('025/165')).toBe('25');
    expect(normNum('TG01')).toBe('tg01');
  });

  it('matches a ManaBox export by Scryfall id or set code and number', () => {
    const csv = 'Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,Scryfall ID,Condition,Language\n' +
      'Shivan Devastator,DMU,Dominaria United,107,foil,mythic,2,aaaa-1,near_mint,de\n' +
      'Lightning Bolt,LEA,Limited Edition Alpha,161,normal,common,1,,near_mint,fr\n' +
      'Black Lotus,LEA,Limited Edition Alpha,232,normal,rare,1,,near_mint,en';
    const r = matchRows(parseFile(csv), MAGIC, 'magic', () => FOIL);
    expect(r.hits).toEqual([{ id: 0, lang: 'DE', ver: 'foil', qty: 2 }, { id: 1, lang: 'EN', ver: '', qty: 1 }]);
    expect(r.missing.map((m) => m.name)).toEqual(['Black Lotus']);
  });

  it('matches Collectr rows by name, number and set name, and counts other games apart', () => {
    const csv = 'Portfolio Name,Category,Set,Product Name,Card Number,Rarity,Variance,Grade,Card Condition,Average Cost Paid,Quantity\n' +
      'Main,Pokemon,SV08: Surging Sparks,Pikachu - 063/191,063/191,Common,Reverse Holofoil,Ungraded,Near Mint,0.10,3\n' +
      'Main,Pokemon,Scarlet & Violet Base Set,Pikachu,063/198,Common,Normal,Ungraded,Near Mint,0.10,1\n' +
      'Main,Disney Lorcana,The First Chapter,Elsa - Snow Queen,42/204,Rare,Normal,Ungraded,Near Mint,1,2\n' +
      'Main,Magic: The Gathering,Alpha,Lightning Bolt,161,Common,Normal,Ungraded,Near Mint,1,1';
    const r = matchRows(parseFile(csv), POKEMON, 'pokemon', () => []);
    expect(r.hits).toEqual([{ id: 0, lang: 'EN', ver: 'reverse', qty: 3 }, { id: 2, lang: 'EN', ver: '', qty: 1 }]);
    expect(r.other).toEqual({ lorcana: 2, magic: 1 });
  });

  it('matches One Piece rows by card number, the parallel when the row says so', () => {
    const shanks = (id: number, set: string, setName: string, localId: string, extra: any) => ({ id, set, setName, localId, num: 120, code: 'OP01-120', names: { EN: 'Shanks', JA: 'シャンクス' }, avail: ['EN', 'JA'], parallel: 0, reprint: 0, ...extra });
    const cards = [
      shanks(0, 'OP01', 'Romance Dawn', '120', {}),
      shanks(1, 'OP01', 'Romance Dawn', '120 P1', { parallel: 1 }),
      shanks(2, 'PRB01', 'One Piece Card The Best', '120 R1', { reprint: 1 }),
    ];
    const csv = 'Category,Set,Product Name,Card Number,Rarity,Quantity\n' +
      'One Piece Card Game,Romance Dawn,Shanks,OP01-120,Secret Rare,2\n' +
      'One Piece Card Game,Romance Dawn,Shanks (Parallel),OP01-120,Secret Rare,1\n' +
      'One Piece Card Game,One Piece Card The Best,Shanks,OP01-120,Secret Rare,1';
    const r = matchRows(parseFile(csv), cards, 'one-piece', () => []);
    expect(r.hits.map((h) => [h.id, h.qty])).toEqual([[0, 2], [1, 1], [2, 1]]);
  });

  it('takes Collectr’s set code and Japanese rarities as signs of a Japanese card', () => {
    const card = (id: number, set: string, setName: string, localId: string, names: any, avail: string[], total: number) => ({ id, set, setName, localId, num: +localId, names, avail, total, sp: 25 });
    const cards = [
      card(0, '30th', '30th Celebration', '023', { EN: 'Pikachu' }, ['EN'], 113),
      card(1, 'JA-M6a', '30th CELEBRATION', '036', { JA: 'ピカチュウ' }, ['JA'], 103),
      card(2, 'me01', 'Mega Evolution', '001', { EN: 'Bulbasaur' }, ['EN'], 132),
      card(3, 'JA-SV11B', 'ブラックボルト', '088', { JA: 'ジャノビー' }, ['JA'], 174),
      card(4, 'sv10.5b', 'Black Bolt', '088', { EN: 'Servine' }, ['EN'], 86),
    ];
    const csv = 'Category,Set,Product Name,Card Number,Rarity,Quantity\n' +
      'Pokemon,M6a: 30th Celebration,Pikachu,036/103,,1\n' +
      'Pokemon,Mega Brave,Bulbasaur,064/063,Art Rare,1\n' +
      'Pokemon,Black Bolt,Servine,088/086,Art Rare,1';
    const sp = (c: any) => ({ 0: 'Pikachu', 1: 'Pikachu', 2: 'Bulbasaur', 3: 'Servine', 4: 'Servine' } as any)[c.id];
    const r = matchRows(parseFile(csv), cards, 'pokemon', () => [], sp);
    expect(r.hits.map((h) => [h.id, h.lang])).toEqual([[1, 'JA'], [3, 'JA']]);
    // Not "a Bulbasaur in a set with Mega in its name": there is no Japanese one numbered 064 here.
    expect(r.missing.map((m) => m.name)).toEqual(['Bulbasaur']);
  });

  it('finds the Pokémon version a row names', () => {
    const vers = [{ key: '', label: 'Holo' }, { key: 'holo_shadowless', label: '' }, { key: 'holo_shadowless_1st_edition', label: '' }];
    expect(versionOf('1st Edition Holofoil', vers, 'pokemon')).toBe('holo_shadowless_1st_edition');
    expect(versionOf('Holofoil', vers, 'pokemon')).toBe('');
    expect(versionOf('Reverse Holofoil Poke Ball', [], 'pokemon')).toBe('reverse_pokeball');
    expect(versionOf('Cold Foil', FOIL, 'lorcana')).toBe('foil');
    expect(versionOf('Normal', FOIL, 'lorcana')).toBe('');
  });
});
