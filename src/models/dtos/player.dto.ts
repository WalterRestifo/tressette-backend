import { DeckSingleCard } from '../deck-single-card.model';
import { PlayerEnum } from '../enums';
import { DeckSingleCardDto } from './deckSingleCard.dto';

export type PlayerDto = {
  hand: DeckSingleCard[];
  name: PlayerEnum;
  isOwnTurn: boolean;
  inThisTrickPlayedCard: DeckSingleCardDto | undefined;
  points: number;
};
