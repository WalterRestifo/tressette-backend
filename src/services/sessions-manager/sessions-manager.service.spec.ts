import { Test, TestingModule } from '@nestjs/testing';
import { SessionsManagerService } from './sessions-manager.service';
import { Socket } from 'socket.io';
import { GameManagerService } from '../game-manager/game-manager/game-manager.service';

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

  it('should add, get and delete clients', () => {
    const mockClient = 'clientSocket1' as unknown as Socket;
    const key = 'client1';

    expect(service.getClient(key)).toBe(undefined);

    service.addClient(key, mockClient);
    expect(service.getClient(key)).toBe(mockClient);

    service.clearAllClientes();
    expect(service.getClient(key)).toBe(undefined);
  });

  it('should add, get and delete sessions', () => {
    const mockId = 'sessionId';
    const mockSession = { sessionId: mockId } as unknown as GameManagerService;

    expect(service.getSession(mockId)).toBe(undefined);

    service.addSession(mockSession);
    expect(service.getSession(mockId)).toBe(mockSession);

    service.clearAllSessions();
    expect(service.getSession(mockId)).toBe(undefined);
  });
});
