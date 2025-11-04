import { DeckSingleCard } from './deck-single-card.model';
import { DeckSingleCardDto } from './dtos/deckSingleCard.dto';
import { PlayerEnum } from './enums';

export class Player {
  hand: DeckSingleCard[] = [];
  name: PlayerEnum;
  isOwnTurn = false;
  inThisTrickPlayedCard: DeckSingleCardDto | undefined;
  points: number = 0;
  constructor(name: PlayerEnum) {
    this.name = name;
  }
}
