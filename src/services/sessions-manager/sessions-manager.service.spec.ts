import { Test, TestingModule } from '@nestjs/testing';
import { SessionsManagerService } from './sessions-manager.service';

describe('SessionsManagerService', () => {
  let service: SessionsManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionsManagerService],
    }).compile();

    service = module.get<SessionsManagerService>(SessionsManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
