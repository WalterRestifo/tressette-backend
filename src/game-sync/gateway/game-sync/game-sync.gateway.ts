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
  readonly amountOfPlayers = 2;
  private subscriptions = new Subscription();

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
    this.subscriptions.unsubscribe();
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
    const roomScopedGameManager = this.sessions.find(
      ({ sessionId }) => sessionId === payload.sessionIdentity.sessionId,
    );
    if (roomScopedGameManager) {
      const { card, player } = payload;
      roomScopedGameManager.playCard(card, player);
      roomScopedGameManager.updateTurn();
      const room = payload.sessionIdentity.sessionId;
      const updatedGameManager = this.createGameManagerDto(
        roomScopedGameManager,
        player.name,
      );
      this.server.to(room).emit('newCardPlayed', updatedGameManager);

      if (roomScopedGameManager.playedCardCount === this.amountOfPlayers) {
        await roomScopedGameManager.playRound();
        const newTrickPlayer1Manager = this.createGameManagerDto(
          roomScopedGameManager,
          PlayerEnum.Player1,
        );
        const newTrickPlayer2Manager = this.createGameManagerDto(
          roomScopedGameManager,
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

  @SubscribeMessage('startNewGame')
  handleStartNewGame(
    @MessageBody() sessionIdentityData: SessionIdentityDto,
    @ConnectedSocket() client: Socket,
  ) {
    const roomScopedGameManager = this.getCorrectGameManagerInstance(
      sessionIdentityData.sessionId,
    );
    if (roomScopedGameManager) {
      roomScopedGameManager.startNewGame();
      const gameData = this.createGameManagerDto(
        roomScopedGameManager,
        sessionIdentityData.player,
      );
      client.emit('gameInitialised', gameData);
    } else {
      client.emit('error', { message: 'The session id was lost' });
    }
  }

  @SubscribeMessage('endGame')
  handleEndGame(@MessageBody() sessionIdentityData: SessionIdentityDto) {
    const roomScopedGameManager = this.getCorrectGameManagerInstance(
      sessionIdentityData.sessionId,
    );
    const room = sessionIdentityData.sessionId;
    if (roomScopedGameManager) {
      roomScopedGameManager.endGame();
    } else {
      this.server
        .to(room)
        .emit('error', { message: 'The session id was lost' });
    }
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
      const roomScopedGameManager = this.getCorrectGameManagerInstance(
        sessionData.sessionId,
      );
      if (roomScopedGameManager) {
        this.registerClient(sessionData, client);
        const targetClient = this.clients.get(this.getKey(sessionData));
        if (targetClient) {
          await targetClient.join(sessionData.sessionId);
        } else {
          client.emit('error', { message: 'client socket not found' });
        }
        const gameData = this.createGameManagerDto(
          roomScopedGameManager,
          sessionData.player,
        );
        client.emit('gameInitialised', gameData);
      } else {
        client.emit('error', { message: 'session not found' });
      }
    }
  }

  private createGameManagerDto(
    gameManager: GameManagerService,
    player: PlayerEnum,
  ): GameManagerDto {
    const { $gameEnded, leadingSuit, player1, player2 } = gameManager;
    let result = {
      gameEnded: $gameEnded.value,
      player: player1,
      leadingSuit: leadingSuit,
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

  private async handleInitGame(
    @ConnectedSocket() client: Socket,
    sessionIdentity: SessionDto,
  ) {
    const roomScopedGameManager = new GameManagerService(
      sessionIdentity.sessionId,
    );
    this.sessions.push(roomScopedGameManager);

    const endGameSub = roomScopedGameManager.$gameEnded.subscribe((value) => {
      if (value) {
        const room = sessionIdentity.sessionId;
        const gameManagerDto = this.createGameManagerDto(
          roomScopedGameManager,
          roomScopedGameManager.winner?.name ?? PlayerEnum.Player1,
        );
        this.server.to(room).emit('gameEnded', gameManagerDto);
      }
    });
    this.subscriptions.add(endGameSub);
    const gameData = this.createGameManagerDto(
      roomScopedGameManager,
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

  private getCorrectGameManagerInstance(sessionId: string) {
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
}
