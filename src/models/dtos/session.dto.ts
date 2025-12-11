import { SessionTypeEnum } from '../enums';
import { PlayerName } from './playerName.dto';

export type SessionDto = {
  sessionId: string;
  sessionType: SessionTypeEnum;
  player: PlayerName;
};
