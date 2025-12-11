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
import { GameManagerDto } from '../../../models/dtos/gameManager.dto';
import { PlayerDto } from '../../../models/dtos/player.dto';
import { GameManagerService } from '../../../services/game-manager/game-manager/game-manager.service';
import type { SessionDto } from '../../../models/dtos/session.dto';
import { PlayerEnum, SessionTypeEnum } from '../../../models/enums';
import type { SessionIdentityDto } from '../../../models/dtos/sessionIdentity.dto';
import { DeckSingleCardDto } from '../../../models/dtos/deckSingleCard.dto';
import { Subscription } from 'rxjs';
import {
  type GameSessionClientSocket,
  SessionsManagerService,
} from '../../../services/sessions-manager/sessions-manager.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
})
export class GameSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  readonly amountOfPlayers = 2;
  private subscriptions = new Subscription();

  constructor(private sessionsManager: SessionsManagerService) {}

  @WebSocketServer()
  server: Server;

  handleConnection() {
    console.log('connection to gateway made');
  }

  handleDisconnect() {
    console.log(
      'connection to gateway closed. Resetting sessions, clients and subscriptions',
    );
    this.sessionsManager.clearAllClientes();
    this.sessionsManager.clearAllSessions();
    this.subscriptions.unsubscribe();
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
    const roomScopedGameManager = this.sessionsManager.getSession(
      payload.sessionIdentity.sessionId,
    );
    if (roomScopedGameManager) {
      const { card, player } = payload;
      roomScopedGameManager.playCard(card, player);
      roomScopedGameManager.updateTurn();
      const room = payload.sessionIdentity.sessionId;
      const updatedGameManager = this.createGameManagerDto(
        roomScopedGameManager,
        player.name.enumName,
      );
      this.server.to(room).emit('newCardPlayed', updatedGameManager);

      if (roomScopedGameManager.playedCardCount === this.amountOfPlayers) {
        roomScopedGameManager.playRound();
        const newTrickPlayer1Manager = this.createGameManagerDto(
          roomScopedGameManager,
          PlayerEnum.Player1,
        );
        const newTrickPlayer2Manager = this.createGameManagerDto(
          roomScopedGameManager,
          PlayerEnum.Player2,
        );
        const clientSocket1 = this.sessionsManager.getClient(
          this.getKey(payload.sessionIdentity.sessionId, PlayerEnum.Player1),
        );
        const clientSocket2 = this.sessionsManager.getClient(
          this.getKey(payload.sessionIdentity.sessionId, PlayerEnum.Player2),
        );

        clientSocket1?.clientInstance.emit(
          'newTrickUpdate',
          newTrickPlayer1Manager,
        );
        clientSocket2?.clientInstance.emit(
          'newTrickUpdate',
          newTrickPlayer2Manager,
        );
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
    const roomScopedGameManager = this.sessionsManager.getSession(
      sessionIdentityData.sessionId,
    );
    if (roomScopedGameManager) {
      roomScopedGameManager.startNewGame();
      const gameData = this.createGameManagerDto(
        roomScopedGameManager,
        sessionIdentityData.player.enumName,
      );
      client.emit('gameInitialised', gameData);
    } else {
      client.emit('error', { message: 'The session id was lost' });
    }
  }

  @SubscribeMessage('endGame')
  handleEndGame(@MessageBody() sessionIdentityData: SessionIdentityDto) {
    const roomScopedGameManager = this.sessionsManager.getSession(
      sessionIdentityData.sessionId,
    );
    const room = sessionIdentityData.sessionId;
    if (roomScopedGameManager) {
      roomScopedGameManager.endGame();

      const clientSocket1 = this.sessionsManager.getClient(
        this.getKey(sessionIdentityData.sessionId, PlayerEnum.Player1),
      );
      const clientSocket2 = this.sessionsManager.getClient(
        this.getKey(sessionIdentityData.sessionId, PlayerEnum.Player2),
      );
      clientSocket1?.clientInstance.emit(
        'gameEnded',
        this.createGameManagerDto(roomScopedGameManager, PlayerEnum.Player1),
      );
      clientSocket2?.clientInstance.emit(
        'gameEnded',
        this.createGameManagerDto(roomScopedGameManager, PlayerEnum.Player2),
      );
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
    this.registerClient(sessionData, client);
    await client.join(sessionData.sessionId);

    if (sessionData.sessionType === SessionTypeEnum.Join) {
      const clientSocket1 = this.sessionsManager.getClient(
        this.getKey(sessionData.sessionId, PlayerEnum.Player1),
      );
      const clientSocket2 = this.sessionsManager.getClient(
        this.getKey(sessionData.sessionId, PlayerEnum.Player2),
      );

      if (!clientSocket1 || !clientSocket2) {
        return client.emit('error', {
          message: 'Player 1 or Player 2 not found',
        });
      } else {
        this.handleInitGame(client, sessionData, clientSocket1, clientSocket2);
      }
    }
    // ab hier weiter schauen ob die Logik stimmt
    const roomScopedGameManager = this.sessionsManager.getSession(
      sessionData.sessionId,
    );
    if (roomScopedGameManager) {
      const gameData = this.createGameManagerDto(
        roomScopedGameManager,
        sessionData.player.enumName,
      );
      client.emit('gameInitialised', gameData);
    } else {
      client.emit('error', { message: 'session not found' });
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
      sessionIdentity: {
        sessionId: gameManager.sessionId,
        player: player1.name,
      },
      winner: gameManager.winner,
    };

    if (player === PlayerEnum.Player2) {
      result = {
        ...result,
        player: player2,
        sessionIdentity: {
          sessionId: gameManager.sessionId,
          player: player2.name,
        },
      };
    }

    return result;
  }

  private handleInitGame(
    @ConnectedSocket() client: Socket,
    sessionIdentity: SessionDto,
    player1ClientSocket: GameSessionClientSocket,
    player2ClientSocket: GameSessionClientSocket,
  ) {
    const roomScopedGameManager = new GameManagerService(
      sessionIdentity.sessionId,
      player1ClientSocket.player.userName,
      player2ClientSocket.player.userName,
    );
    const successfulAdded = this.sessionsManager.addSession(
      roomScopedGameManager,
    );
    if (!successfulAdded) {
      return client.emit('error', {
        message: 'Too many open sessions in the server. Try again later.',
      });
    }

    const endGameSub = roomScopedGameManager.$gameEnded.subscribe((value) => {
      if (value) {
        const room = sessionIdentity.sessionId;
        const gameManagerDto = this.createGameManagerDto(
          roomScopedGameManager,
          roomScopedGameManager.winner?.name.enumName ?? PlayerEnum.Player1,
        );
        this.server.to(room).emit('gameEnded', gameManagerDto);
      }
    });
    this.subscriptions.add(endGameSub);

    const gameData1 = this.createGameManagerDto(
      roomScopedGameManager,
      PlayerEnum.Player1,
    );

    const gameData2 = this.createGameManagerDto(
      roomScopedGameManager,
      PlayerEnum.Player2,
    );

    player1ClientSocket.clientInstance.emit('gameInitialised', gameData1);

    player2ClientSocket.clientInstance.emit('gameInitialised', gameData2);
  }

  private getKey(sessionId: string, playerEnum: PlayerEnum) {
    return `${sessionId}_${playerEnum}`;
  }

  private registerClient(sessionIdentity: SessionIdentityDto, client: Socket) {
    const key = this.getKey(
      sessionIdentity.sessionId,
      sessionIdentity.player.enumName,
    );
    this.sessionsManager.addClient(key, {
      sessionId: sessionIdentity.sessionId,
      player: sessionIdentity.player,
      clientInstance: client,
    });
  }
}
