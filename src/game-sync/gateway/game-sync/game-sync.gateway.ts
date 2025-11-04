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
import { GameManagerService } from 'src/services/game-manager/game-manager/game-manager.service';
import type { SessionDto } from 'src/models/dtos/session.dto';
import { PlayerEnum, SessionTypeEnum } from 'src/models/enums';
import type { SessionIdentityDto } from 'src/models/dtos/sessionIdentity.dto';
import { DeckSingleCardDto } from 'src/models/dtos/deckSingleCard.dto';
import { Subscription } from 'rxjs';

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
  private amountOfPlayers = 2;
  private subscriptions: Subscription[] = [];

  @WebSocketServer()
  server: Server;

  handleConnection() {
    console.log('connection to gateway made');
  }

  handleDisconnect() {
    console.log(
      'connection to gateway closed. Resetting sessions, clients and subscriptions',
    );
    this.sessions = [];
    this.clients = new Map<string, Socket>();
    this.subscriptions = [];
  }

  @SubscribeMessage('playedCard')
  async handlePlayCard(
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
      sessionScopedGameManager.updateTurn();
      const room = payload.sessionIdentity.sessionId;
      const updatedGameManager = this.createGameManagerDto(
        sessionScopedGameManager,
        player.name,
      );
      this.server.to(room).emit('newCardPlayed', updatedGameManager);

      if (sessionScopedGameManager.playedCardCount === this.amountOfPlayers) {
        await sessionScopedGameManager.playRound();
        const newTrickPlayer1Manager = this.createGameManagerDto(
          sessionScopedGameManager,
          PlayerEnum.Player1,
        );
        const newTrickPlayer2Manager = this.createGameManagerDto(
          sessionScopedGameManager,
          PlayerEnum.Player2,
        );
        const player1Client = this.clients.get(
          this.getKey({
            sessionId: payload.sessionIdentity.sessionId,
            player: PlayerEnum.Player1,
          }),
        );
        const player2Client = this.clients.get(
          this.getKey({
            sessionId: payload.sessionIdentity.sessionId,
            player: PlayerEnum.Player2,
          }),
        );

        player1Client?.emit('newTrickUpdate', newTrickPlayer1Manager);
        player2Client?.emit('newTrickUpdate', newTrickPlayer2Manager);
      }
    } else {
      client.emit('error', { message: 'game manager session lost' });
    }
  }

  //todo: transfer this logic to an util
  private createGameManagerDto(
    gameManager: GameManagerService,
    player: PlayerEnum,
  ): GameManagerDto {
    const { $gameEnded, $leadingSuit, player1, player2 } = gameManager;
    let result = {
      gameEnded: $gameEnded.value,
      player: player1,
      leadingSuit: $leadingSuit.value,
      inThisTrickPlayedCards: {
        player1: player1.inThisTrickPlayedCard,
        player2: player2.inThisTrickPlayedCard,
      },
      currentPlayerName: gameManager.getCurrentPlayer().name,
      sessionIdentity: { sessionId: gameManager.sessionId, player: player },
    };

    if (player === PlayerEnum.Player2) {
      result = { ...result, player: player2 };
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

    const endGameSub = sessionScopedGameManager.$gameEnded.subscribe(
      (value) => {
        if (value) {
          const room = sessionIdentity.sessionId;
          const gameManagerDto = this.createGameManagerDto(
            sessionScopedGameManager,
            sessionScopedGameManager.winner?.name ?? PlayerEnum.Player1,
          );
          this.server.to(room).emit('gameEnded', gameManagerDto);
        }
      },
    );
    this.subscriptions.push(endGameSub);
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
  handleEndGame(@MessageBody() sessionIdentityData: SessionIdentityDto) {
    const openSession = this.getOpenSession(sessionIdentityData.sessionId);
    const room = sessionIdentityData.sessionId;
    if (openSession) {
      openSession.endGame();
    } else {
      this.server
        .to(room)
        .emit('error', { message: 'The session id was lost' });
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
