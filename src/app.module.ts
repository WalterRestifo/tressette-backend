import { Module } from '@nestjs/common';
import { GameSyncModule } from './game-sync/game-sync.module';
import { GameManagerService } from './services/game-manager/game-manager/game-manager.service';

@Module({
  imports: [GameSyncModule],
  controllers: [],
  providers: [GameManagerService],
})
export class AppModule {}
