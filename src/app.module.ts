import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameSyncModule } from './game-sync/game-sync.module';
import { GameManagerService } from './services/game-manager/game-manager/game-manager.service';

@Module({
  imports: [GameSyncModule],
  controllers: [AppController],
  providers: [AppService, GameManagerService],
})
export class AppModule {}
