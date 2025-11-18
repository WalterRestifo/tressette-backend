import { Module } from '@nestjs/common';
import { GameSyncModule } from './game-sync/game-sync.module';
import { GameManagerService } from './services/game-manager/game-manager/game-manager.service';
import { SessionsManagerService } from './services/sessions-manager/sessions-manager.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [GameSyncModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [
    GameManagerService,
    SessionsManagerService,
    SessionsManagerService,
  ],
})
export class AppModule {}
