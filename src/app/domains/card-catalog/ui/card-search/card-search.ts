import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardCatalogService } from '../../service/card-catalog.service';
import { CARD_SEARCH_EXAMPLE_QUERY } from '../../config/card-search.config';
import { Card, TcgId } from '../../types/card';
import { CardTile } from '../card-tile/card-tile';

type SearchStatus = 'idle' | 'searching' | 'done';

@Component({
  imports: [RouterLink, CardTile],
  selector: 'app-card-search',
  styleUrl: './card-search.scss',
  templateUrl: './card-search.html',
})
export class CardSearch {
  private readonly cardCatalogService = inject(CardCatalogService);

  readonly query = signal('');
  readonly tcgFilter = signal<TcgId | ''>('');
  readonly status = signal<SearchStatus>('idle');
  readonly cards = signal<Card[]>([]);
  readonly failedTcgs = signal<TcgId[]>([]);
  // Bij binnenkomst tonen we voorbeeldkaarten i.p.v. een lege pagina — zie
  // docs/exec-plans/active/02-full-v1-site.md "Beslissingen tijdens uitvoering". Dit
  // onderscheidt "dit zijn voorbeelden" van "dit zijn jouw zoekresultaten" in de UI.
  readonly isShowingExamples = signal(true);

  constructor() {
    void this.showExamples();
  }

  onFormSubmit(event: Event): void {
    event.preventDefault();
    this.isShowingExamples.set(false);
    void this.onSubmit();
  }

  private async showExamples(): Promise<void> {
    this.query.set(CARD_SEARCH_EXAMPLE_QUERY);
    await this.onSubmit();
  }

  async onSubmit(): Promise<void> {
    this.status.set('searching');

    const result = await this.cardCatalogService.search(this.query(), this.tcgFilter() || undefined);

    this.cards.set(result.cards);
    this.failedTcgs.set(result.failedTcgs);
    this.status.set('done');
  }
}
