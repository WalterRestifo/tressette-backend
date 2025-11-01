import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameManagerDto } from 'src/models/dtos/gameManager.dto';
import { PlayerDto } from 'src/models/dtos/player.dto';
import { Player } from 'src/models/player.model';
import { GameManagerService } from 'src/services/game-manager/game-manager/game-manager.service';
import type { SessionDto } from 'src/models/dtos/session.dto';
import { PlayerEnum, SessionTypeEnum } from 'src/models/enums';
import type { SessionIdentityDto } from 'src/models/dtos/sessionIdentity.dto';
import { DeckSingleCardDto } from 'src/models/dtos/deckSingleCard.dto';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
  },
})
export class GameSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private sessions: GameManagerService[] = [];
  private clients = new Map<string, Socket>();

  @WebSocketServer()
  server: Server;

  handleConnection() {
    console.log('connection to gateway made');
  }

  handleDisconnect() {
    console.log('connection to gateway closed. Resetting sessions and clients');
    this.sessions = [];
    this.clients = new Map<string, Socket>();
  }

  @SubscribeMessage('playedCard')
  handlePlayCard(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      card: DeckSingleCardDto;
      player: PlayerDto;
      sessionIdentity: SessionIdentityDto;
    },
  ) {
    const sessionScopedGameManager = this.sessions.find(
      ({ sessionId }) => sessionId === payload.sessionIdentity.sessionId,
    );
    if (sessionScopedGameManager) {
      const { card, player } = payload;
      sessionScopedGameManager.playCard(card, player);
      const room = payload.sessionIdentity.sessionId;
      const updatedGameManager = this.createGameManagerDto(
        sessionScopedGameManager,
        player.name,
      );
      this.server.to(room).emit('newCardPlayed', updatedGameManager);
    } else {
      client.emit('error', { message: 'game manager session lost' });
    }
  }

  //todo: transfer this logic to an util
  private sanitizePlayer(player: Player): PlayerDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $isOwnTurn, ...rest } = player; // omit the observable because it cannot be parsed
    const result: PlayerDto = {
      ...rest,
      // replace the observable with the value of it
      isOwnTurn: player.$isOwnTurn.value,
    };
    return result;
  }
  //todo: transfer this logic to an util
  private createGameManagerDto(
    gameManager: GameManagerService,
    player: PlayerEnum,
  ): GameManagerDto {
    const { $gameEnded, $leadingSuit, player1, player2 } = gameManager;
    const player1Dto = this.sanitizePlayer(player1);
    let result = {
      gameEnded: $gameEnded.value,
      player: player1Dto,
      leadingSuit: $leadingSuit.value,
      inThisTrickPlayedCards: {
        player1: player1.inThisTrickPlayedCard,
        player2: player2.inThisTrickPlayedCard,
      },
      currentPlayer: this.sanitizePlayer(gameManager.getCurrentPlayer()),
      sessionIdentity: { sessionId: gameManager.sessionId, player: player },
    };

    if (player === PlayerEnum.Player2) {
      const player2Dto = this.sanitizePlayer(player2);
      result = { ...result, player: player2Dto };
    }

    return result;
  }

  async handleInitGame(
    @ConnectedSocket() client: Socket,
    sessionIdentity: SessionDto,
  ) {
    const sessionScopedGameManager = new GameManagerService(
      sessionIdentity.sessionId,
    );
    this.sessions.push(sessionScopedGameManager);
    const gameData = this.createGameManagerDto(
      sessionScopedGameManager,
      sessionIdentity.player,
    );
    const targetClient = this.clients.get(this.getKey(sessionIdentity));
    if (targetClient) {
      await targetClient.join(sessionIdentity.sessionId);
      targetClient.emit('gameInitialised', gameData);
    } else {
      client.emit('error', { message: 'client socket not found' });
    }
  }

  @SubscribeMessage('startNewGame')
  handleStartNewGame(
    @MessageBody() sessionIdentityData: SessionIdentityDto,
    @ConnectedSocket() client: Socket,
  ) {
    const openSession = this.getOpenSession(sessionIdentityData.sessionId);
    if (openSession) {
      openSession.startNewGame();
      const gameData = this.createGameManagerDto(
        openSession,
        sessionIdentityData.player,
      );
      client.emit('gameInitialised', gameData);
    } else {
      client.emit('error', { message: 'The session id was lost' });
    }
  }

  @SubscribeMessage('quitGame')
  handleEndGame(
    @MessageBody() sessionIdentityData: SessionIdentityDto,
    @ConnectedSocket() client: Socket,
  ) {
    const openSession = this.getOpenSession(sessionIdentityData.sessionId);
    if (openSession) {
      openSession.endGame();
      const gameData = this.createGameManagerDto(
        openSession,
        sessionIdentityData.player,
      );
      client.emit('gameQuitted', gameData.gameEnded);
    } else {
      client.emit('error', { message: 'The session id was lost' });
    }
  }

  private getOpenSession(sessionId: string) {
    return this.sessions.find(
      (openSession) => openSession.sessionId === sessionId,
    );
  }

  private getKey(sessionIdentity: SessionIdentityDto) {
    return `${sessionIdentity.sessionId}_${sessionIdentity.player}`;
  }

  private registerClient(sessionIdentity: SessionIdentityDto, client: Socket) {
    const key = this.getKey(sessionIdentity);
    this.clients.set(key, client);
  }

  @SubscribeMessage('sessionDataSended')
  async handleManageSession(
    @MessageBody() sessionData: SessionDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (sessionData.sessionType === SessionTypeEnum.New) {
      this.registerClient(sessionData, client);
      await this.handleInitGame(client, sessionData);
    } else {
      const openSession = this.getOpenSession(sessionData.sessionId);
      if (openSession) {
        this.registerClient(sessionData, client);
        const targetClient = this.clients.get(this.getKey(sessionData));
        if (targetClient) {
          await targetClient.join(sessionData.sessionId);
        } else {
          client.emit('error', { message: 'client socket not found' });
        }
        const gameData = this.createGameManagerDto(
          openSession,
          sessionData.player,
        );
        client.emit('gameInitialised', gameData);
      } else {
        client.emit('error', { message: 'session not found' });
      }
    }
  }
}
