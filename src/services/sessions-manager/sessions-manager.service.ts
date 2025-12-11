import { Injectable } from '@nestjs/common';
import { GameManagerService } from '../game-manager/game-manager/game-manager.service';
import { Socket } from 'socket.io';
import { PlayerName } from 'src/models/dtos/playerName.dto';

export type GameSessionClientSocket = {
  sessionId: string;
  player: PlayerName;
  clientInstance: Socket;
};

@Injectable()
export class SessionsManagerService {
  private sessions: GameManagerService[] = [];
  private clients: Map<string, GameSessionClientSocket> = new Map();
  private sessionsLimit = 100;

  addClient(key: string, clientInfo: GameSessionClientSocket) {
    this.clients.set(key, clientInfo);
  }

  getClient(key: string) {
    return this.clients.get(key);
  }

  clearAllClientes() {
    this.clients.clear();
  }

  /**
   * Adds the session to a list of sessions, if allowed
   * @param session
   * @returns a boolean indicating if the process of adding the session was successful
   */
  addSession(session: GameManagerService) {
    if (this.sessions.length > this.sessionsLimit) return false;
    else {
      this.sessions.push(session);
      return true;
    }
  }

  getSession(sessioIdToFind: string) {
    return this.sessions.find(({ sessionId }) => sessionId === sessioIdToFind);
  }

  clearAllSessions() {
    this.sessions = [];
  }
}
