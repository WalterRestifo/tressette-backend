import { CardSuitEnum, PlayerEnum } from '../enums';
import { DeckSingleCardDto } from './deckSingleCard.dto';
import { PlayerDto } from './player.dto';
import { SessionIdentityDto } from './sessionIdentity.dto';

export type GameManagerDto = {
  player: PlayerDto;
  gameEnded: boolean;
  leadingSuit?: CardSuitEnum;
  inThisTrickPlayedCards: {
    player1?: DeckSingleCardDto;
    player2?: DeckSingleCardDto;
  };
  currentPlayerName: PlayerEnum;
  sessionIdentity: SessionIdentityDto;
  winner?: PlayerDto;
};
