import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardCatalogService } from '../../service/card-catalog.service';
import { Card, TcgId } from '../../types/card';

type DetailStatus = 'loading' | 'found' | 'not-found' | 'invalid-tcg';

const KNOWN_TCG_IDS: TcgId[] = ['pokemon', 'magic'];

@Component({
  imports: [],
  selector: 'app-card-detail',
  styleUrl: './card-detail.scss',
  templateUrl: './card-detail.html',
})
export class CardDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly cardCatalogService = inject(CardCatalogService);

  readonly status = signal<DetailStatus>('loading');
  readonly card = signal<Card | null>(null);

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
  }
}
