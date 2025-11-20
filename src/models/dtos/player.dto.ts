import { PlayerEnum } from '../enums';
import { DeckSingleCardDto } from './deckSingleCard.dto';

export type PlayerDto = {
  hand: DeckSingleCardDto[];
  name: PlayerEnum;
  isOwnTurn: boolean;
  inThisTrickPlayedCard: DeckSingleCardDto | undefined;
  fromOpponentPlayerLastDrawnCard: DeckSingleCardDto | undefined;
  points: number;
};
