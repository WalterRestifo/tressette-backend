import { Test, TestingModule } from '@nestjs/testing';
import { GameSyncGateway } from './game-sync.gateway';

describe('GameSyncGateway', () => {
  let gateway: GameSyncGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameSyncGateway],
    }).compile();

    gateway = module.get<GameSyncGateway>(GameSyncGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
