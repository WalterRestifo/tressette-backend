import { DeckSingleCard } from '../deck-single-card.model';
import { CardSuitEnum } from '../enums';
import { PlayerDto } from './player.dto';

export type GameManagerDto = {
  player: PlayerDto;
  gameEnded: boolean;
  leadingSuit: CardSuitEnum | undefined;
  inThisTrickPlayedCards: {
    player1: DeckSingleCard | undefined;
    player2: DeckSingleCard | undefined;
  };
  currentPlayer: PlayerDto;
};
