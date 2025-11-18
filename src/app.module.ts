import { Module } from '@nestjs/common';
import { GameSyncModule } from './game-sync/game-sync.module';
import { GameManagerService } from './services/game-manager/game-manager/game-manager.service';
import { SessionsManagerService } from './services/sessions-manager/sessions-manager.service';

@Module({
  imports: [GameSyncModule],
  controllers: [],
  providers: [
    GameManagerService,
    SessionsManagerService,
    SessionsManagerService,
  ],
})
export class AppModule {}
