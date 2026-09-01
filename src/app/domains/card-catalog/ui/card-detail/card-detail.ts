import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardCatalogService } from '../../service/card-catalog.service';
import { Card, CardVariant, PriceSnapshot, TcgId } from '../../types/card';

type DetailStatus = 'loading' | 'found' | 'not-found' | 'invalid-tcg';

const KNOWN_TCG_IDS: TcgId[] = ['pokemon', 'magic'];

// Presentatie-only, geen domeinconcept — vandaar hier i.p.v. in card-catalog/types.
export const VARIANT_LABELS: Record<CardVariant, string> = {
  normal: 'Normaal',
  foil: 'Foil',
  reverseFoil: 'Reverse foil',
  other: 'Overig',
};

@Component({
  imports: [CurrencyPipe],
  selector: 'app-card-detail',
  styleUrl: './card-detail.scss',
  templateUrl: './card-detail.html',
})
export class CardDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly cardCatalogService = inject(CardCatalogService);

  readonly status = signal<DetailStatus>('loading');
  readonly card = signal<Card | null>(null);
  readonly variantPrices = signal<PriceSnapshot[]>([]);
  readonly pricesLoading = signal(false);
  protected readonly variantLabels = VARIANT_LABELS;

  constructor() {
    void this.loadCard();
  }

  private async loadCard(): Promise<void> {
    const tcg = this.route.snapshot.paramMap.get('tcg');
    const externalId = this.route.snapshot.paramMap.get('externalId');

    if (!tcg || !externalId || !KNOWN_TCG_IDS.includes(tcg as TcgId)) {
      this.status.set('invalid-tcg');
      return;
    }

    const card = await this.cardCatalogService.getCardDetail(tcg as TcgId, externalId);

    if (!card) {
      this.status.set('not-found');
      return;
    }

    this.card.set(card);
    this.status.set('found');

    this.pricesLoading.set(true);
    const prices = await this.cardCatalogService.getVariantPrices(card);
    this.variantPrices.set(prices);
    this.pricesLoading.set(false);
  }
}
