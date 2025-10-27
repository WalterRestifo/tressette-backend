import { DeckSingleCard } from '../deck-single-card.model';

export type PlayerDto = {
  hand: DeckSingleCard[];
  name: string;
  isOwnTurn: boolean;
  inThisTrickPlayedCard: DeckSingleCard | undefined;
  points: number;
};
