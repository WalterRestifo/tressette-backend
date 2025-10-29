import { Module } from '@nestjs/common';
import { GameSyncGateway } from './gateway/game-sync/game-sync.gateway';
import { GameManagerService } from 'src/services/game-manager/game-manager/game-manager.service';

@Module({
  imports: [GameManagerService],
  providers: [GameSyncGateway],
})
export class GameSyncModule {}
