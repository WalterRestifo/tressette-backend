import { PlayerEnum, SessionTypeEnum } from '../enums';

export type SessionDto = {
  sessionId: string;
  sessionType: SessionTypeEnum;
  player: PlayerEnum;
};
