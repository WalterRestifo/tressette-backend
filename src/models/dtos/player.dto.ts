import { DeckSingleCardDto } from './deckSingleCard.dto';
import { PlayerName } from './playerName.dto';

export type PlayerDto = {
  hand: DeckSingleCardDto[];
  name: PlayerName;
  isOwnTurn: boolean;
  inThisTrickPlayedCard: DeckSingleCardDto | undefined;
  fromOpponentPlayerLastDrawnCard: DeckSingleCardDto | undefined;
  points: number;
};
