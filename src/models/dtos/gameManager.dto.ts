import { CardSuitEnum } from '../enums';
import { DeckSingleCardDto } from './deckSingleCard.dto';
import { PlayerDto } from './player.dto';
import { PlayerName } from './playerName.dto';
import { SessionIdentityDto } from './sessionIdentity.dto';

export type GameManagerDto = {
  player: PlayerDto;
  gameEnded: boolean;
  leadingSuit?: CardSuitEnum;
  inThisTrickPlayedCards: {
    player1?: DeckSingleCardDto;
    player2?: DeckSingleCardDto;
  };
  currentPlayerName: PlayerName;
  sessionIdentity: SessionIdentityDto;
  winner?: PlayerDto;
};
