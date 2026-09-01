import { Card, TcgId } from './card';

// `failedTcgs`: welke providers de zoekopdracht niet konden uitvoeren (bv. de bekende
// reliability-issues van de Pokémon TCG API, zie docs/references/pokemon-tcg-api.md). Eén
// falende bron laat de andere resultaten niet verdwijnen (Promise.all zou dat wel doen),
// maar de UI moet dit wel expliciet kunnen tonen — zie DESIGN.md "Lege staten &
// foutmeldingen" (zegt exact wat er misging).
export interface CardSearchResult {
  cards: Card[];
  failedTcgs: TcgId[];
}
