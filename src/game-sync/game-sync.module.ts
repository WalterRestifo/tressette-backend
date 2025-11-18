import { Module } from '@nestjs/common';
import { GameSyncGateway } from './gateway/game-sync/game-sync.gateway';
import { GameManagerService } from 'src/services/game-manager/game-manager/game-manager.service';
import { SessionsManagerService } from 'src/services/sessions-manager/sessions-manager.service';

@Module({
  imports: [GameManagerService],
  providers: [GameSyncGateway, SessionsManagerService],
})
export class GameSyncModule {}
