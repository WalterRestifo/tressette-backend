import { DeckSingleCardDto } from './dtos/deckSingleCard.dto';
import { PlayerName } from './dtos/playerName.dto';

export class Player {
  hand: DeckSingleCardDto[] = [];
  name: PlayerName;
  isOwnTurn = false;
  inThisTrickPlayedCard: DeckSingleCardDto | undefined;
  points: number = 0;
  fromOpponentPlayerLastDrawnCard: DeckSingleCardDto | undefined;
  constructor(name: PlayerName) {
    this.name = name;
  }
}
