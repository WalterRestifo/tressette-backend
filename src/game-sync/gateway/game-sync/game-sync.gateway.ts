import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GameManagerDto } from 'src/models/dtos/gameManager.dto';
import { PlayerDto } from 'src/models/dtos/player.dto';
import { Player } from 'src/models/player.model';
import { GameManagerService } from 'src/services/game-manager/game-manager/game-manager.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
  },
})
export class GameSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private gameManager: GameManagerService) {}

  handleConnection() {
    console.log('connection to gateway made');
  }

  handleDisconnect() {
    console.log('connection to gateway closed');
  }

  @SubscribeMessage('playedCard')
  handlePlayCard(
    // @MessageBody() payloadFromClient: { card: DeckSingleCard; player: Player },
    @MessageBody() testPayloadFromClient,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('payload from client: ', testPayloadFromClient);

    client.emit('newCardPlayed', testPayloadFromClient);
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
  private createGameManagerDto(gameManager: GameManagerService) {
    const { $gameEnded, $leadingSuit, player1, player2, deck } = gameManager;
    const player1Dto = this.sanitizePlayer(player1);
    const player2Dto = this.sanitizePlayer(player2);
    const result: GameManagerDto = {
      deck: deck,
      player1: player1Dto,
      player2: player2Dto,
      gameEnded: $gameEnded.value,
      leadingSuit: $leadingSuit.value,
      inThisTrickPlayedCards: {
        player1: player1.inThisTrickPlayedCard,
        player2: player2.inThisTrickPlayedCard,
      },
      currentPlayer: this.sanitizePlayer(gameManager.getCurrentPlayer()),
    };
    return result;
  }

  @SubscribeMessage('initGame')
  handleInitGame(@ConnectedSocket() client: Socket) {
    const gameData = this.createGameManagerDto(this.gameManager);
    client.emit('gameInitialised', gameData);
  }

  @SubscribeMessage('startNewGame')
  handleStartNewGame(@ConnectedSocket() client: Socket) {
    this.gameManager.startNewGame();
    const gameData = this.createGameManagerDto(this.gameManager);
    client.emit('gameInitialised', gameData);
  }

  @SubscribeMessage('quitGame')
  handleEndGame(@ConnectedSocket() client: Socket) {
    this.gameManager.endGame();
    const gameData = this.createGameManagerDto(this.gameManager);
    client.emit('gameQuitted', gameData.gameEnded);
  }
}
