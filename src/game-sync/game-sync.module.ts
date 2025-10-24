import { Module } from '@nestjs/common';
import { GameSyncGateway } from './gateway/game-sync/game-sync.gateway';

@Module({
  providers: [GameSyncGateway],
})
export class GameSyncModule {}
