import { DeckSingleCardDto } from './dtos/deckSingleCard.dto';
import { PlayerEnum } from './enums';

export class Player {
  hand: DeckSingleCardDto[] = [];
  name: PlayerEnum;
  isOwnTurn = false;
  inThisTrickPlayedCard: DeckSingleCardDto | undefined;
  points: number = 0;
  fromOpponentPlayerLastDrawnCard: DeckSingleCardDto | undefined;
  constructor(name: PlayerEnum) {
    this.name = name;
  }
}
