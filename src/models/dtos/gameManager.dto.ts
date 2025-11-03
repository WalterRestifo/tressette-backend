import { CardSuitEnum, PlayerEnum } from '../enums';
import { DeckSingleCardDto } from './deckSingleCard.dto';
import { PlayerDto } from './player.dto';
import { SessionIdentityDto } from './sessionIdentity.dto';

export type GameManagerDto = {
  player: PlayerDto;
  gameEnded: boolean;
  leadingSuit: CardSuitEnum | undefined;
  inThisTrickPlayedCards: {
    player1: DeckSingleCardDto | undefined;
    player2: DeckSingleCardDto | undefined;
  };
  currentPlayerName: PlayerEnum;
  sessionIdentity: SessionIdentityDto;
};
