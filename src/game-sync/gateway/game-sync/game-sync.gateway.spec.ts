import { Test, TestingModule } from '@nestjs/testing';
import { GameSyncGateway } from './game-sync.gateway';
import { SessionsManagerService } from '../../../services/sessions-manager/sessions-manager.service';

describe('GameSyncGateway', () => {
  let gateway: GameSyncGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameSyncGateway, SessionsManagerService],
    }).compile();

    gateway = module.get<GameSyncGateway>(GameSyncGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
